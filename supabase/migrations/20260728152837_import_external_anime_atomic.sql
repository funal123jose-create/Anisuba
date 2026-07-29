create or replace function public.import_external_anime(
  p_anilist_id integer,
  p_mal_id integer,
  p_title text,
  p_synopsis text,
  p_entry_type text,
  p_episode_count integer,
  p_release_year integer,
  p_official_status text,
  p_genre_slugs text[],
  p_library_status text,
  p_alternative_title text default null,
  p_episode_duration_minutes integer default null,
  p_release_season text default null,
  p_studio text default null,
  p_tags text[] default '{}'::text[],
  p_initial_episode integer default 0,
  p_favorite boolean default false,
  p_cover_url text default null,
  p_banner_url text default null,
  p_anilist_url text default null
)
returns table (
  franchise_id uuid,
  entry_id uuid,
  slug text,
  saved_as text
)
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_saved record;
begin
  if p_anilist_id is null or p_anilist_id <= 0 then
    raise exception 'A valid AniList ID is required';
  end if;

  select *
  into v_saved
  from public.submit_manual_anime(
    p_title => p_title,
    p_synopsis => p_synopsis,
    p_entry_type => p_entry_type,
    p_episode_count => p_episode_count,
    p_release_year => p_release_year,
    p_official_status => p_official_status,
    p_genre_slugs => p_genre_slugs,
    p_library_status => p_library_status,
    p_intent => 'register',
    p_alternative_title => p_alternative_title,
    p_episode_duration_minutes => p_episode_duration_minutes,
    p_release_season => p_release_season,
    p_studio => p_studio,
    p_origin_country => 'JP',
    p_source_material => null,
    p_age_rating => null,
    p_tags => p_tags,
    p_initial_episode => p_initial_episode,
    p_favorite => p_favorite,
    p_rating => null,
    p_personal_note => null,
    p_cover_url => p_cover_url,
    p_banner_url => p_banner_url,
    p_existing_franchise_id => null
  );

  insert into public.anime_external_ids (
    entry_id,
    provider,
    external_id,
    source_url,
    is_primary,
    last_synced_at
  )
  values (
    v_saved.entry_id,
    'anilist',
    p_anilist_id::text,
    coalesce(p_anilist_url, 'https://anilist.co/anime/' || p_anilist_id::text),
    true,
    pg_catalog.now()
  );

  if p_mal_id is not null and p_mal_id > 0 then
    insert into public.anime_external_ids (
      entry_id,
      provider,
      external_id,
      source_url,
      is_primary,
      last_synced_at
    )
    values (
      v_saved.entry_id,
      'myanimelist',
      p_mal_id::text,
      'https://myanimelist.net/anime/' || p_mal_id::text,
      false,
      pg_catalog.now()
    );
  end if;

  update public.anime_entries
  set source_name = 'anilist',
      source_external_id = p_anilist_id::text
  where id = v_saved.entry_id;

  update public.anime_franchises
  set source_name = 'anilist',
      source_external_id = p_anilist_id::text,
      source_synced_at = pg_catalog.now()
  where id = v_saved.franchise_id;

  return query
  select
    v_saved.franchise_id,
    v_saved.entry_id,
    v_saved.slug,
    v_saved.saved_as;
end;
$function$;

revoke all on function public.import_external_anime(
  integer, integer, text, text, text, integer, integer, text, text[], text,
  text, integer, text, text, text[], integer, boolean, text, text, text
) from public, anon;

grant execute on function public.import_external_anime(
  integer, integer, text, text, text, integer, integer, text, text[], text,
  text, integer, text, text, text[], integer, boolean, text, text, text
) to authenticated, service_role;

comment on function public.import_external_anime(
  integer, integer, text, text, text, integer, integer, text, text[], text,
  text, integer, text, text, text[], integer, boolean, text, text, text
) is
  'Atomically registers one AniList anime, its external IDs, and the authenticated user library state.';
