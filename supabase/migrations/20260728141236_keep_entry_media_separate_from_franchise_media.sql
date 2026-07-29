-- Entry-specific media must never overwrite the franchise-level projection.
-- This keeps each season, OVA, movie or special visually independent.
create or replace function public.attach_catalog_upload(
  p_franchise_id uuid,
  p_entry_id uuid,
  p_asset_kind text,
  p_storage_bucket text,
  p_storage_path text,
  p_asset_url text,
  p_mime_type text,
  p_byte_size bigint,
  p_width integer default null,
  p_height integer default null
)
returns table (
  asset_id uuid,
  previous_storage_bucket text,
  previous_storage_path text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_asset_id uuid;
  v_previous_bucket text;
  v_previous_path text;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if p_asset_kind not in ('cover', 'banner') then
    raise exception 'INVALID_ASSET_KIND' using errcode = '22023';
  end if;
  if p_storage_bucket <> 'anime-media'
     or p_storage_path is null
     or p_storage_path not like
       ('user-submissions/' || v_user_id::text || '/%') then
    raise exception 'INVALID_STORAGE_PATH' using errcode = '22023';
  end if;
  if p_asset_url is null or btrim(p_asset_url) = '' then
    raise exception 'INVALID_ASSET_URL' using errcode = '22023';
  end if;
  if p_mime_type not in ('image/jpeg', 'image/png', 'image/webp')
     or p_byte_size is null
     or p_byte_size < 1
     or p_byte_size > 5242880 then
    raise exception 'INVALID_ASSET_FILE' using errcode = '22023';
  end if;
  if not exists (
    select 1
    from public.anime_franchises franchise
    where franchise.id = p_franchise_id
      and (
        (
          franchise.submitted_by = v_user_id
          and franchise.record_status = 'draft'
        )
        or private.is_catalog_admin()
      )
  ) then
    raise exception 'CATALOG_DRAFT_NOT_FOUND' using errcode = '42501';
  end if;
  if p_entry_id is not null and not exists (
    select 1
    from public.anime_entries entry
    where entry.id = p_entry_id
      and entry.franchise_id = p_franchise_id
  ) then
    raise exception 'CATALOG_ENTRY_NOT_FOUND' using errcode = '22023';
  end if;

  select storage_bucket, storage_path
  into v_previous_bucket, v_previous_path
  from public.anime_assets
  where franchise_id = p_franchise_id
    and entry_id is not distinct from p_entry_id
    and asset_kind = p_asset_kind
    and is_primary
  for update;

  delete from public.anime_assets
  where franchise_id = p_franchise_id
    and entry_id is not distinct from p_entry_id
    and asset_kind = p_asset_kind
    and is_primary;

  insert into public.anime_assets (
    franchise_id, entry_id, asset_kind, source_type, storage_bucket,
    storage_path, asset_url, mime_type, byte_size, width, height,
    is_primary, created_by
  )
  values (
    p_franchise_id, p_entry_id, p_asset_kind, 'upload', p_storage_bucket,
    p_storage_path, p_asset_url, p_mime_type, p_byte_size, p_width, p_height,
    true, v_user_id
  )
  returning id into v_asset_id;

  if p_entry_id is null then
    if p_asset_kind = 'cover' then
      update public.anime_franchises
      set cover_url = p_asset_url
      where id = p_franchise_id;
    else
      update public.anime_franchises
      set banner_url = p_asset_url
      where id = p_franchise_id;
    end if;
  elsif p_asset_kind = 'cover' then
    update public.anime_entries
    set cover_url = p_asset_url
    where id = p_entry_id and franchise_id = p_franchise_id;
  else
    update public.anime_entries
    set banner_url = p_asset_url
    where id = p_entry_id and franchise_id = p_franchise_id;
  end if;

  return query
  select v_asset_id, v_previous_bucket, v_previous_path;
end;
$$;

revoke all on function public.attach_catalog_upload(
  uuid, uuid, text, text, text, text, text, bigint, integer, integer
) from public, anon, authenticated, service_role;
grant execute on function public.attach_catalog_upload(
  uuid, uuid, text, text, text, text, text, bigint, integer, integer
) to authenticated;
