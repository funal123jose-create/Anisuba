-- Run the manual submission transaction with the authenticated caller's privileges.
-- Catalog mutations are allowed only for private records owned by auth.uid().

create policy "Users can insert their own catalog drafts"
on public.anime_franchises for insert to authenticated
with check (
  submitted_by = (select auth.uid())
  and record_status = 'draft'
);

create policy "Users can update their own catalog drafts"
on public.anime_franchises for update to authenticated
using (submitted_by = (select auth.uid()))
with check (
  submitted_by = (select auth.uid())
  and record_status = 'draft'
);

create policy "Users can insert entries in their own catalog drafts"
on public.anime_entries for insert to authenticated
with check (exists (
  select 1
  from public.anime_franchises franchise
  where franchise.id = anime_entries.franchise_id
    and franchise.submitted_by = (select auth.uid())
    and franchise.record_status = 'draft'
));

create policy "Users can update entries in their own catalog drafts"
on public.anime_entries for update to authenticated
using (exists (
  select 1
  from public.anime_franchises franchise
  where franchise.id = anime_entries.franchise_id
    and franchise.submitted_by = (select auth.uid())
))
with check (exists (
  select 1
  from public.anime_franchises franchise
  where franchise.id = anime_entries.franchise_id
    and franchise.submitted_by = (select auth.uid())
    and franchise.record_status = 'draft'
));

create policy "Users can add genres to their own catalog drafts"
on public.anime_genres for insert to authenticated
with check (exists (
  select 1
  from public.anime_franchises franchise
  where franchise.id = anime_genres.franchise_id
    and franchise.submitted_by = (select auth.uid())
    and franchise.record_status = 'draft'
));

create policy "Users can remove genres from their own catalog drafts"
on public.anime_genres for delete to authenticated
using (exists (
  select 1
  from public.anime_franchises franchise
  where franchise.id = anime_genres.franchise_id
    and franchise.submitted_by = (select auth.uid())
    and franchise.record_status = 'draft'
));

grant insert, update on public.anime_franchises to authenticated;
grant insert, update on public.anime_entries to authenticated;
grant insert, delete on public.anime_genres to authenticated;

alter function public.submit_manual_anime(
  text, text, text, integer, integer, text, text[], text, text, text, integer,
  text, text, text, text, text, text[], integer, boolean, numeric, text, text,
  text, uuid
) security invoker;
