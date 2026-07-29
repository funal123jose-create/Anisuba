-- Server-owned synchronization state for periodic AniList franchise discovery.
-- This table is intentionally not exposed to end users. The service role uses
-- it to compare relation fingerprints and keep retries observable/idempotent.

create table if not exists public.anilist_franchise_sync_state (
  franchise_id uuid primary key
    references public.anime_franchises (id) on delete cascade,
  primary_anilist_id integer not null check (primary_anilist_id > 0),
  relation_fingerprint text not null default '',
  entry_count integer not null default 0 check (entry_count >= 0),
  last_checked_at timestamptz,
  last_changed_at timestamptz,
  next_check_at timestamptz not null default now(),
  last_error text,
  consecutive_failures integer not null default 0
    check (consecutive_failures >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint anilist_franchise_sync_state_fingerprint_length_check
    check (char_length(relation_fingerprint) <= 128),
  constraint anilist_franchise_sync_state_error_length_check
    check (last_error is null or char_length(last_error) <= 500)
);

create index if not exists anilist_franchise_sync_state_next_check_idx
  on public.anilist_franchise_sync_state (next_check_at, last_checked_at);

create index if not exists anilist_franchise_sync_state_failures_idx
  on public.anilist_franchise_sync_state (consecutive_failures desc, next_check_at)
  where consecutive_failures > 0;

drop trigger if exists anilist_franchise_sync_state_set_updated_at
  on public.anilist_franchise_sync_state;
create trigger anilist_franchise_sync_state_set_updated_at
before update on public.anilist_franchise_sync_state
for each row execute function public.set_updated_at();

alter table public.anilist_franchise_sync_state enable row level security;

revoke all on table public.anilist_franchise_sync_state
  from public, anon, authenticated;
grant select, insert, update, delete
  on table public.anilist_franchise_sync_state
  to service_role;

comment on table public.anilist_franchise_sync_state is
  'Private operational state for incremental AniList franchise relation synchronization.';
