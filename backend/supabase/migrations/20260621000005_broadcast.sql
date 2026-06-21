-- Realtime Broadcast of job status to the end user.
--
-- The user is anon and must NOT get a SELECT policy on print_jobs (would leak
-- other people's PII). Instead, every job insert / status change is broadcast
-- on a public topic keyed by the batch id. The batch id is an unguessable uuid,
-- so knowing it is the capability to watch that batch. The frontend subscribes
-- to `batch-status:<batch_id>` and listens for the `job_status` event.

create or replace function public.broadcast_job_status()
returns trigger
language plpgsql
security definer
set search_path = public, realtime
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'job_id',     new.id,
      'batch_id',   new.batch_id,
      'idx',        new.idx,
      'layout',     new.layout,
      'copies',     new.copies,
      'status',     new.status,
      'error',      new.error,
      'updated_at', new.updated_at
    ),
    'job_status',                              -- event
    'batch-status:' || new.batch_id::text,     -- topic
    false                                      -- public channel (batch_id is the secret)
  );
  return new;
end;
$$;

create trigger trg_broadcast_job_insert
  after insert on public.print_jobs
  for each row execute function public.broadcast_job_status();

create trigger trg_broadcast_job_status
  after update of status on public.print_jobs
  for each row execute function public.broadcast_job_status();
