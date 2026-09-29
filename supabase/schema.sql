-- KadoTV production schema
-- Run this in Supabase SQL Editor before deploying.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user','admin')),
  status text not null default 'active' check (status in ('active','blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  logo_url text,
  backdrop_url text,
  stream_url text not null,
  category text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  poster_url text,
  backdrop_url text,
  stream_url text not null,
  category text,
  release_year integer,
  duration_minutes integer,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  poster_url text,
  backdrop_url text,
  category text,
  release_year integer,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.series(id) on delete cascade,
  season_number integer not null,
  title text,
  created_at timestamptz not null default now(),
  unique(series_id, season_number)
);

create table if not exists public.episodes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  episode_number integer not null,
  title text not null,
  description text,
  thumbnail_url text,
  stream_url text not null,
  duration_minutes integer,
  created_at timestamptz not null default now(),
  unique(season_id, episode_number)
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_type text not null check (content_type in ('channel','movie','series','episode')),
  content_id uuid not null,
  created_at timestamptz not null default now(),
  unique(user_id, content_type, content_id)
);

create table if not exists public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_type text not null check (content_type in ('channel','movie','series','episode')),
  content_id uuid not null,
  position_seconds numeric not null default 0,
  duration_seconds numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, content_type, content_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- New auth users automatically get a profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email,''),'@',1)))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.channels enable row level security;
alter table public.movies enable row level security;
alter table public.series enable row level security;
alter table public.seasons enable row level security;
alter table public.episodes enable row level security;
alter table public.favorites enable row level security;
alter table public.watch_history enable row level security;
alter table public.notifications enable row level security;

-- Public/readable catalogue. Only active content is exposed to normal users.
create policy "active channels readable" on public.channels for select to anon, authenticated using (is_active = true);
create policy "active movies readable" on public.movies for select to anon, authenticated using (is_active = true);
create policy "active series readable" on public.series for select to anon, authenticated using (is_active = true);
create policy "categories readable" on public.categories for select to anon, authenticated using (true);
create policy "seasons readable" on public.seasons for select to anon, authenticated using (true);
create policy "episodes readable" on public.episodes for select to anon, authenticated using (true);

-- User-owned data.
create policy "own profile readable" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "own profile update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "own favorites all" on public.favorites for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own history all" on public.watch_history for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own notifications readable" on public.notifications for select to authenticated
using ((select auth.uid()) = user_id);

-- Admin policies use the immutable app_metadata role, NOT editable user metadata.
-- Set app_metadata.role = 'admin' for your first administrator from the Supabase dashboard.
create policy "admin channels all" on public.channels for all to authenticated
using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');

create policy "admin movies all" on public.movies for all to authenticated
using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');

create policy "admin series all" on public.series for all to authenticated
using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');

create policy "admin categories all" on public.categories for all to authenticated
using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');

create policy "admin profiles all" on public.profiles for all to authenticated
using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');

create policy "admin seasons all" on public.seasons for all to authenticated
using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');

create policy "admin episodes all" on public.episodes for all to authenticated
using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');

create index if not exists channels_active_sort_idx on public.channels(is_active, sort_order);
create index if not exists movies_active_created_idx on public.movies(is_active, created_at desc);
create index if not exists series_active_created_idx on public.series(is_active, created_at desc);
create index if not exists favorites_user_idx on public.favorites(user_id);
create index if not exists history_user_idx on public.watch_history(user_id, updated_at desc);

-- IMPORTANT:
-- In Supabase Dashboard > Authentication > Users, assign app_metadata:
-- {"role":"admin"}
-- to your first admin user. Never expose a service_role/secret key in Vite.
