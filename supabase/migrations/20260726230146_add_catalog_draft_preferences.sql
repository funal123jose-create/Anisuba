-- Personal form values belong to the submitter, not to the shared catalog.
-- Keeping them here lets a draft be reopened without prematurely creating a
-- user_library row.

create table public.catalog_draft_preferences (
  user_id uuid not null references auth.users (id) on delete cascade,
  franchise_id uuid not null references public.anime_franchises (id) on delete cascade,
  entry_id uuid not null references public.anime_entries (id) on delete cascade,
  library_status public.personal_anime_status not null default 'plan_to_watch',
  initial_episode integer not null default 0 check (initial_episode >= 0),
  favorite boolean not null default false,
  rating numeric(3, 1) check (rating is null or rating between 1 and 10),
  personal_note text check (
    personal_note is null or char_length(personal_note) <= 500
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, franchise_id),
  unique (user_id, entry_id)
);

create index catalog_draft_preferences_franchise_id_idx
  on public.catalog_draft_preferences (franchise_id);

create trigger catalog_draft_preferences_set_updated_at
before update on public.catalog_draft_preferences
for each row execute function public.set_updated_at();

alter table public.catalog_draft_preferences enable row level security;

create policy "Users can read their own catalog draft preferences"
on public.catalog_draft_preferences for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create preferences for editable catalog drafts"
on public.catalog_draft_preferences for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.anime_franchises franchise
    join public.anime_entries entry on entry.franchise_id = franchise.id
    where franchise.id = catalog_draft_preferences.franchise_id
      and entry.id = catalog_draft_preferences.entry_id
      and franchise.submitted_by = (select auth.uid())
      and franchise.record_status in ('draft', 'rejected')
  )
);

create policy "Users can update preferences for editable catalog drafts"
on public.catalog_draft_preferences for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.anime_franchises franchise
    join public.anime_entries entry on entry.franchise_id = franchise.id
    where franchise.id = catalog_draft_preferences.franchise_id
      and entry.id = catalog_draft_preferences.entry_id
      and franchise.submitted_by = (select auth.uid())
      and franchise.record_status in ('draft', 'rejected')
  )
);

create policy "Users can delete their own catalog draft preferences"
on public.catalog_draft_preferences for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete
on public.catalog_draft_preferences
to authenticated;

grant select, insert, update, delete
on public.catalog_draft_preferences
to service_role;

comment on table public.catalog_draft_preferences is
  'Owner-scoped personal values retained while a manual catalog record is a draft.';
