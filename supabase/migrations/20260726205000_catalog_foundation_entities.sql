-- Shared catalog foundation. This migration is additive and keeps the existing
-- manual registration RPC and legacy source columns compatible.

create extension if not exists pg_trgm with schema extensions;

create or replace function public.normalize_catalog_title(value text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select pg_catalog.btrim(
    pg_catalog.regexp_replace(
      pg_catalog.lower(value),
      '[^[:alnum:]]+',
      ' ',
      'g'
    )
  );
$$;

revoke all on function public.normalize_catalog_title(text)
from public, anon;
grant execute on function public.normalize_catalog_title(text)
to authenticated, service_role;

alter table public.anime_franchises
  add column if not exists normalized_title text
    generated always as (public.normalize_catalog_title(canonical_title)) stored,
  add column if not exists published_at timestamptz,
  add column if not exists published_by uuid references auth.users (id) on delete set null,
  add column if not exists rejection_reason text;

alter table public.anime_entries
  add column if not exists normalized_title text
    generated always as (public.normalize_catalog_title(title)) stored;

do $migration$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'anime_franchises_rejection_reason_length_check'
      and conrelid = 'public.anime_franchises'::regclass
  ) then
    alter table public.anime_franchises
      add constraint anime_franchises_rejection_reason_length_check
      check (rejection_reason is null or char_length(rejection_reason) <= 2000);
  end if;
end;
$migration$;

-- The former NULLS NOT DISTINCT constraints allowed only one (manual, NULL)
-- row. External uniqueness should apply only when an actual external ID exists.
alter table public.anime_franchises
  drop constraint if exists anime_franchises_source_name_source_external_id_key;
alter table public.anime_entries
  drop constraint if exists anime_entries_source_name_source_external_id_key;

create unique index if not exists anime_franchises_source_external_id_uidx
  on public.anime_franchises (source_name, source_external_id)
  where source_name is not null and source_external_id is not null;

create unique index if not exists anime_entries_source_external_id_uidx
  on public.anime_entries (source_name, source_external_id)
  where source_name is not null and source_external_id is not null;

create index if not exists anime_franchises_normalized_title_idx
  on public.anime_franchises (normalized_title);
create index if not exists anime_franchises_normalized_title_trgm_idx
  on public.anime_franchises using gin (normalized_title extensions.gin_trgm_ops);
create index if not exists anime_franchises_status_updated_idx
  on public.anime_franchises (record_status, updated_at desc);
create index if not exists anime_franchises_published_by_idx
  on public.anime_franchises (published_by)
  where published_by is not null;
create index if not exists anime_entries_normalized_title_trgm_idx
  on public.anime_entries using gin (normalized_title extensions.gin_trgm_ops);

create table public.anime_external_ids (
  id bigint generated always as identity primary key,
  entry_id uuid not null references public.anime_entries (id) on delete cascade,
  provider text not null,
  external_id text not null,
  source_url text,
  is_primary boolean not null default false,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint anime_external_ids_provider_format_check
    check (provider ~ '^[a-z0-9][a-z0-9_-]{1,39}$'),
  constraint anime_external_ids_external_id_length_check
    check (char_length(btrim(external_id)) between 1 and 120),
  constraint anime_external_ids_provider_external_id_key
    unique (provider, external_id),
  constraint anime_external_ids_entry_provider_key
    unique (entry_id, provider)
);

create table public.anime_relations (
  id bigint generated always as identity primary key,
  source_entry_id uuid not null references public.anime_entries (id) on delete cascade,
  target_entry_id uuid not null references public.anime_entries (id) on delete cascade,
  relation_type text not null,
  sort_order integer not null default 0,
  source_provider text,
  external_relation_id text,
  verified boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint anime_relations_distinct_entries_check
    check (source_entry_id <> target_entry_id),
  constraint anime_relations_type_check
    check (relation_type in (
      'sequel',
      'prequel',
      'spin_off',
      'side_story',
      'parent_story',
      'summary',
      'alternative',
      'adaptation',
      'character',
      'other'
    )),
  constraint anime_relations_source_target_type_key
    unique (source_entry_id, target_entry_id, relation_type)
);

create table public.catalog_submissions (
  id uuid primary key default gen_random_uuid(),
  franchise_id uuid not null references public.anime_franchises (id) on delete cascade,
  review_round integer not null check (review_round > 0),
  status text not null default 'in_review',
  submitted_by uuid not null references auth.users (id) on delete restrict,
  reviewed_by uuid references auth.users (id) on delete set null,
  submission_notes text,
  review_notes text,
  submitted_snapshot jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_submissions_status_check
    check (status in ('in_review', 'approved', 'rejected', 'withdrawn')),
  constraint catalog_submissions_notes_length_check
    check (
      (submission_notes is null or char_length(submission_notes) <= 2000)
      and (review_notes is null or char_length(review_notes) <= 2000)
    ),
  constraint catalog_submissions_snapshot_object_check
    check (jsonb_typeof(submitted_snapshot) = 'object'),
  constraint catalog_submissions_review_fields_check
    check (
      (status in ('approved', 'rejected') and reviewed_by is not null and reviewed_at is not null)
      or
      (status in ('in_review', 'withdrawn'))
    ),
  constraint catalog_submissions_franchise_round_key
    unique (franchise_id, review_round)
);

create table public.catalog_change_requests (
  id uuid primary key default gen_random_uuid(),
  franchise_id uuid not null references public.anime_franchises (id) on delete cascade,
  requested_by uuid not null references auth.users (id) on delete cascade,
  request_type text not null default 'metadata',
  status text not null default 'draft',
  reason text not null,
  proposed_changes jsonb not null default '{}'::jsonb,
  reviewed_by uuid references auth.users (id) on delete set null,
  review_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_change_requests_type_check
    check (request_type in ('metadata', 'relation', 'duplicate_merge', 'other')),
  constraint catalog_change_requests_status_check
    check (status in ('draft', 'in_review', 'approved', 'rejected', 'withdrawn')),
  constraint catalog_change_requests_reason_length_check
    check (char_length(btrim(reason)) between 10 and 2000),
  constraint catalog_change_requests_payload_object_check
    check (jsonb_typeof(proposed_changes) = 'object'),
  constraint catalog_change_requests_review_fields_check
    check (
      (status in ('approved', 'rejected') and reviewed_by is not null and reviewed_at is not null)
      or
      (status in ('draft', 'in_review', 'withdrawn'))
    )
);

create unique index catalog_submissions_one_active_review_uidx
  on public.catalog_submissions (franchise_id)
  where status = 'in_review';
create index catalog_submissions_submitter_status_idx
  on public.catalog_submissions (submitted_by, status, submitted_at desc);
create index catalog_submissions_reviewer_status_idx
  on public.catalog_submissions (reviewed_by, status, reviewed_at desc)
  where reviewed_by is not null;

create index anime_external_ids_entry_id_idx
  on public.anime_external_ids (entry_id);
create index anime_relations_target_entry_id_idx
  on public.anime_relations (target_entry_id);
create index anime_relations_created_by_idx
  on public.anime_relations (created_by)
  where created_by is not null;
create index catalog_change_requests_franchise_status_idx
  on public.catalog_change_requests (franchise_id, status, created_at desc);
create index catalog_change_requests_requester_status_idx
  on public.catalog_change_requests (requested_by, status, created_at desc);
create index catalog_change_requests_reviewer_idx
  on public.catalog_change_requests (reviewed_by)
  where reviewed_by is not null;

create trigger anime_external_ids_set_updated_at
before update on public.anime_external_ids
for each row execute function public.set_updated_at();

create trigger anime_relations_set_updated_at
before update on public.anime_relations
for each row execute function public.set_updated_at();

create trigger catalog_submissions_set_updated_at
before update on public.catalog_submissions
for each row execute function public.set_updated_at();

create trigger catalog_change_requests_set_updated_at
before update on public.catalog_change_requests
for each row execute function public.set_updated_at();

alter table public.anime_external_ids enable row level security;
alter table public.anime_relations enable row level security;
alter table public.catalog_submissions enable row level security;
alter table public.catalog_change_requests enable row level security;
