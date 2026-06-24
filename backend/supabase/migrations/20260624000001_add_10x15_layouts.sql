-- Add vertical/horizontal 10x15 framed layouts, replace old single_10x15.
alter table public.print_jobs
  drop constraint print_jobs_layout_check;

alter table public.print_jobs
  add constraint print_jobs_layout_check
    check (layout in ('single_10x15','single_10x15_v','single_10x15_h','strip_3'));

update public.kiosk_settings
  set layout_config = '{
    "single_10x15_v": {"label": "10x15 Vertical", "photos": 1, "width": 1200, "height": 1800, "aspect": 0.88},
    "single_10x15_h": {"label": "10x15 Horizontal", "photos": 1, "width": 1800, "height": 1200, "aspect": 2.11},
    "strip_3":        {"label": "Tirinha de 3", "photos": 3, "width": 1200, "height": 1800, "frame_aspect": 2.0}
  }'::jsonb;
