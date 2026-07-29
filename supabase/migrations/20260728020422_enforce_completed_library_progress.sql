-- Keep the personal status and per-entry progress coherent.
-- A completed library item must always show every known episode as watched.

create or replace function private.normalize_user_entry_progress()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_episode_count integer;
  v_library_status public.personal_anime_status;
begin
  select entry.episode_count, library.status
    into v_episode_count, v_library_status
  from public.anime_entries entry
  left join public.user_library library
    on library.franchise_id = entry.franchise_id
   and library.user_id = new.user_id
   and library.removed_at is null
  where entry.id = new.entry_id;

  if v_library_status = 'completed'::public.personal_anime_status then
    new.episodes_watched := coalesce(v_episode_count, new.episodes_watched);
    new.completed := true;
  elsif v_episode_count is not null and new.episodes_watched > v_episode_count then
    raise exception 'EPISODES_WATCHED_EXCEEDS_TOTAL' using errcode = '22023';
  else
    new.completed := v_episode_count is not null
      and v_episode_count > 0
      and new.episodes_watched = v_episode_count;
  end if;

  return new;
end;
$$;

drop trigger if exists normalize_user_entry_progress
  on public.user_entry_progress;
create trigger normalize_user_entry_progress
before insert or update of episodes_watched, completed
on public.user_entry_progress
for each row execute function private.normalize_user_entry_progress();

create or replace function private.sync_completed_library_progress()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.removed_at is null
     and new.status = 'completed'::public.personal_anime_status then
    insert into public.user_entry_progress (
      user_id,
      entry_id,
      episodes_watched,
      completed,
      last_watched_at
    )
    select
      new.user_id,
      entry.id,
      coalesce(entry.episode_count, 0),
      true,
      now()
    from public.anime_entries entry
    where entry.franchise_id = new.franchise_id
    on conflict (user_id, entry_id) do update
    set episodes_watched = excluded.episodes_watched,
        completed = true,
        last_watched_at = excluded.last_watched_at,
        updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists sync_completed_library_progress
  on public.user_library;
create trigger sync_completed_library_progress
after insert or update of status, removed_at
on public.user_library
for each row execute function private.sync_completed_library_progress();

-- Repair already registered completed items without targeting user-specific IDs.
update public.user_entry_progress progress
set episodes_watched = coalesce(entry.episode_count, progress.episodes_watched),
    completed = true,
    last_watched_at = coalesce(progress.last_watched_at, now()),
    updated_at = now()
from public.anime_entries entry
join public.user_library library
  on library.franchise_id = entry.franchise_id
 and library.removed_at is null
where progress.entry_id = entry.id
  and progress.user_id = library.user_id
  and library.status = 'completed'::public.personal_anime_status;

update public.catalog_draft_preferences preferences
set initial_episode = coalesce(entry.episode_count, preferences.initial_episode),
    updated_at = now()
from public.anime_entries entry
join public.user_library library
  on library.franchise_id = entry.franchise_id
 and library.removed_at is null
where preferences.entry_id = entry.id
  and preferences.user_id = library.user_id
  and library.status = 'completed'::public.personal_anime_status;
