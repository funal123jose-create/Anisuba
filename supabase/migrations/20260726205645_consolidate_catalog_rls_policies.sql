-- Consolidate administrator and user branches into one permissive policy per
-- action. This preserves authorization while avoiding redundant policy
-- evaluation reported by the Supabase performance advisor.

drop policy if exists "Authenticated users can read published franchises"
on public.anime_franchises;
drop policy if exists "Users can insert their own catalog drafts"
on public.anime_franchises;
drop policy if exists "Users can update their own catalog drafts"
on public.anime_franchises;
drop policy if exists "Catalog admins manage franchises"
on public.anime_franchises;

create policy "Users read visible franchises"
on public.anime_franchises for select to authenticated
using (
  record_status = 'published'
  or submitted_by = (select auth.uid())
  or (select private.is_catalog_admin())
);

create policy "Users create owned drafts or admins create catalog"
on public.anime_franchises for insert to authenticated
with check (
  (
    submitted_by = (select auth.uid())
    and record_status = 'draft'
  )
  or (select private.is_catalog_admin())
);

create policy "Users edit owned drafts or admins edit catalog"
on public.anime_franchises for update to authenticated
using (
  (
    submitted_by = (select auth.uid())
    and record_status in ('draft', 'rejected')
  )
  or (select private.is_catalog_admin())
)
with check (
  (
    submitted_by = (select auth.uid())
    and record_status = 'draft'
  )
  or (select private.is_catalog_admin())
);

create policy "Catalog admins delete franchises"
on public.anime_franchises for delete to authenticated
using ((select private.is_catalog_admin()));

drop policy if exists "Authenticated users can read entries"
on public.anime_entries;
drop policy if exists "Users can insert entries in their own catalog drafts"
on public.anime_entries;
drop policy if exists "Users can update entries in their own catalog drafts"
on public.anime_entries;
drop policy if exists "Catalog admins manage entries"
on public.anime_entries;

create policy "Users read visible entries"
on public.anime_entries for select to authenticated
using (
  exists (
    select 1
    from public.anime_franchises franchise
    where franchise.id = anime_entries.franchise_id
      and (
        franchise.record_status = 'published'
        or franchise.submitted_by = (select auth.uid())
      )
  )
  or (select private.is_catalog_admin())
);

create policy "Users create entries in owned drafts or admins create entries"
on public.anime_entries for insert to authenticated
with check (
  exists (
    select 1
    from public.anime_franchises franchise
    where franchise.id = anime_entries.franchise_id
      and franchise.submitted_by = (select auth.uid())
      and franchise.record_status = 'draft'
  )
  or (select private.is_catalog_admin())
);

create policy "Users edit entries in owned drafts or admins edit entries"
on public.anime_entries for update to authenticated
using (
  exists (
    select 1
    from public.anime_franchises franchise
    where franchise.id = anime_entries.franchise_id
      and franchise.submitted_by = (select auth.uid())
      and franchise.record_status = 'draft'
  )
  or (select private.is_catalog_admin())
)
with check (
  exists (
    select 1
    from public.anime_franchises franchise
    where franchise.id = anime_entries.franchise_id
      and franchise.submitted_by = (select auth.uid())
      and franchise.record_status = 'draft'
  )
  or (select private.is_catalog_admin())
);

create policy "Catalog admins delete entries"
on public.anime_entries for delete to authenticated
using ((select private.is_catalog_admin()));

drop policy if exists "Authenticated users can read genres"
on public.genres;
drop policy if exists "Catalog admins manage genres"
on public.genres;

create policy "Authenticated users read genres"
on public.genres for select to authenticated
using (true);
create policy "Catalog admins create genres"
on public.genres for insert to authenticated
with check ((select private.is_catalog_admin()));
create policy "Catalog admins update genres"
on public.genres for update to authenticated
using ((select private.is_catalog_admin()))
with check ((select private.is_catalog_admin()));
create policy "Catalog admins delete genres"
on public.genres for delete to authenticated
using ((select private.is_catalog_admin()));

drop policy if exists "Authenticated users can read visible anime genres"
on public.anime_genres;
drop policy if exists "Users can add genres to their own catalog drafts"
on public.anime_genres;
drop policy if exists "Users can remove genres from their own catalog drafts"
on public.anime_genres;
drop policy if exists "Catalog admins manage anime genres"
on public.anime_genres;

create policy "Users read visible anime genres"
on public.anime_genres for select to authenticated
using (
  exists (
    select 1
    from public.anime_franchises franchise
    where franchise.id = anime_genres.franchise_id
      and (
        franchise.record_status = 'published'
        or franchise.submitted_by = (select auth.uid())
      )
  )
  or (select private.is_catalog_admin())
);

create policy "Users add genres to owned drafts or admins add genres"
on public.anime_genres for insert to authenticated
with check (
  exists (
    select 1
    from public.anime_franchises franchise
    where franchise.id = anime_genres.franchise_id
      and franchise.submitted_by = (select auth.uid())
      and franchise.record_status = 'draft'
  )
  or (select private.is_catalog_admin())
);

create policy "Users remove genres from owned drafts or admins remove genres"
on public.anime_genres for delete to authenticated
using (
  exists (
    select 1
    from public.anime_franchises franchise
    where franchise.id = anime_genres.franchise_id
      and franchise.submitted_by = (select auth.uid())
      and franchise.record_status = 'draft'
  )
  or (select private.is_catalog_admin())
);

drop policy if exists "Users read visible external IDs"
on public.anime_external_ids;
drop policy if exists "Users add external IDs to their drafts"
on public.anime_external_ids;
drop policy if exists "Users update external IDs in their drafts"
on public.anime_external_ids;
drop policy if exists "Users delete external IDs from their drafts"
on public.anime_external_ids;
drop policy if exists "Catalog admins manage external IDs"
on public.anime_external_ids;

create policy "Users read visible external IDs"
on public.anime_external_ids for select to authenticated
using (
  exists (
    select 1
    from public.anime_entries entry
    join public.anime_franchises franchise on franchise.id = entry.franchise_id
    where entry.id = anime_external_ids.entry_id
      and (
        franchise.record_status = 'published'
        or franchise.submitted_by = (select auth.uid())
      )
  )
  or (select private.is_catalog_admin())
);

create policy "Users add external IDs to owned drafts or admins add IDs"
on public.anime_external_ids for insert to authenticated
with check (
  exists (
    select 1
    from public.anime_entries entry
    join public.anime_franchises franchise on franchise.id = entry.franchise_id
    where entry.id = anime_external_ids.entry_id
      and franchise.submitted_by = (select auth.uid())
      and franchise.record_status = 'draft'
  )
  or (select private.is_catalog_admin())
);

create policy "Users update external IDs in owned drafts or admins update IDs"
on public.anime_external_ids for update to authenticated
using (
  exists (
    select 1
    from public.anime_entries entry
    join public.anime_franchises franchise on franchise.id = entry.franchise_id
    where entry.id = anime_external_ids.entry_id
      and franchise.submitted_by = (select auth.uid())
      and franchise.record_status = 'draft'
  )
  or (select private.is_catalog_admin())
)
with check (
  exists (
    select 1
    from public.anime_entries entry
    join public.anime_franchises franchise on franchise.id = entry.franchise_id
    where entry.id = anime_external_ids.entry_id
      and franchise.submitted_by = (select auth.uid())
      and franchise.record_status = 'draft'
  )
  or (select private.is_catalog_admin())
);

create policy "Users delete external IDs from owned drafts or admins delete IDs"
on public.anime_external_ids for delete to authenticated
using (
  exists (
    select 1
    from public.anime_entries entry
    join public.anime_franchises franchise on franchise.id = entry.franchise_id
    where entry.id = anime_external_ids.entry_id
      and franchise.submitted_by = (select auth.uid())
      and franchise.record_status = 'draft'
  )
  or (select private.is_catalog_admin())
);

drop policy if exists "Users read visible anime relations"
on public.anime_relations;
drop policy if exists "Users add relations from their drafts"
on public.anime_relations;
drop policy if exists "Users update relations from their drafts"
on public.anime_relations;
drop policy if exists "Users delete relations from their drafts"
on public.anime_relations;
drop policy if exists "Catalog admins manage anime relations"
on public.anime_relations;

create policy "Users read visible relations"
on public.anime_relations for select to authenticated
using (
  (
    exists (
      select 1
      from public.anime_entries source_entry
      join public.anime_franchises source_franchise
        on source_franchise.id = source_entry.franchise_id
      where source_entry.id = anime_relations.source_entry_id
        and (
          source_franchise.record_status = 'published'
          or source_franchise.submitted_by = (select auth.uid())
        )
    )
    and exists (
      select 1
      from public.anime_entries target_entry
      join public.anime_franchises target_franchise
        on target_franchise.id = target_entry.franchise_id
      where target_entry.id = anime_relations.target_entry_id
        and (
          target_franchise.record_status = 'published'
          or target_franchise.submitted_by = (select auth.uid())
        )
    )
  )
  or (select private.is_catalog_admin())
);

create policy "Users add relations from owned drafts or admins add relations"
on public.anime_relations for insert to authenticated
with check (
  (
    created_by = (select auth.uid())
    and exists (
      select 1
      from public.anime_entries source_entry
      join public.anime_franchises source_franchise
        on source_franchise.id = source_entry.franchise_id
      where source_entry.id = anime_relations.source_entry_id
        and source_franchise.submitted_by = (select auth.uid())
        and source_franchise.record_status = 'draft'
    )
    and exists (
      select 1
      from public.anime_entries target_entry
      join public.anime_franchises target_franchise
        on target_franchise.id = target_entry.franchise_id
      where target_entry.id = anime_relations.target_entry_id
        and (
          target_franchise.record_status = 'published'
          or (
            target_franchise.submitted_by = (select auth.uid())
            and target_franchise.record_status = 'draft'
          )
        )
    )
  )
  or (select private.is_catalog_admin())
);

create policy "Users update relations from owned drafts or admins update relations"
on public.anime_relations for update to authenticated
using (
  (
    created_by = (select auth.uid())
    and exists (
      select 1
      from public.anime_entries source_entry
      join public.anime_franchises source_franchise
        on source_franchise.id = source_entry.franchise_id
      where source_entry.id = anime_relations.source_entry_id
        and source_franchise.submitted_by = (select auth.uid())
        and source_franchise.record_status = 'draft'
    )
  )
  or (select private.is_catalog_admin())
)
with check (
  (
    created_by = (select auth.uid())
    and exists (
      select 1
      from public.anime_entries source_entry
      join public.anime_franchises source_franchise
        on source_franchise.id = source_entry.franchise_id
      where source_entry.id = anime_relations.source_entry_id
        and source_franchise.submitted_by = (select auth.uid())
        and source_franchise.record_status = 'draft'
    )
    and exists (
      select 1
      from public.anime_entries target_entry
      join public.anime_franchises target_franchise
        on target_franchise.id = target_entry.franchise_id
      where target_entry.id = anime_relations.target_entry_id
        and (
          target_franchise.record_status = 'published'
          or (
            target_franchise.submitted_by = (select auth.uid())
            and target_franchise.record_status = 'draft'
          )
        )
    )
  )
  or (select private.is_catalog_admin())
);

create policy "Users delete relations from owned drafts or admins delete relations"
on public.anime_relations for delete to authenticated
using (
  (
    created_by = (select auth.uid())
    and exists (
      select 1
      from public.anime_entries source_entry
      join public.anime_franchises source_franchise
        on source_franchise.id = source_entry.franchise_id
      where source_entry.id = anime_relations.source_entry_id
        and source_franchise.submitted_by = (select auth.uid())
        and source_franchise.record_status = 'draft'
    )
  )
  or (select private.is_catalog_admin())
);

drop policy if exists "Users read their catalog submissions"
on public.catalog_submissions;
drop policy if exists "Catalog admins read catalog submissions"
on public.catalog_submissions;

create policy "Users read own submissions or admins read all submissions"
on public.catalog_submissions for select to authenticated
using (
  submitted_by = (select auth.uid())
  or (select private.is_catalog_admin())
);

drop policy if exists "Users read their change requests"
on public.catalog_change_requests;
drop policy if exists "Users create draft change requests"
on public.catalog_change_requests;
drop policy if exists "Users update their draft change requests"
on public.catalog_change_requests;
drop policy if exists "Users delete their draft change requests"
on public.catalog_change_requests;
drop policy if exists "Catalog admins manage change requests"
on public.catalog_change_requests;

create policy "Users read own change requests or admins read all requests"
on public.catalog_change_requests for select to authenticated
using (
  requested_by = (select auth.uid())
  or (select private.is_catalog_admin())
);

create policy "Users create own draft requests or admins create requests"
on public.catalog_change_requests for insert to authenticated
with check (
  (
    requested_by = (select auth.uid())
    and status = 'draft'
    and exists (
      select 1
      from public.anime_franchises franchise
      where franchise.id = catalog_change_requests.franchise_id
        and franchise.record_status = 'published'
    )
  )
  or (select private.is_catalog_admin())
);

create policy "Users update own draft requests or admins update requests"
on public.catalog_change_requests for update to authenticated
using (
  (
    requested_by = (select auth.uid())
    and status = 'draft'
  )
  or (select private.is_catalog_admin())
)
with check (
  (
    requested_by = (select auth.uid())
    and status = 'draft'
  )
  or (select private.is_catalog_admin())
);

create policy "Users delete own draft requests or admins delete requests"
on public.catalog_change_requests for delete to authenticated
using (
  (
    requested_by = (select auth.uid())
    and status = 'draft'
  )
  or (select private.is_catalog_admin())
);
