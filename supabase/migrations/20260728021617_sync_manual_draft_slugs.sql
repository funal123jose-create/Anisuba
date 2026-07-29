-- Manual drafts can still change title. Keep their public route coherent until
-- they enter review or are published; after that, the slug remains stable.

create or replace function private.catalog_slug_base(p_title text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    nullif(
      trim(both '-' from regexp_replace(
        lower(translate(
          coalesce(p_title, ''),
          'áéíóúüñÁÉÍÓÚÜÑ',
          'aeiouunAEIOUUN'
        )),
        '[^a-z0-9]+',
        '-',
        'g'
      )),
      ''
    ),
    'anime'
  );
$$;

create or replace function private.next_catalog_slug(
  p_title text,
  p_exclude_franchise_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base text := private.catalog_slug_base(p_title);
  v_candidate text;
  v_suffix integer := 1;
begin
  v_candidate := v_base;
  while exists (
    select 1
    from public.anime_franchises franchise
    where franchise.slug = v_candidate
      and franchise.id is distinct from p_exclude_franchise_id
  ) loop
    v_suffix := v_suffix + 1;
    v_candidate := v_base || '-' || v_suffix::text;
  end loop;
  return v_candidate;
end;
$$;

create or replace function private.sync_editable_manual_franchise_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.source_name = 'manual'
     and old.record_status in (
       'draft'::public.catalog_record_status,
       'rejected'::public.catalog_record_status
     )
     and new.canonical_title is distinct from old.canonical_title then
    new.slug := private.next_catalog_slug(new.canonical_title, new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists sync_editable_manual_franchise_slug
  on public.anime_franchises;
create trigger sync_editable_manual_franchise_slug
before update of canonical_title
on public.anime_franchises
for each row execute function private.sync_editable_manual_franchise_slug();

create or replace function private.sync_primary_entry_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.slug is distinct from old.slug then
    update public.anime_entries
    set slug = new.slug,
        updated_at = now()
    where franchise_id = new.id
      and sequence_number = 1;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_primary_entry_slug
  on public.anime_franchises;
create trigger sync_primary_entry_slug
after update of slug
on public.anime_franchises
for each row execute function private.sync_primary_entry_slug();

-- Repair editable manual drafts generically, without targeting user IDs.
do $$
declare
  v_franchise record;
  v_slug text;
begin
  for v_franchise in
    select id, canonical_title, slug
    from public.anime_franchises
    where source_name = 'manual'
      and record_status in (
        'draft'::public.catalog_record_status,
        'rejected'::public.catalog_record_status
      )
    order by created_at, id
  loop
    v_slug := private.next_catalog_slug(
      v_franchise.canonical_title,
      v_franchise.id
    );
    if v_slug is distinct from v_franchise.slug then
      update public.anime_franchises
      set slug = v_slug,
          updated_at = now()
      where id = v_franchise.id;
    end if;
  end loop;
end;
$$;
