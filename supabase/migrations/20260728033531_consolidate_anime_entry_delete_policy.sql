drop policy if exists "Catalog admins delete entries"
on public.anime_entries;
drop policy if exists "Users delete secondary entries in owned drafts"
on public.anime_entries;

create policy "Admins or draft owners delete permitted entries"
on public.anime_entries for delete to authenticated
using (
  (select private.is_catalog_admin())
  or (
    exists (
      select 1
      from public.anime_franchises franchise
      where franchise.id = anime_entries.franchise_id
        and franchise.submitted_by = (select auth.uid())
        and franchise.record_status = 'draft'
    )
    and anime_entries.id <> (
      select primary_entry.id
      from public.anime_entries primary_entry
      where primary_entry.franchise_id = anime_entries.franchise_id
      order by primary_entry.sequence_number, primary_entry.created_at
      limit 1
    )
  )
);
