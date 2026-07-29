-- Owners may remove additional entries while a catalog record is still a draft.
-- The primary entry (the lowest sequence number) remains protected.
drop policy if exists "Users delete secondary entries in owned drafts"
on public.anime_entries;

create policy "Users delete secondary entries in owned drafts"
on public.anime_entries for delete to authenticated
using (
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
);
