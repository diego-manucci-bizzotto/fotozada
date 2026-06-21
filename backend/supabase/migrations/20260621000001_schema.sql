-- Fotozada — base schema (batch -> jobs -> photos + kiosk settings + admins)
-- A "batch" is one user submission (the cart). It holds N "jobs", each job is
-- one composed sheet (folha) with a copies count. The simulated printer (and,
-- later, the real Raspberry Pi) processes jobs one by one.

create extension if not exists pgcrypto;

-- Per-kiosk controls (single row per kiosk for this phase).
create table public.kiosk_settings (
  kiosk_id            text primary key,
  queue_paused        boolean not null default false,
  require_approval    boolean not null default false,
  max_sheets_per_batch int    not null default 5 check (max_sheets_per_batch > 0),
  keep_files          boolean not null default true,   -- keep storage files for admin preview
  layout_config       jsonb   not null default '{
    "single_10x15": {"label": "Foto 10x15", "photos": 1, "width": 1200, "height": 1800, "aspect": 0.6667},
    "strip_3":      {"label": "Tirinha de 3", "photos": 3, "width": 1200, "height": 1800, "frame_aspect": 2.0}
  }'::jsonb,
  updated_at          timestamptz not null default now()
);

insert into public.kiosk_settings (kiosk_id) values ('kiosk-01')
  on conflict (kiosk_id) do nothing;

-- One row per user submission (cart).
create table public.print_batches (
  id                 uuid primary key default gen_random_uuid(),
  kiosk_id           text not null references public.kiosk_settings(kiosk_id),
  device_id          text not null,
  client_request_id  text not null unique,            -- idempotency key (anti double-submit)
  total_sheets       int  not null,                   -- sum of copies, validated <= max
  user_agent         text,
  ip                 text,
  created_at         timestamptz not null default now()
);

-- One row per cart item = one composed sheet (printed `copies` times).
create table public.print_jobs (
  id            uuid primary key default gen_random_uuid(),
  batch_id      uuid not null references public.print_batches(id) on delete cascade,
  kiosk_id      text not null references public.kiosk_settings(kiosk_id),
  device_id     text not null,
  idx           int  not null,                         -- order within the batch
  layout        text not null check (layout in ('single_10x15','strip_3')),
  copies        int  not null default 1 check (copies > 0),
  composed_path text not null,                         -- final image the printer outputs
  composed_hash text,                                  -- sha-256 of the composed image
  status        text not null default 'queued'
                  check (status in ('pending_approval','queued','printing','done','error','canceled')),
  error         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  printing_at   timestamptz,
  printed_at    timestamptz,
  print_ms      int
);
create index print_jobs_queue_idx on public.print_jobs (kiosk_id, status, created_at);
create index print_jobs_batch_idx on public.print_jobs (batch_id);

-- Source photos for each item (1 for 10x15, 3 for the strip). Kept for
-- record / preview / exact reprint.
create table public.print_job_photos (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid not null references public.print_jobs(id) on delete cascade,
  idx          int  not null,
  storage_path text not null,
  width        int,
  height       int,
  size_bytes   int,
  crop         jsonb
);
create index print_job_photos_job_idx on public.print_job_photos (job_id);

-- Who may access /admin. Seed the first row manually (see README).
create table public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- keep updated_at fresh on print_jobs
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_print_jobs_touch
  before update on public.print_jobs
  for each row execute function public.touch_updated_at();
