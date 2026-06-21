-- Transactional RPCs.

-- create_print_batch: atomically validates and creates a batch + its jobs +
-- photos. Called by the create-print-job Edge Function (service role).
-- p_items: [
--   { "layout": "single_10x15"|"strip_3", "copies": 1,
--     "composed_path": "...", "composed_hash": "...",
--     "photos": [ { "idx":0, "storage_path":"...", "width":..,"height":..,"size_bytes":..,"crop":{..} } ] },
--   ...
-- ]
create or replace function public.create_print_batch(
  p_kiosk_id          text,
  p_device_id         text,
  p_client_request_id text,
  p_user_agent        text,
  p_ip                text,
  p_items             jsonb
) returns jsonb
language plpgsql
as $$
declare
  v_settings public.kiosk_settings;
  v_existing public.print_batches;
  v_total    int := 0;
  v_status   text;
  v_batch_id uuid;
  v_job_id   uuid;
  v_job_ids  uuid[] := '{}';
  v_idx      int := 0;
  v_item     jsonb;
  v_photo    jsonb;
begin
  -- Idempotency: a known client_request_id returns the existing batch.
  select * into v_existing from public.print_batches where client_request_id = p_client_request_id;
  if found then
    return jsonb_build_object(
      'batch_id', v_existing.id,
      'idempotent', true,
      'job_ids', coalesce((select jsonb_agg(id order by idx) from public.print_jobs where batch_id = v_existing.id), '[]'::jsonb)
    );
  end if;

  select * into v_settings from public.kiosk_settings where kiosk_id = p_kiosk_id;
  if not found then
    return jsonb_build_object('error', 'unknown_kiosk');
  end if;

  select coalesce(sum((i->>'copies')::int), 0) into v_total
  from jsonb_array_elements(p_items) i;

  if v_total <= 0 then
    return jsonb_build_object('error', 'empty_batch');
  end if;
  if v_total > v_settings.max_sheets_per_batch then
    return jsonb_build_object('blocked', true, 'reason', 'batch_limit',
                              'max', v_settings.max_sheets_per_batch, 'requested', v_total);
  end if;

  v_status := case when v_settings.require_approval then 'pending_approval' else 'queued' end;

  -- Insert batch; if a concurrent identical submit beat us, fall back to it.
  begin
    insert into public.print_batches (kiosk_id, device_id, client_request_id, total_sheets, user_agent, ip)
    values (p_kiosk_id, p_device_id, p_client_request_id, v_total, p_user_agent, p_ip)
    returning id into v_batch_id;
  exception when unique_violation then
    select * into v_existing from public.print_batches where client_request_id = p_client_request_id;
    return jsonb_build_object(
      'batch_id', v_existing.id, 'idempotent', true,
      'job_ids', coalesce((select jsonb_agg(id order by idx) from public.print_jobs where batch_id = v_existing.id), '[]'::jsonb)
    );
  end;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.print_jobs
      (batch_id, kiosk_id, device_id, idx, layout, copies, composed_path, composed_hash, status)
    values
      (v_batch_id, p_kiosk_id, p_device_id, v_idx,
       v_item->>'layout',
       coalesce((v_item->>'copies')::int, 1),
       v_item->>'composed_path',
       v_item->>'composed_hash',
       v_status)
    returning id into v_job_id;

    v_job_ids := v_job_ids || v_job_id;

    for v_photo in select * from jsonb_array_elements(coalesce(v_item->'photos', '[]'::jsonb))
    loop
      insert into public.print_job_photos (job_id, idx, storage_path, width, height, size_bytes, crop)
      values (
        v_job_id,
        coalesce((v_photo->>'idx')::int, 0),
        v_photo->>'storage_path',
        (v_photo->>'width')::int,
        (v_photo->>'height')::int,
        (v_photo->>'size_bytes')::int,
        v_photo->'crop'
      );
    end loop;

    v_idx := v_idx + 1;
  end loop;

  return jsonb_build_object('batch_id', v_batch_id, 'idempotent', false,
                            'status', v_status, 'job_ids', to_jsonb(v_job_ids));
end;
$$;
grant execute on function public.create_print_batch(text,text,text,text,text,jsonb) to service_role;

-- tick_simulated_printer: stand-in for the Raspberry Pi worker. Each call
-- finishes any job that has been "printing" for >= 2s, then (if the queue is
-- not paused and nothing is printing) claims the oldest queued job. Driven by
-- pg_cron every few seconds; also callable from the admin "simular agora"
-- button. Replace by turning off the cron and running the real Pi worker.
create or replace function public.tick_simulated_printer(p_kiosk_id text default 'kiosk-01')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paused   boolean;
  v_finished int := 0;
  v_started  uuid;
begin
  select queue_paused into v_paused from public.kiosk_settings where kiosk_id = p_kiosk_id;

  with finished as (
    update public.print_jobs
    set status = 'done',
        printed_at = now(),
        print_ms = greatest(1, (extract(epoch from (now() - printing_at)) * 1000)::int)
    where kiosk_id = p_kiosk_id
      and status = 'printing'
      and printing_at <= now() - interval '2 seconds'
    returning 1
  )
  select count(*) into v_finished from finished;

  if coalesce(v_paused, false) = false
     and not exists (select 1 from public.print_jobs where kiosk_id = p_kiosk_id and status = 'printing')
  then
    update public.print_jobs
    set status = 'printing', printing_at = now()
    where id = (
      select id from public.print_jobs
      where kiosk_id = p_kiosk_id and status = 'queued'
      order by created_at, idx
      for update skip locked
      limit 1
    )
    returning id into v_started;
  end if;

  return jsonb_build_object('finished', v_finished, 'started', v_started);
end;
$$;
grant execute on function public.tick_simulated_printer(text) to anon, authenticated, service_role;

-- admin_reprint_job: re-queue a copy of an existing job (same composed image).
create or replace function public.admin_reprint_job(p_job_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_src      public.print_jobs;
  v_new_id   uuid;
  v_next_idx int;
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  select * into v_src from public.print_jobs where id = p_job_id;
  if not found then
    raise exception 'job_not_found';
  end if;

  select coalesce(max(idx), -1) + 1 into v_next_idx
  from public.print_jobs where batch_id = v_src.batch_id;

  insert into public.print_jobs
    (batch_id, kiosk_id, device_id, idx, layout, copies, composed_path, composed_hash, status)
  values
    (v_src.batch_id, v_src.kiosk_id, v_src.device_id, v_next_idx,
     v_src.layout, v_src.copies, v_src.composed_path, v_src.composed_hash, 'queued')
  returning id into v_new_id;

  insert into public.print_job_photos (job_id, idx, storage_path, width, height, size_bytes, crop)
  select v_new_id, idx, storage_path, width, height, size_bytes, crop
  from public.print_job_photos where job_id = p_job_id;

  return v_new_id;
end;
$$;
grant execute on function public.admin_reprint_job(uuid) to authenticated, service_role;
