drop policy if exists "Admins or draft owners delete permitted entries"
on public.anime_entries;

create policy "Admins or draft owners delete permitted entries"
on public.anime_entries for delete to authenticated
using (
  (select private.is_catalog_admin())
  or (
    anime_entries.sequence_number > 1
    and exists (
      select 1
      from public.anime_franchises franchise
      where franchise.id = anime_entries.franchise_id
        and franchise.submitted_by = (select auth.uid())
        and franchise.record_status = 'draft'
    )
  )
);
