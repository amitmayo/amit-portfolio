-- Portfolio CMS v1. Run ONLY in your NEW portfolio Supabase project.
-- Do not execute in the Inbar Scout project.

create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_published (
  id text primary key default 'main' check (id = 'main'),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_drafts (
  id text primary key default 'main' check (id = 'main'),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  updated_at timestamptz not null default now()
);

alter table public.portfolio_admins enable row level security;
alter table public.portfolio_published enable row level security;
alter table public.portfolio_drafts enable row level security;

-- Tight privilege grants. RLS alone is not enough.
revoke all on public.portfolio_admins, public.portfolio_published, public.portfolio_drafts from anon, authenticated;
grant select on public.portfolio_admins to authenticated;
grant select on public.portfolio_published to anon, authenticated;
grant insert, update on public.portfolio_published to authenticated;
grant select, insert, update on public.portfolio_drafts to authenticated;

-- A security-definer helper cannot be spoofed through browser user metadata.
create or replace function public.portfolio_is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.portfolio_admins
    where user_id = (select auth.uid())
  );
$$;
revoke all on function public.portfolio_is_admin() from public, anon;
grant execute on function public.portfolio_is_admin() to authenticated;

create policy "Owner may see own admin membership" on public.portfolio_admins
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Everyone may read published portfolio" on public.portfolio_published
  for select to anon, authenticated using (true);
create policy "Owner may publish portfolio" on public.portfolio_published
  for insert to authenticated with check ((select public.portfolio_is_admin()));
create policy "Owner may update published portfolio" on public.portfolio_published
  for update to authenticated
  using ((select public.portfolio_is_admin()))
  with check ((select public.portfolio_is_admin()));

create policy "Owner may read drafts" on public.portfolio_drafts
  for select to authenticated using ((select public.portfolio_is_admin()));
create policy "Owner may create drafts" on public.portfolio_drafts
  for insert to authenticated with check ((select public.portfolio_is_admin()));
create policy "Owner may update drafts" on public.portfolio_drafts
  for update to authenticated
  using ((select public.portfolio_is_admin()))
  with check ((select public.portfolio_is_admin()));

-- Public storage: anyone can view a published image/PDF URL, but only the
-- explicitly authorized owner can write to this bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media', 'portfolio-media', true, 52428800,
  array['image/jpeg','image/png','image/webp','image/avif','image/gif','application/pdf','video/mp4','video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Owner uploads portfolio media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolio-media' and (select public.portfolio_is_admin()));
create policy "Owner may update portfolio media" on storage.objects
  for update to authenticated
  using (bucket_id = 'portfolio-media' and (select public.portfolio_is_admin()))
  with check (bucket_id = 'portfolio-media' and (select public.portfolio_is_admin()));
create policy "Owner may delete portfolio media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'portfolio-media' and (select public.portfolio_is_admin()));

-- After creating your owner account in Authentication > Users, grant the user access:
-- insert into public.portfolio_admins (user_id)
-- values ('PASTE-AUTH-USER-UUID-HERE');
-- This must be done in the SQL editor by the project administrator.
