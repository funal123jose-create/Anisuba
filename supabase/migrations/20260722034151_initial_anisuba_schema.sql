-- AniSuba initial domain model.
-- Catalog data is shared; every personal table is isolated by auth.uid().

create type public.anime_entry_type as enum ('season', 'movie', 'ova', 'special');
create type public.personal_anime_status as enum (
  'plan_to_watch',
  'watching',
  'caught_up',
  'paused',
  'completed',
  'waiting_next_season',
  'dropped'
);
create type public.catalog_record_status as enum ('draft', 'published', 'archived');

create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text not null check (char_length(last_name) between 1 and 80),
  username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  birth_date date not null check (birth_date <= current_date),
  avatar_url text,
  bio text check (char_length(bio) <= 500),
  locale text not null default 'es',
  timezone text not null default 'America/Bogota',
  profile_is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  key text primary key,
  label text not null,
  created_at timestamptz not null default now()
);

insert into public.roles (key, label)
values ('user', 'Usuario'), ('admin', 'Administrador');

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role_key text not null references public.roles (key) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, role_key)
);

create table public.anime_franchises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  canonical_title text not null,
  alternative_title text,
  synopsis text,
  cover_url text,
  banner_url text,
  record_status public.catalog_record_status not null default 'draft',
  source_name text,
  source_external_id text,
  source_synced_at timestamptz,
  submitted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (source_name, source_external_id)
);

create table public.anime_entries (
  id uuid primary key default gen_random_uuid(),
  franchise_id uuid not null references public.anime_franchises (id) on delete cascade,
  slug text not null,
  title text not null,
  entry_type public.anime_entry_type not null,
  sequence_number numeric(6, 2) not null default 1 check (sequence_number > 0),
  episode_count integer check (episode_count is null or episode_count >= 0),
  episode_duration_minutes integer check (episode_duration_minutes is null or episode_duration_minutes > 0),
  aired_from date,
  aired_to date,
  official_status text,
  cover_url text,
  banner_url text,
  source_name text,
  source_external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (franchise_id, slug),
  unique nulls not distinct (source_name, source_external_id)
);

create table public.genres (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null unique
);

create table public.anime_genres (
  franchise_id uuid not null references public.anime_franchises (id) on delete cascade,
  genre_id bigint not null references public.genres (id) on delete cascade,
  primary key (franchise_id, genre_id)
);

create table public.user_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  franchise_id uuid not null references public.anime_franchises (id) on delete cascade,
  status public.personal_anime_status not null default 'plan_to_watch',
  started_at date,
  finished_at date,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  removed_at timestamptz,
  unique (user_id, franchise_id),
  check (finished_at is null or started_at is null or finished_at >= started_at)
);

create table public.user_entry_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_id uuid not null references public.anime_entries (id) on delete cascade,
  episodes_watched integer not null default 0 check (episodes_watched >= 0),
  completed boolean not null default false,
  last_watched_at timestamptz,
  personal_note text check (char_length(personal_note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_id)
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  franchise_id uuid not null references public.anime_franchises (id) on delete cascade,
  score numeric(3, 1) not null check (score between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, franchise_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  franchise_id uuid not null references public.anime_franchises (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  contains_spoilers boolean not null default false,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, franchise_id)
);

create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  franchise_id uuid not null references public.anime_franchises (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, franchise_id)
);

create table public.activity_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null,
  franchise_id uuid references public.anime_franchises (id) on delete set null,
  entry_id uuid references public.anime_entries (id) on delete set null,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  check (jsonb_typeof(metadata) = 'object')
);

create index anime_entries_franchise_sequence_idx on public.anime_entries (franchise_id, sequence_number);
create index user_roles_role_key_idx on public.user_roles (role_key);
create index franchises_submitted_by_idx on public.anime_franchises (submitted_by) where submitted_by is not null;
create index anime_genres_genre_id_idx on public.anime_genres (genre_id);
create index user_library_user_status_idx on public.user_library (user_id, status) where removed_at is null;
create index user_library_franchise_id_idx on public.user_library (franchise_id);
create index progress_user_recent_idx on public.user_entry_progress (user_id, last_watched_at desc);
create index progress_entry_id_idx on public.user_entry_progress (entry_id);
create index ratings_franchise_id_idx on public.ratings (franchise_id);
create index reviews_franchise_id_idx on public.reviews (franchise_id);
create index favorites_franchise_id_idx on public.favorites (franchise_id);
create index activity_user_occurred_idx on public.activity_history (user_id, occurred_at desc);
create index activity_franchise_idx on public.activity_history (franchise_id) where franchise_id is not null;
create index activity_entry_idx on public.activity_history (entry_id) where entry_id is not null;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger franchises_set_updated_at before update on public.anime_franchises
for each row execute function public.set_updated_at();
create trigger entries_set_updated_at before update on public.anime_entries
for each row execute function public.set_updated_at();
create trigger library_set_updated_at before update on public.user_library
for each row execute function public.set_updated_at();
create trigger progress_set_updated_at before update on public.user_entry_progress
for each row execute function public.set_updated_at();
create trigger ratings_set_updated_at before update on public.ratings
for each row execute function public.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
for each row execute function public.set_updated_at();

revoke all on function public.set_updated_at() from public, anon, authenticated;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_first_name text;
  profile_last_name text;
  profile_username text;
  profile_display_name text;
  profile_birth_date date;
begin
  profile_first_name := trim(coalesce(new.raw_user_meta_data ->> 'first_name', ''));
  profile_last_name := trim(coalesce(new.raw_user_meta_data ->> 'last_name', ''));
  profile_username := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  profile_display_name := trim(coalesce(
    new.raw_user_meta_data ->> 'display_name',
    concat_ws(' ', profile_first_name, profile_last_name)
  ));
  profile_birth_date := (new.raw_user_meta_data ->> 'birth_date')::date;

  insert into public.profiles (
    id,
    first_name,
    last_name,
    username,
    display_name,
    birth_date
  )
  values (
    new.id,
    profile_first_name,
    profile_last_name,
    profile_username,
    profile_display_name,
    profile_birth_date
  );

  insert into public.user_roles (user_id, role_key)
  values (new.id, 'user');

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated, service_role;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.anime_franchises enable row level security;
alter table public.anime_entries enable row level security;
alter table public.genres enable row level security;
alter table public.anime_genres enable row level security;
alter table public.user_library enable row level security;
alter table public.user_entry_progress enable row level security;
alter table public.ratings enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.activity_history enable row level security;

create policy "Users can read their own profile" on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy "Users can insert their own profile" on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);
create policy "Users can update their own profile" on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Users can delete their own profile" on public.profiles for delete to authenticated
using ((select auth.uid()) = id);

create policy "Authenticated users can read roles" on public.roles for select to authenticated using (true);
create policy "Users can read their own roles" on public.user_roles for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Authenticated users can read published franchises" on public.anime_franchises for select to authenticated
using (record_status = 'published' or submitted_by = (select auth.uid()));
create policy "Authenticated users can read entries" on public.anime_entries for select to authenticated
using (exists (
  select 1 from public.anime_franchises franchise
  where franchise.id = anime_entries.franchise_id
    and (franchise.record_status = 'published' or franchise.submitted_by = (select auth.uid()))
));
create policy "Authenticated users can read genres" on public.genres for select to authenticated using (true);
create policy "Authenticated users can read visible anime genres" on public.anime_genres for select to authenticated
using (exists (
  select 1 from public.anime_franchises franchise
  where franchise.id = anime_genres.franchise_id
    and (franchise.record_status = 'published' or franchise.submitted_by = (select auth.uid()))
));

create policy "Users own their library rows" on public.user_library for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users add their own library rows" on public.user_library for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users update their own library rows" on public.user_library for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete their own library rows" on public.user_library for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users own their progress rows" on public.user_entry_progress for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users add their own progress rows" on public.user_entry_progress for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users update their own progress rows" on public.user_entry_progress for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete their own progress rows" on public.user_entry_progress for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users own their ratings" on public.ratings for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users add their own ratings" on public.ratings for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users update their own ratings" on public.ratings for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete their own ratings" on public.ratings for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users own their reviews" on public.reviews for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users add their own reviews" on public.reviews for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users update their own reviews" on public.reviews for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete their own reviews" on public.reviews for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users own their favorites" on public.favorites for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users add their own favorites" on public.favorites for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users delete their own favorites" on public.favorites for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users read their own activity" on public.activity_history for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users append their own activity" on public.activity_history for insert to authenticated
with check ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.roles, public.user_roles to authenticated;
grant select on public.anime_franchises, public.anime_entries, public.genres, public.anime_genres to authenticated;
grant select, insert, update, delete on public.user_library, public.user_entry_progress, public.ratings, public.reviews, public.favorites to authenticated;
grant select, insert on public.activity_history to authenticated;
grant usage, select on sequence public.activity_history_id_seq to authenticated;
