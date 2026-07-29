-- Catalog media foundation.
-- Files live in Supabase Storage while this table keeps auditable metadata and
-- links each asset to its catalog record. Existing cover_url/banner_url
-- columns remain as compatibility projections for the current UI.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'anime-media',
  'anime-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.anime_assets (
  id uuid primary key default gen_random_uuid(),
  franchise_id uuid not null
    references public.anime_franchises (id) on delete cascade,
  entry_id uuid
    references public.anime_entries (id) on delete cascade,
  asset_kind text not null
    check (asset_kind in ('cover', 'banner', 'promo')),
  source_type text not null
    check (source_type in ('upload', 'external_api', 'manual_url')),
  storage_bucket text,
  storage_path text,
  asset_url text not null,
  mime_type text,
  byte_size bigint check (byte_size is null or byte_size between 1 and 5242880),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  is_primary boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint anime_assets_entry_belongs_to_franchise_check
    check (entry_id is null or franchise_id is not null),
  constraint anime_assets_source_location_check check (
    (
      source_type = 'upload'
      and storage_bucket is not null
      and storage_path is not null
    )
    or (
      source_type in ('external_api', 'manual_url')
      and storage_bucket is null
      and storage_path is null
    )
  ),
  constraint anime_assets_upload_mime_check check (
    source_type <> 'upload'
    or mime_type in ('image/jpeg', 'image/png', 'image/webp')
  )
);

create index if not exists anime_assets_franchise_id_idx
  on public.anime_assets (franchise_id);
create index if not exists anime_assets_entry_id_idx
  on public.anime_assets (entry_id)
  where entry_id is not null;
create index if not exists anime_assets_created_by_idx
  on public.anime_assets (created_by)
  where created_by is not null;
create unique index if not exists anime_assets_storage_object_uidx
  on public.anime_assets (storage_bucket, storage_path)
  where storage_bucket is not null and storage_path is not null;
create unique index if not exists anime_assets_primary_franchise_uidx
  on public.anime_assets (franchise_id, asset_kind)
  where entry_id is null and is_primary;
create unique index if not exists anime_assets_primary_entry_uidx
  on public.anime_assets (entry_id, asset_kind)
  where entry_id is not null and is_primary;

drop trigger if exists anime_assets_set_updated_at on public.anime_assets;
create trigger anime_assets_set_updated_at
before update on public.anime_assets
for each row execute function public.set_updated_at();

alter table public.anime_assets enable row level security;

create policy "Users read visible catalog assets"
on public.anime_assets for select to authenticated
using (
  exists (
    select 1
    from public.anime_franchises franchise
    where franchise.id = anime_assets.franchise_id
      and (
        franchise.record_status = 'published'
        or franchise.submitted_by = (select auth.uid())
        or (select private.is_catalog_admin())
      )
  )
);

create policy "Users add assets to owned drafts or admins add assets"
on public.anime_assets for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.anime_franchises franchise
    where franchise.id = anime_assets.franchise_id
      and (
        (
          franchise.submitted_by = (select auth.uid())
          and franchise.record_status = 'draft'
        )
        or (select private.is_catalog_admin())
      )
  )
  and (
    anime_assets.entry_id is null
    or exists (
      select 1
      from public.anime_entries entry
      where entry.id = anime_assets.entry_id
        and entry.franchise_id = anime_assets.franchise_id
    )
  )
);

create policy "Users update assets in owned drafts or admins update assets"
on public.anime_assets for update to authenticated
using (
  exists (
    select 1
    from public.anime_franchises franchise
    where franchise.id = anime_assets.franchise_id
      and (
        (
          franchise.submitted_by = (select auth.uid())
          and franchise.record_status = 'draft'
        )
        or (select private.is_catalog_admin())
      )
  )
)
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.anime_franchises franchise
    where franchise.id = anime_assets.franchise_id
      and (
        (
          franchise.submitted_by = (select auth.uid())
          and franchise.record_status = 'draft'
        )
        or (select private.is_catalog_admin())
      )
  )
  and (
    anime_assets.entry_id is null
    or exists (
      select 1
      from public.anime_entries entry
      where entry.id = anime_assets.entry_id
        and entry.franchise_id = anime_assets.franchise_id
    )
  )
);

create policy "Users delete assets from owned drafts or admins delete assets"
on public.anime_assets for delete to authenticated
using (
  exists (
    select 1
    from public.anime_franchises franchise
    where franchise.id = anime_assets.franchise_id
      and (
        (
          franchise.submitted_by = (select auth.uid())
          and franchise.record_status = 'draft'
        )
        or (select private.is_catalog_admin())
      )
  )
);

grant select, insert, update, delete on public.anime_assets to authenticated;
grant select, insert, update, delete on public.anime_assets to service_role;

-- Public buckets only make downloads public. Mutation access remains scoped to
-- user-submissions/<auth.uid()>/... through storage.objects RLS.
create policy "Users list their catalog uploads"
on storage.objects for select to authenticated
using (
  bucket_id = 'anime-media'
  and (storage.foldername(name))[1] = 'user-submissions'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy "Users upload catalog media to their folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'anime-media'
  and (storage.foldername(name))[1] = 'user-submissions'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy "Users delete their catalog uploads"
on storage.objects for delete to authenticated
using (
  bucket_id = 'anime-media'
  and (storage.foldername(name))[1] = 'user-submissions'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

-- Atomically swaps asset metadata and the legacy URL projections after the
-- physical object has been uploaded. The previous object path is returned so
-- the application can remove it as a compensating cleanup.
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
    franchise_id,
    entry_id,
    asset_kind,
    source_type,
    storage_bucket,
    storage_path,
    asset_url,
    mime_type,
    byte_size,
    width,
    height,
    is_primary,
    created_by
  )
  values (
    p_franchise_id,
    p_entry_id,
    p_asset_kind,
    'upload',
    p_storage_bucket,
    p_storage_path,
    p_asset_url,
    p_mime_type,
    p_byte_size,
    p_width,
    p_height,
    true,
    v_user_id
  )
  returning id into v_asset_id;

  if p_asset_kind = 'cover' then
    update public.anime_franchises
    set cover_url = p_asset_url
    where id = p_franchise_id;

    if p_entry_id is not null then
      update public.anime_entries
      set cover_url = p_asset_url
      where id = p_entry_id and franchise_id = p_franchise_id;
    end if;
  else
    update public.anime_franchises
    set banner_url = p_asset_url
    where id = p_franchise_id;

    if p_entry_id is not null then
      update public.anime_entries
      set banner_url = p_asset_url
      where id = p_entry_id and franchise_id = p_franchise_id;
    end if;
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
