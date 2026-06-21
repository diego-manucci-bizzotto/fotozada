-- Private storage bucket for the photos + composed sheets.
-- Uploads happen through signed upload URLs minted by the request-upload Edge
-- Function (service role), so anon needs NO direct write policy. Admins get a
-- read policy so the dashboard can createSignedUrl() for previews.

insert into storage.buckets (id, name, public)
values ('prints', 'prints', false)
on conflict (id) do nothing;

create policy "prints_admin_read" on storage.objects for select
  using (bucket_id = 'prints' and public.is_admin());
