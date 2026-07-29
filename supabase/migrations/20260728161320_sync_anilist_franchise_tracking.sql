create or replace function public.sync_anilist_franchise_tracking(
  p_franchise_id uuid,
  p_primary_anilist_id integer,
  p_entries jsonb
)
returns table (
  synced_count integer,
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
  v_existing_franchise_id uuid;
  v_primary_entry_id uuid;
  v_sequence integer := 0;
  v_synced integer := 0;
  v_skipped integer := 0;
  v_relation_type text;
  v_base_slug text;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries) = 0 then
    raise exception 'ANILIST_ENTRIES_REQUIRED' using errcode = '22023';
  end if;

  perform 1
  from public.anime_franchises
  where id = p_franchise_id
    and submitted_by = v_user_id
    and record_status = 'draft'
  for update;

  if not found then
    raise exception 'OWNED_DRAFT_NOT_FOUND' using errcode = '42501';
  end if;

  select external_id.entry_id
  into v_primary_entry_id
  from public.anime_external_ids external_id
  join public.anime_entries entry on entry.id = external_id.entry_id
  where external_id.provider = 'anilist'
    and external_id.external_id = p_primary_anilist_id::text
    and entry.franchise_id = p_franchise_id
  limit 1;

  if v_primary_entry_id is null then
    raise exception 'PRIMARY_ANILIST_ENTRY_NOT_FOUND' using errcode = '22023';
  end if;

  for v_item in
    select value
    from jsonb_array_elements(p_entries)
    order by
      coalesce(value ->> 'startDate', '9999-12-31'),
      coalesce((value ->> 'anilistId')::integer, 2147483647)
  loop
    v_sequence := v_sequence + 1;
    v_entry_id := null;
    v_existing_franchise_id := null;

    select entry.id, entry.franchise_id
    into v_entry_id, v_existing_franchise_id
    from public.anime_external_ids external_id
    join public.anime_entries entry on entry.id = external_id.entry_id
    where external_id.provider = 'anilist'
      and external_id.external_id = (v_item ->> 'anilistId')
    limit 1;

    if v_entry_id is not null and v_existing_franchise_id <> p_franchise_id then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    v_base_slug := trim(both '-' from regexp_replace(
      lower(translate(
        coalesce(nullif(v_item ->> 'title', ''), 'anime'),
        'áéíóúüñÁÉÍÓÚÜÑ',
        'aeiouunAEIOUUN'
      )),
      '[^a-z0-9]+',
      '-',
      'g'
    ));
    if v_base_slug = '' then
      v_base_slug := 'anime';
    end if;
    v_base_slug := v_base_slug || '-anilist-' || (v_item ->> 'anilistId');

    if v_entry_id is null then
      insert into public.anime_entries (
        franchise_id,
        slug,
        title,
        entry_type,
        sequence_number,
        episode_count,
        episode_duration_minutes,
        aired_from,
        official_status,
        cover_url,
        banner_url,
        source_name,
        source_external_id,
        release_season,
        studio,
        origin_country
      )
      values (
        p_franchise_id,
        v_base_slug,
        coalesce(nullif(v_item ->> 'title', ''), 'Título sin nombre'),
        coalesce(nullif(v_item ->> 'entryType', ''), 'season')::public.anime_entry_type,
        v_sequence,
        greatest(coalesce((v_item ->> 'episodeCount')::integer, 0), 0),
        nullif((v_item ->> 'duration')::integer, 0),
        nullif(v_item ->> 'startDate', '')::date,
        nullif(v_item ->> 'officialStatus', ''),
        nullif(v_item ->> 'coverUrl', ''),
        nullif(v_item ->> 'bannerUrl', ''),
        'anilist',
        v_item ->> 'anilistId',
        nullif(v_item ->> 'season', ''),
        nullif(v_item ->> 'studio', ''),
        'JP'
      )
      returning id into v_entry_id;

      insert into public.anime_external_ids (
        entry_id,
        provider,
        external_id,
        source_url,
        is_primary,
        last_synced_at
      )
      values (
        v_entry_id,
        'anilist',
        v_item ->> 'anilistId',
        coalesce(
          nullif(v_item ->> 'sourceUrl', ''),
          'https://anilist.co/anime/' || (v_item ->> 'anilistId')
        ),
        (v_item ->> 'anilistId')::integer = p_primary_anilist_id,
        pg_catalog.now()
      );
    else
      update public.anime_entries
      set title = coalesce(nullif(v_item ->> 'title', ''), title),
          entry_type = coalesce(nullif(v_item ->> 'entryType', ''), entry_type::text)::public.anime_entry_type,
          sequence_number = v_sequence,
          episode_count = greatest(coalesce((v_item ->> 'episodeCount')::integer, episode_count, 0), 0),
          episode_duration_minutes = coalesce(nullif((v_item ->> 'duration')::integer, 0), episode_duration_minutes),
          aired_from = coalesce(nullif(v_item ->> 'startDate', '')::date, aired_from),
          official_status = coalesce(nullif(v_item ->> 'officialStatus', ''), official_status),
          cover_url = coalesce(nullif(v_item ->> 'coverUrl', ''), cover_url),
          banner_url = coalesce(nullif(v_item ->> 'bannerUrl', ''), banner_url),
          source_name = 'anilist',
          source_external_id = v_item ->> 'anilistId',
          release_season = coalesce(nullif(v_item ->> 'season', ''), release_season),
          studio = coalesce(nullif(v_item ->> 'studio', ''), studio),
          updated_at = pg_catalog.now()
      where id = v_entry_id
        and franchise_id = p_franchise_id;
    end if;

    if coalesce((v_item ->> 'malId')::integer, 0) > 0 then
      insert into public.anime_external_ids (
        entry_id,
        provider,
        external_id,
        source_url,
        is_primary,
        last_synced_at
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

    insert into public.user_entry_progress (
      user_id,
      entry_id,
      episodes_watched,
      completed
    )
    values (v_user_id, v_entry_id, 0, false)
    on conflict (user_id, entry_id) do nothing;

    if v_entry_id <> v_primary_entry_id then
      v_relation_type := case coalesce(v_item ->> 'relationType', 'OTHER')
        when 'SEQUEL' then 'sequel'
        when 'PREQUEL' then 'prequel'
        when 'SPIN_OFF' then 'spin_off'
        when 'SIDE_STORY' then 'side_story'
        when 'PARENT' then 'parent_story'
        else 'other'
      end;

      insert into public.anime_relations (
        source_entry_id,
        target_entry_id,
        relation_type,
        sort_order,
        source_provider,
        external_relation_id,
        verified,
        created_by
      )
      values (
        v_primary_entry_id,
        v_entry_id,
        v_relation_type,
        v_sequence,
        'anilist',
        v_item ->> 'anilistId',
        false,
        v_user_id
      )
      on conflict (source_entry_id, target_entry_id, relation_type)
      do update set
        sort_order = excluded.sort_order,
        updated_at = pg_catalog.now();
    end if;

    v_synced := v_synced + 1;
  end loop;

  update public.anime_franchises
  set source_synced_at = pg_catalog.now(),
      updated_at = pg_catalog.now()
  where id = p_franchise_id;

  return query
  select v_synced, v_skipped, jsonb_array_length(p_entries);
end;
$function$;

revoke all on function public.sync_anilist_franchise_tracking(
  uuid, integer, jsonb
) from public, anon;

grant execute on function public.sync_anilist_franchise_tracking(
  uuid, integer, jsonb
) to authenticated, service_role;

comment on function public.sync_anilist_franchise_tracking(
  uuid, integer, jsonb
) is
  'Synchronizes AniList seasons, OVA, specials and movies into an owned draft franchise without overwriting user progress.';
