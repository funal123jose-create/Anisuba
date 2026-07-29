create or replace function public.sync_anilist_franchise_tracking_v2(
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
  v_primary_entry_id uuid;
  v_item jsonb;
  v_entry_id uuid;
  v_existing_franchise_id uuid;
  v_relation_type text;
  v_position integer;
  v_base_synced integer := 0;
  v_base_skipped integer := 0;
  v_total integer := 0;
  v_linked integer := 0;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  perform 1
  from public.anime_franchises
  where id = p_franchise_id
    and submitted_by = v_user_id
    and record_status = 'draft';

  if not found then
    raise exception 'OWNED_DRAFT_NOT_FOUND' using errcode = '42501';
  end if;

  select result.synced_count, result.skipped_count, result.total_count
  into v_base_synced, v_base_skipped, v_total
  from public.sync_anilist_franchise_tracking(
    p_franchise_id,
    p_primary_anilist_id,
    p_entries
  ) result;

  select external_id.entry_id
  into v_primary_entry_id
  from public.anime_external_ids external_id
  join public.anime_entries entry on entry.id = external_id.entry_id
  where external_id.provider = 'anilist'
    and external_id.external_id = p_primary_anilist_id::text
    and entry.franchise_id = p_franchise_id
  limit 1;

  for v_item, v_position in
    select item.value, item.ordinality::integer
    from jsonb_array_elements(p_entries) with ordinality as item(value, ordinality)
  loop
    v_entry_id := null;
    v_existing_franchise_id := null;

    select entry.id, entry.franchise_id
    into v_entry_id, v_existing_franchise_id
    from public.anime_external_ids external_id
    join public.anime_entries entry on entry.id = external_id.entry_id
    join public.anime_franchises franchise on franchise.id = entry.franchise_id
    where external_id.provider = 'anilist'
      and external_id.external_id = (v_item ->> 'anilistId')
      and entry.franchise_id <> p_franchise_id
      and (
        franchise.submitted_by = v_user_id
        or franchise.record_status = 'published'
      )
    limit 1;

    if v_entry_id is null or v_entry_id = v_primary_entry_id then
      continue;
    end if;

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
      v_position,
      'anilist',
      v_item ->> 'anilistId',
      false,
      v_user_id
    )
    on conflict (source_entry_id, target_entry_id, relation_type)
    do update set
      sort_order = excluded.sort_order,
      updated_at = pg_catalog.now();

    insert into public.user_entry_progress (
      user_id,
      entry_id,
      episodes_watched,
      completed
    )
    values (v_user_id, v_entry_id, 0, false)
    on conflict (user_id, entry_id) do nothing;

    v_linked := v_linked + 1;
  end loop;

  return query
  select
    v_base_synced + v_linked,
    greatest(v_base_skipped - v_linked, 0),
    v_total;
end;
$function$;

revoke all on function public.sync_anilist_franchise_tracking_v2(
  uuid, integer, jsonb
) from public, anon;

grant execute on function public.sync_anilist_franchise_tracking_v2(
  uuid, integer, jsonb
) to authenticated, service_role;

comment on function public.sync_anilist_franchise_tracking_v2(
  uuid, integer, jsonb
) is
  'Synchronizes AniList tracking and safely links existing owned or published entries without duplicating or moving them.';
