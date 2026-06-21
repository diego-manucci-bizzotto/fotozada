-- Realtime publication (for the admin dashboard's postgres_changes feed) and
-- the pg_cron schedules that drive the simulated printer + cleanup.

-- Admin live queue/history uses postgres_changes on these tables.
do $$ begin
  alter publication supabase_realtime add table public.print_jobs;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.print_batches;
exception when duplicate_object then null; end $$;

-- pg_cron may already be enabled on the project; this is a no-op if so.
-- If your role lacks permission here, enable "pg_cron" via the Supabase
-- dashboard (Database > Extensions) and re-run the cron.schedule() calls below.
create extension if not exists pg_cron;

-- Advance the simulated printer every 6 seconds (stand-in for the Raspberry Pi).
select cron.schedule(
  'fotozada-printer-tick',
  '6 seconds',
  $$ select public.tick_simulated_printer('kiosk-01'); $$
);

-- Safety-net cleanup: drop batches (cascades to jobs + photos) older than ~1h.
-- NOTE: this removes DB rows only; storage objects for old batches are left to
-- a later storage-cleanup job (see README).
select cron.schedule(
  'fotozada-cleanup',
  '0 * * * *',
  $$ delete from public.print_batches where created_at < now() - interval '1 hour'; $$
);
