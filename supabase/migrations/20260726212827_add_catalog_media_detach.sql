-- Removes one primary uploaded asset from an editable draft and clears the
-- compatibility URL columns in the same database transaction.

create or replace function public.detach_catalog_upload(
  p_franchise_id uuid,
  p_entry_id uuid,
  p_asset_kind text
)
returns table (
  removed_storage_bucket text,
  removed_storage_path text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_removed_bucket text;
  v_removed_path text;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if p_asset_kind not in ('cover', 'banner') then
    raise exception 'INVALID_ASSET_KIND' using errcode = '22023';
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

  delete from public.anime_assets
  where franchise_id = p_franchise_id
    and entry_id is not distinct from p_entry_id
    and asset_kind = p_asset_kind
    and is_primary
  returning storage_bucket, storage_path
  into v_removed_bucket, v_removed_path;

  if p_asset_kind = 'cover' then
    update public.anime_franchises
    set cover_url = null
    where id = p_franchise_id;

    if p_entry_id is not null then
      update public.anime_entries
      set cover_url = null
      where id = p_entry_id and franchise_id = p_franchise_id;
    end if;
  else
    update public.anime_franchises
    set banner_url = null
    where id = p_franchise_id;

    if p_entry_id is not null then
      update public.anime_entries
      set banner_url = null
      where id = p_entry_id and franchise_id = p_franchise_id;
    end if;
  end if;

  return query select v_removed_bucket, v_removed_path;
end;
$$;

revoke all on function public.detach_catalog_upload(uuid, uuid, text)
from public, anon, authenticated, service_role;
grant execute on function public.detach_catalog_upload(uuid, uuid, text)
to authenticated;
