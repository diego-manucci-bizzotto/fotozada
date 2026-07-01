-- queue_position: lets an end-user kiosk learn how many jobs are ahead of its
-- own batch WITHOUT being able to read other people's rows (RLS keeps print_jobs
-- admin-only). The unguessable batch_id is the capability — we only ever return
-- a count for a batch the caller already holds the id of. No PII leaves the DB.
--
-- Returns: { "pending": bool, "ahead": int }
--   pending = the batch still has queued/printing jobs
--   ahead   = number of OTHER jobs in the same kiosk that print before it
--             (queue order = created_at, idx — same as tick_simulated_printer).
--   Your place in line = ahead + 1. ahead = 0 means you're next / printing now.
create or replace function public.queue_position(p_batch_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_kiosk   text;
  v_created timestamptz;
  v_idx     int;
  v_ahead   int;
begin
  -- The batch's earliest still-pending job sets its place in line.
  select kiosk_id, created_at, idx
    into v_kiosk, v_created, v_idx
  from public.print_jobs
  where batch_id = p_batch_id
    and status in ('queued', 'printing')
  order by created_at, idx
  limit 1;

  if not found then
    return jsonb_build_object('pending', false, 'ahead', 0);
  end if;

  select count(*) into v_ahead
  from public.print_jobs j
  where j.kiosk_id = v_kiosk
    and j.status in ('queued', 'printing')
    and j.batch_id <> p_batch_id
    and (j.created_at, j.idx) < (v_created, v_idx);

  return jsonb_build_object('pending', true, 'ahead', v_ahead);
end;
$$;

grant execute on function public.queue_position(uuid) to anon, authenticated, service_role;
