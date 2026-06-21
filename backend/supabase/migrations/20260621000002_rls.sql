-- Row Level Security.
--
-- Model:
--   * anon cannot write any print table (all writes go through Edge Functions
--     that use the service role, which bypasses RLS).
--   * anon CAN read kiosk_settings (the UI needs layout_config + the sheet limit).
--   * admins (rows in public.admins) can read everything and update the control
--     columns. Status delivery to the end user is via Realtime Broadcast, not a
--     SELECT policy, so anon never sees other people's jobs / PII.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.kiosk_settings   enable row level security;
alter table public.print_batches    enable row level security;
alter table public.print_jobs       enable row level security;
alter table public.print_job_photos enable row level security;
alter table public.admins           enable row level security;

-- kiosk_settings: world-readable, admin-writable.
create policy "kiosk_settings_read"   on public.kiosk_settings for select using (true);
create policy "kiosk_settings_update" on public.kiosk_settings for update
  using (public.is_admin()) with check (public.is_admin());

-- print_batches: admin read only (service role writes, bypassing RLS).
create policy "batches_admin_read" on public.print_batches for select using (public.is_admin());

-- print_jobs: admin read + admin update (queue controls / approve / cancel).
create policy "jobs_admin_read"   on public.print_jobs for select using (public.is_admin());
create policy "jobs_admin_update" on public.print_jobs for update
  using (public.is_admin()) with check (public.is_admin());

-- print_job_photos: admin read only.
create policy "photos_admin_read" on public.print_job_photos for select using (public.is_admin());

-- admins: an admin can see the admin list.
create policy "admins_admin_read" on public.admins for select using (public.is_admin());
