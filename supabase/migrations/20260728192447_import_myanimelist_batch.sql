create or replace function public.import_myanimelist_batch(p_items jsonb)
returns table (
  imported_count integer,
  updated_count integer,
  skipped_count integer,
  total_count integer
)
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_item jsonb;
  v_entry_id uuid;
  v_franchise_id uuid;
  v_existing_mal_id bigint;
  v_saved record;
  v_status public.personal_anime_status;
  v_entry_type public.anime_entry_type;
  v_episode_count integer;
  v_watched integer;
  v_score numeric(3,1);
  v_completed boolean;
  v_imported integer := 0;
  v_updated integer := 0;
  v_skipped integer := 0;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'MAL_ITEMS_REQUIRED' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 500 then
    raise exception 'MAL_BATCH_TOO_LARGE' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_entry_id := null;
    v_franchise_id := null;
    v_existing_mal_id := null;

    if coalesce((v_item ->> 'malId')::integer, 0) <= 0
      or coalesce((v_item ->> 'anilistId')::integer, 0) <= 0
      or nullif(btrim(v_item ->> 'title'), '') is null
    then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    begin
      v_status := (v_item ->> 'status')::public.personal_anime_status;
      v_entry_type := (v_item ->> 'entryType')::public.anime_entry_type;
    exception when invalid_text_representation then
      v_skipped := v_skipped + 1;
      continue;
    end;

    v_episode_count := greatest(coalesce((v_item ->> 'episodeCount')::integer, 0), 0);
    v_watched := greatest(coalesce((v_item ->> 'watchedEpisodes')::integer, 0), 0);
    if v_episode_count > 0 then
      v_watched := least(v_watched, v_episode_count);
    end if;
    if v_status = 'completed' and v_episode_count > 0 then
      v_watched := v_episode_count;
    end if;
    v_score := nullif((v_item ->> 'score')::numeric, 0);
    v_completed := v_status = 'completed'
      or (v_episode_count > 0 and v_watched >= v_episode_count);

    select external_id.id, external_id.entry_id, entry.franchise_id
    into v_existing_mal_id, v_entry_id, v_franchise_id
    from public.anime_external_ids external_id
    join public.anime_entries entry on entry.id = external_id.entry_id
    where external_id.provider = 'myanimelist'
      and external_id.external_id = (v_item ->> 'malId')
    limit 1;

    if v_entry_id is null then
      select external_id.entry_id, entry.franchise_id
      into v_entry_id, v_franchise_id
      from public.anime_external_ids external_id
      join public.anime_entries entry on entry.id = external_id.entry_id
      where external_id.provider = 'anilist'
        and external_id.external_id = (v_item ->> 'anilistId')
      limit 1;
    end if;

    if v_entry_id is null then
      select *
      into v_saved
      from public.import_external_anime(
        p_anilist_id => (v_item ->> 'anilistId')::integer,
        p_mal_id => (v_item ->> 'malId')::integer,
        p_title => v_item ->> 'title',
        p_synopsis => coalesce(v_item ->> 'synopsis', ''),
        p_entry_type => v_entry_type::text,
        p_episode_count => v_episode_count,
        p_release_year => greatest(coalesce((v_item ->> 'releaseYear')::integer, 1900), 1900),
        p_official_status => coalesce(nullif(v_item ->> 'officialStatus', ''), 'unknown'),
        p_genre_slugs => array(
          select jsonb_array_elements_text(coalesce(v_item -> 'genreSlugs', '[]'::jsonb))
        ),
        p_library_status => v_status::text,
        p_alternative_title => nullif(v_item ->> 'alternativeTitle', ''),
        p_episode_duration_minutes => nullif((v_item ->> 'duration')::integer, 0),
        p_release_season => nullif(v_item ->> 'season', ''),
        p_studio => nullif(v_item ->> 'studio', ''),
        p_tags => array(
          select jsonb_array_elements_text(coalesce(v_item -> 'tags', '[]'::jsonb))
        ),
        p_initial_episode => v_watched,
        p_favorite => false,
        p_cover_url => nullif(v_item ->> 'coverUrl', ''),
        p_banner_url => nullif(v_item ->> 'bannerUrl', ''),
        p_anilist_url => nullif(v_item ->> 'sourceUrl', '')
      );
      v_entry_id := v_saved.entry_id;
      v_franchise_id := v_saved.franchise_id;
      v_imported := v_imported + 1;
    else
      v_updated := v_updated + 1;
    end if;

    if v_existing_mal_id is null and exists (
      select 1
      from public.anime_franchises franchise
      where franchise.id = v_franchise_id
        and franchise.submitted_by = v_user_id
        and franchise.record_status in ('draft', 'rejected')
    ) then
      insert into public.anime_external_ids (
        entry_id, provider, external_id, source_url, is_primary, last_synced_at
      )
      values (
        v_entry_id,
        'myanimelist',
        v_item ->> 'malId',
        'https://myanimelist.net/anime/' || (v_item ->> 'malId'),
        false,
        pg_catalog.now()
      )
      on conflict do nothing;
    end if;

    insert into public.user_library (
      user_id, franchise_id, status, started_at, finished_at, removed_at
    )
    values (
      v_user_id,
      v_franchise_id,
      v_status,
      nullif(v_item ->> 'startDate', '')::date,
      nullif(v_item ->> 'finishDate', '')::date,
      null
    )
    on conflict (user_id, franchise_id) do update
    set status = excluded.status,
        started_at = coalesce(excluded.started_at, public.user_library.started_at),
        finished_at = coalesce(excluded.finished_at, public.user_library.finished_at),
        removed_at = null,
        updated_at = pg_catalog.now();

    insert into public.user_entry_progress (
      user_id, entry_id, episodes_watched, completed, last_watched_at
    )
    values (
      v_user_id,
      v_entry_id,
      v_watched,
      v_completed,
      case when v_watched > 0 then pg_catalog.now() end
    )
    on conflict (user_id, entry_id) do update
    set episodes_watched = excluded.episodes_watched,
        completed = excluded.completed,
        last_watched_at = coalesce(
          public.user_entry_progress.last_watched_at,
          excluded.last_watched_at
        ),
        updated_at = pg_catalog.now();

    if v_score is not null and v_score between 1 and 10 then
      insert into public.ratings (user_id, franchise_id, score)
      values (v_user_id, v_franchise_id, v_score)
      on conflict (user_id, franchise_id) do update
      set score = excluded.score,
          updated_at = pg_catalog.now();
    end if;
  end loop;

  insert into public.activity_history (user_id, event_type, metadata)
  values (
    v_user_id,
    'myanimelist_import',
    jsonb_build_object(
      'imported', v_imported,
      'updated', v_updated,
      'skipped', v_skipped,
      'total', jsonb_array_length(p_items)
    )
  );

  return query
  select v_imported, v_updated, v_skipped, jsonb_array_length(p_items);
end;
$function$;

revoke all on function public.import_myanimelist_batch(jsonb)
from public, anon;

grant execute on function public.import_myanimelist_batch(jsonb)
to authenticated, service_role;

comment on function public.import_myanimelist_batch(jsonb) is
  'Atomically imports a reviewed MyAnimeList selection, reusing catalog records and preserving personal status, progress, dates and ratings.';
