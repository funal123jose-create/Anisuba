-- User-submitted catalog flow, applied to the hosted project.
-- Catalog writes are intentionally exposed through one hardened RPC so a
-- regular authenticated user can create a private draft and add it to their
-- own library atomically without receiving direct catalog write privileges.

alter table public.anime_franchises
  add column if not exists tags text[] not null default '{}';

alter table public.anime_entries
  add column if not exists release_season text,
  add column if not exists studio text,
  add column if not exists origin_country text,
  add column if not exists source_material text,
  add column if not exists age_rating text;

insert into public.genres (slug, name)
values
  ('accion', 'Acción'),
  ('aventura', 'Aventura'),
  ('ciencia-ficcion', 'Ciencia ficción'),
  ('comedia', 'Comedia'),
  ('deportes', 'Deportes'),
  ('drama', 'Drama'),
  ('fantasia', 'Fantasía'),
  ('mecha', 'Mecha'),
  ('misterio', 'Misterio'),
  ('romance', 'Romance'),
  ('slice-of-life', 'Slice of life'),
  ('sobrenatural', 'Sobrenatural'),
  ('suspenso', 'Suspenso'),
  ('terror', 'Terror')
on conflict (slug) do update set name = excluded.name;

create or replace function public.submit_manual_anime(
  p_title text,
  p_synopsis text,
  p_entry_type text,
  p_episode_count integer,
  p_release_year integer,
  p_official_status text,
  p_genre_slugs text[],
  p_library_status text,
  p_intent text,
  p_alternative_title text default null,
  p_episode_duration_minutes integer default null,
  p_release_season text default null,
  p_studio text default null,
  p_origin_country text default null,
  p_source_material text default null,
  p_age_rating text default null,
  p_tags text[] default '{}',
  p_initial_episode integer default 0,
  p_favorite boolean default false,
  p_rating numeric default null,
  p_personal_note text default null,
  p_cover_url text default null,
  p_banner_url text default null,
  p_existing_franchise_id uuid default null
)
returns table (franchise_id uuid, entry_id uuid, slug text, saved_as text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_franchise_id uuid;
  v_entry_id uuid;
  v_slug text;
  v_base_slug text;
  v_suffix integer := 1;
  v_status public.personal_anime_status;
  v_entry_type public.anime_entry_type;
  v_record_status public.catalog_record_status;
  v_completed boolean;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  p_title := nullif(btrim(p_title), '');
  p_synopsis := nullif(btrim(p_synopsis), '');
  p_official_status := nullif(btrim(p_official_status), '');
  p_personal_note := nullif(btrim(p_personal_note), '');
  p_intent := lower(btrim(p_intent));

  if p_title is null or char_length(p_title) > 180 then
    raise exception 'INVALID_TITLE' using errcode = '22023';
  end if;
  if p_synopsis is null or char_length(p_synopsis) > 2000 then
    raise exception 'INVALID_SYNOPSIS' using errcode = '22023';
  end if;
  if p_episode_count is null or p_episode_count < 0 or p_episode_count > 10000 then
    raise exception 'INVALID_EPISODE_COUNT' using errcode = '22023';
  end if;
  if p_release_year is null or p_release_year < 1900
     or p_release_year > extract(year from current_date)::integer + 5 then
    raise exception 'INVALID_RELEASE_YEAR' using errcode = '22023';
  end if;
  if p_initial_episode < 0 or p_initial_episode > p_episode_count then
    raise exception 'INVALID_INITIAL_PROGRESS' using errcode = '22023';
  end if;
  if p_rating is not null and (p_rating < 1 or p_rating > 10) then
    raise exception 'INVALID_RATING' using errcode = '22023';
  end if;
  if p_personal_note is not null and char_length(p_personal_note) > 500 then
    raise exception 'INVALID_PERSONAL_NOTE' using errcode = '22023';
  end if;
  if p_intent not in ('draft', 'register') then
    raise exception 'INVALID_INTENT' using errcode = '22023';
  end if;

  begin
    v_status := p_library_status::public.personal_anime_status;
    v_entry_type := p_entry_type::public.anime_entry_type;
  exception when invalid_text_representation then
    raise exception 'INVALID_ENUM_VALUE' using errcode = '22023';
  end;

  -- User-submitted catalog records remain private drafts. "register" means
  -- adding the record to this user's library, not publishing it globally.
  v_record_status := 'draft'::public.catalog_record_status;
  v_completed := v_status = 'completed' or
    (p_episode_count > 0 and p_initial_episode = p_episode_count);

  if p_existing_franchise_id is not null then
    select id, anime_franchises.slug
      into v_franchise_id, v_slug
    from public.anime_franchises
    where id = p_existing_franchise_id
      and submitted_by = v_user_id
    for update;

    if v_franchise_id is null then
      raise exception 'DRAFT_NOT_FOUND' using errcode = '42501';
    end if;

    update public.anime_franchises
    set canonical_title = p_title,
        alternative_title = nullif(btrim(p_alternative_title), ''),
        synopsis = p_synopsis,
        cover_url = nullif(btrim(p_cover_url), ''),
        banner_url = nullif(btrim(p_banner_url), ''),
        tags = coalesce(p_tags, '{}'),
        record_status = v_record_status,
        updated_at = now()
    where id = v_franchise_id;
  else
    v_base_slug := trim(both '-' from regexp_replace(
      lower(translate(
        p_title,
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
    v_slug := v_base_slug;
    while exists (select 1 from public.anime_franchises where anime_franchises.slug = v_slug) loop
      v_suffix := v_suffix + 1;
      v_slug := v_base_slug || '-' || v_suffix::text;
    end loop;

    insert into public.anime_franchises (
      slug, canonical_title, alternative_title, synopsis, cover_url, banner_url,
      tags, record_status, source_name, submitted_by
    )
    values (
      v_slug, p_title, nullif(btrim(p_alternative_title), ''), p_synopsis,
      nullif(btrim(p_cover_url), ''), nullif(btrim(p_banner_url), ''),
      coalesce(p_tags, '{}'), v_record_status, 'manual', v_user_id
    )
    returning id into v_franchise_id;
  end if;

  select id into v_entry_id
  from public.anime_entries
  where franchise_id = v_franchise_id
  order by sequence_number, created_at
  limit 1
  for update;

  if v_entry_id is null then
    insert into public.anime_entries (
      franchise_id, slug, title, entry_type, sequence_number, episode_count,
      episode_duration_minutes, aired_from, official_status, cover_url,
      banner_url, source_name, release_season, studio, origin_country,
      source_material, age_rating
    )
    values (
      v_franchise_id, v_slug, p_title, v_entry_type, 1, p_episode_count,
      p_episode_duration_minutes, make_date(p_release_year, 1, 1),
      p_official_status, nullif(btrim(p_cover_url), ''),
      nullif(btrim(p_banner_url), ''), 'manual',
      nullif(btrim(p_release_season), ''), nullif(btrim(p_studio), ''),
      nullif(btrim(p_origin_country), ''), nullif(btrim(p_source_material), ''),
      nullif(btrim(p_age_rating), '')
    )
    returning id into v_entry_id;
  else
    update public.anime_entries
    set title = p_title,
        entry_type = v_entry_type,
        episode_count = p_episode_count,
        episode_duration_minutes = p_episode_duration_minutes,
        aired_from = make_date(p_release_year, 1, 1),
        official_status = p_official_status,
        cover_url = nullif(btrim(p_cover_url), ''),
        banner_url = nullif(btrim(p_banner_url), ''),
        release_season = nullif(btrim(p_release_season), ''),
        studio = nullif(btrim(p_studio), ''),
        origin_country = nullif(btrim(p_origin_country), ''),
        source_material = nullif(btrim(p_source_material), ''),
        age_rating = nullif(btrim(p_age_rating), ''),
        updated_at = now()
    where id = v_entry_id;
  end if;

  delete from public.anime_genres where anime_genres.franchise_id = v_franchise_id;
  insert into public.anime_genres (franchise_id, genre_id)
  select v_franchise_id, genres.id
  from public.genres
  where genres.slug = any(coalesce(p_genre_slugs, '{}'))
  on conflict do nothing;

  if p_intent = 'register' then
    insert into public.user_library (user_id, franchise_id, status, started_at, finished_at, removed_at)
    values (
      v_user_id,
      v_franchise_id,
      v_status,
      case when v_status in ('watching', 'caught_up', 'paused', 'completed') then current_date end,
      case when v_status = 'completed' then current_date end,
      null
    )
    on conflict (user_id, franchise_id) do update
    set status = excluded.status,
        started_at = coalesce(public.user_library.started_at, excluded.started_at),
        finished_at = excluded.finished_at,
        removed_at = null,
        updated_at = now();

    insert into public.user_entry_progress (
      user_id, entry_id, episodes_watched, completed, last_watched_at, personal_note
    )
    values (
      v_user_id, v_entry_id, p_initial_episode, v_completed,
      case when p_initial_episode > 0 then now() end, p_personal_note
    )
    on conflict (user_id, entry_id) do update
    set episodes_watched = excluded.episodes_watched,
        completed = excluded.completed,
        last_watched_at = excluded.last_watched_at,
        personal_note = excluded.personal_note,
        updated_at = now();

    if p_favorite then
      insert into public.favorites (user_id, franchise_id)
      values (v_user_id, v_franchise_id)
      on conflict do nothing;
    else
      delete from public.favorites
      where user_id = v_user_id and favorites.franchise_id = v_franchise_id;
    end if;

    if p_rating is not null then
      insert into public.ratings (user_id, franchise_id, score)
      values (v_user_id, v_franchise_id, p_rating)
      on conflict (user_id, franchise_id) do update
      set score = excluded.score, updated_at = now();
    else
      delete from public.ratings
      where user_id = v_user_id and ratings.franchise_id = v_franchise_id;
    end if;

    insert into public.activity_history (
      user_id, event_type, franchise_id, entry_id, metadata
    )
    values (
      v_user_id, 'library_added', v_franchise_id, v_entry_id,
      jsonb_build_object('source', 'manual', 'initial_status', v_status::text)
    );
  end if;

  return query select v_franchise_id, v_entry_id, v_slug, p_intent;
end;
$$;

revoke all on function public.submit_manual_anime(
  text, text, text, integer, integer, text, text[], text, text, text, integer,
  text, text, text, text, text, text[], integer, boolean, numeric, text, text,
  text, uuid
) from public, anon;

grant execute on function public.submit_manual_anime(
  text, text, text, integer, integer, text, text[], text, text, text, integer,
  text, text, text, text, text, text[], integer, boolean, numeric, text, text,
  text, uuid
) to authenticated;
