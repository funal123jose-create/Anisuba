-- Role-aware catalog policies and controlled moderation workflow.

create or replace function private.is_catalog_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.user_roles
      where user_id = (select auth.uid())
        and role_key = 'admin'
    );
$$;

revoke all on function private.is_catalog_admin()
from public, anon, authenticated, service_role;
grant usage on schema private to authenticated;
grant execute on function private.is_catalog_admin() to authenticated;

-- Owners can edit only actual drafts. A record under review is immutable until
-- it is withdrawn or rejected and reopened as a draft.
drop policy if exists "Users can update their own catalog drafts"
on public.anime_franchises;
create policy "Users can update their own catalog drafts"
on public.anime_franchises for update to authenticated
using (
  submitted_by = (select auth.uid())
  and record_status in ('draft', 'rejected')
)
with check (
  submitted_by = (select auth.uid())
  and record_status = 'draft'
);

drop policy if exists "Users can update entries in their own catalog drafts"
on public.anime_entries;
create policy "Users can update entries in their own catalog drafts"
on public.anime_entries for update to authenticated
using (exists (
  select 1
  from public.anime_franchises franchise
  where franchise.id = anime_entries.franchise_id
    and franchise.submitted_by = (select auth.uid())
    and franchise.record_status = 'draft'
))
with check (exists (
  select 1
  from public.anime_franchises franchise
  where franchise.id = anime_entries.franchise_id
    and franchise.submitted_by = (select auth.uid())
    and franchise.record_status = 'draft'
));

create policy "Catalog admins manage franchises"
on public.anime_franchises for all to authenticated
using ((select private.is_catalog_admin()))
with check ((select private.is_catalog_admin()));

create policy "Catalog admins manage entries"
on public.anime_entries for all to authenticated
using ((select private.is_catalog_admin()))
with check ((select private.is_catalog_admin()));

create policy "Catalog admins manage genres"
on public.genres for all to authenticated
using ((select private.is_catalog_admin()))
with check ((select private.is_catalog_admin()));

create policy "Catalog admins manage anime genres"
on public.anime_genres for all to authenticated
using ((select private.is_catalog_admin()))
with check ((select private.is_catalog_admin()));

create policy "Users read visible external IDs"
on public.anime_external_ids for select to authenticated
using (exists (
  select 1
  from public.anime_entries entry
  join public.anime_franchises franchise on franchise.id = entry.franchise_id
  where entry.id = anime_external_ids.entry_id
    and (
      franchise.record_status = 'published'
      or franchise.submitted_by = (select auth.uid())
    )
));

create policy "Users add external IDs to their drafts"
on public.anime_external_ids for insert to authenticated
with check (exists (
  select 1
  from public.anime_entries entry
  join public.anime_franchises franchise on franchise.id = entry.franchise_id
  where entry.id = anime_external_ids.entry_id
    and franchise.submitted_by = (select auth.uid())
    and franchise.record_status = 'draft'
));

create policy "Users update external IDs in their drafts"
on public.anime_external_ids for update to authenticated
using (exists (
  select 1
  from public.anime_entries entry
  join public.anime_franchises franchise on franchise.id = entry.franchise_id
  where entry.id = anime_external_ids.entry_id
    and franchise.submitted_by = (select auth.uid())
    and franchise.record_status = 'draft'
))
with check (exists (
  select 1
  from public.anime_entries entry
  join public.anime_franchises franchise on franchise.id = entry.franchise_id
  where entry.id = anime_external_ids.entry_id
    and franchise.submitted_by = (select auth.uid())
    and franchise.record_status = 'draft'
));

create policy "Users delete external IDs from their drafts"
on public.anime_external_ids for delete to authenticated
using (exists (
  select 1
  from public.anime_entries entry
  join public.anime_franchises franchise on franchise.id = entry.franchise_id
  where entry.id = anime_external_ids.entry_id
    and franchise.submitted_by = (select auth.uid())
    and franchise.record_status = 'draft'
));

create policy "Catalog admins manage external IDs"
on public.anime_external_ids for all to authenticated
using ((select private.is_catalog_admin()))
with check ((select private.is_catalog_admin()));

create policy "Users read visible anime relations"
on public.anime_relations for select to authenticated
using (
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
);

create policy "Users add relations from their drafts"
on public.anime_relations for insert to authenticated
with check (
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
);

create policy "Users update relations from their drafts"
on public.anime_relations for update to authenticated
using (
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
with check (
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
);

create policy "Users delete relations from their drafts"
on public.anime_relations for delete to authenticated
using (
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
);

create policy "Catalog admins manage anime relations"
on public.anime_relations for all to authenticated
using ((select private.is_catalog_admin()))
with check ((select private.is_catalog_admin()));

create policy "Users read their catalog submissions"
on public.catalog_submissions for select to authenticated
using (submitted_by = (select auth.uid()));

create policy "Catalog admins read catalog submissions"
on public.catalog_submissions for select to authenticated
using ((select private.is_catalog_admin()));

create policy "Users read their change requests"
on public.catalog_change_requests for select to authenticated
using (requested_by = (select auth.uid()));

create policy "Users create draft change requests"
on public.catalog_change_requests for insert to authenticated
with check (
  requested_by = (select auth.uid())
  and status = 'draft'
  and exists (
    select 1
    from public.anime_franchises franchise
    where franchise.id = catalog_change_requests.franchise_id
      and franchise.record_status = 'published'
  )
);

create policy "Users update their draft change requests"
on public.catalog_change_requests for update to authenticated
using (
  requested_by = (select auth.uid())
  and status = 'draft'
)
with check (
  requested_by = (select auth.uid())
  and status = 'draft'
);

create policy "Users delete their draft change requests"
on public.catalog_change_requests for delete to authenticated
using (
  requested_by = (select auth.uid())
  and status = 'draft'
);

create policy "Catalog admins manage change requests"
on public.catalog_change_requests for all to authenticated
using ((select private.is_catalog_admin()))
with check ((select private.is_catalog_admin()));

grant select, insert, update, delete
on public.anime_external_ids, public.anime_relations, public.catalog_change_requests
to authenticated;
grant select on public.catalog_submissions to authenticated;

grant select, insert, update, delete
on public.anime_franchises, public.anime_entries, public.genres, public.anime_genres
to authenticated;

grant usage, select
on sequence public.anime_external_ids_id_seq, public.anime_relations_id_seq
to authenticated;

grant select, insert, update, delete
on public.anime_external_ids, public.anime_relations,
   public.catalog_submissions, public.catalog_change_requests
to service_role;
grant usage, select
on sequence public.anime_external_ids_id_seq, public.anime_relations_id_seq
to service_role;

create or replace function public.submit_catalog_for_review(
  p_franchise_id uuid,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_franchise public.anime_franchises%rowtype;
  v_submission_id uuid;
  v_review_round integer;
  v_snapshot jsonb;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  p_notes := nullif(btrim(p_notes), '');
  if p_notes is not null and char_length(p_notes) > 2000 then
    raise exception 'SUBMISSION_NOTES_TOO_LONG' using errcode = '22023';
  end if;

  select *
  into v_franchise
  from public.anime_franchises
  where id = p_franchise_id
  for update;

  if not found or v_franchise.submitted_by is distinct from v_user_id then
    raise exception 'CATALOG_DRAFT_NOT_FOUND' using errcode = '42501';
  end if;

  if v_franchise.record_status not in ('draft', 'rejected') then
    raise exception 'INVALID_CATALOG_TRANSITION' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.anime_entries
    where franchise_id = p_franchise_id
  ) then
    raise exception 'CATALOG_ENTRY_REQUIRED' using errcode = '23514';
  end if;

  select coalesce(max(review_round), 0) + 1
  into v_review_round
  from public.catalog_submissions
  where franchise_id = p_franchise_id;

  select jsonb_build_object(
    'franchise', to_jsonb(v_franchise),
    'entries', coalesce((
      select jsonb_agg(to_jsonb(entry_row) order by entry_row.sequence_number)
      from public.anime_entries entry_row
      where entry_row.franchise_id = p_franchise_id
    ), '[]'::jsonb),
    'external_ids', coalesce((
      select jsonb_agg(to_jsonb(external_row) order by external_row.provider)
      from public.anime_external_ids external_row
      join public.anime_entries entry_row on entry_row.id = external_row.entry_id
      where entry_row.franchise_id = p_franchise_id
    ), '[]'::jsonb),
    'relations', coalesce((
      select jsonb_agg(to_jsonb(relation_row) order by relation_row.sort_order, relation_row.id)
      from public.anime_relations relation_row
      join public.anime_entries entry_row on entry_row.id = relation_row.source_entry_id
      where entry_row.franchise_id = p_franchise_id
    ), '[]'::jsonb)
  )
  into v_snapshot;

  insert into public.catalog_submissions (
    franchise_id,
    review_round,
    status,
    submitted_by,
    submission_notes,
    submitted_snapshot
  )
  values (
    p_franchise_id,
    v_review_round,
    'in_review',
    v_user_id,
    p_notes,
    v_snapshot
  )
  returning id into v_submission_id;

  update public.anime_franchises
  set record_status = 'in_review',
      rejection_reason = null
  where id = p_franchise_id;

  return v_submission_id;
end;
$$;

create or replace function public.withdraw_catalog_submission(
  p_submission_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_submission public.catalog_submissions%rowtype;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select *
  into v_submission
  from public.catalog_submissions
  where id = p_submission_id
  for update;

  if not found
     or v_submission.submitted_by is distinct from v_user_id
     or v_submission.status <> 'in_review' then
    raise exception 'ACTIVE_SUBMISSION_NOT_FOUND' using errcode = '42501';
  end if;

  update public.catalog_submissions
  set status = 'withdrawn'
  where id = p_submission_id;

  update public.anime_franchises
  set record_status = 'draft'
  where id = v_submission.franchise_id
    and submitted_by = v_user_id
    and record_status = 'in_review';
end;
$$;

create or replace function public.review_catalog_submission(
  p_submission_id uuid,
  p_decision text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_submission public.catalog_submissions%rowtype;
  v_submission_status text;
  v_record_status public.catalog_record_status;
begin
  if v_user_id is null or not private.is_catalog_admin() then
    raise exception 'CATALOG_ADMIN_REQUIRED' using errcode = '42501';
  end if;

  p_decision := lower(btrim(p_decision));
  p_notes := nullif(btrim(p_notes), '');
  if p_decision not in ('published', 'rejected') then
    raise exception 'INVALID_REVIEW_DECISION' using errcode = '22023';
  end if;
  if p_notes is not null and char_length(p_notes) > 2000 then
    raise exception 'REVIEW_NOTES_TOO_LONG' using errcode = '22023';
  end if;
  if p_decision = 'rejected' and p_notes is null then
    raise exception 'REJECTION_REASON_REQUIRED' using errcode = '23514';
  end if;

  select *
  into v_submission
  from public.catalog_submissions
  where id = p_submission_id
  for update;

  if not found or v_submission.status <> 'in_review' then
    raise exception 'ACTIVE_SUBMISSION_NOT_FOUND' using errcode = '22023';
  end if;

  v_submission_status := case
    when p_decision = 'published' then 'approved'
    else 'rejected'
  end;
  v_record_status := p_decision::public.catalog_record_status;

  update public.catalog_submissions
  set status = v_submission_status,
      reviewed_by = v_user_id,
      review_notes = p_notes,
      reviewed_at = now()
  where id = p_submission_id;

  update public.anime_franchises
  set record_status = v_record_status,
      published_at = case when p_decision = 'published' then now() else null end,
      published_by = case when p_decision = 'published' then v_user_id else null end,
      rejection_reason = case when p_decision = 'rejected' then p_notes else null end
  where id = v_submission.franchise_id
    and record_status = 'in_review';

  return v_submission.franchise_id;
end;
$$;

create or replace function public.find_catalog_duplicates(
  p_title text,
  p_release_year integer default null,
  p_entry_type text default null,
  p_exclude_franchise_id uuid default null,
  p_limit integer default 10
)
returns table (
  franchise_id uuid,
  entry_id uuid,
  canonical_title text,
  entry_title text,
  release_year integer,
  entry_type public.anime_entry_type,
  record_status public.catalog_record_status,
  match_score numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with requested as (
    select public.normalize_catalog_title(p_title) as normalized_title
  )
  select
    franchise.id,
    entry.id,
    franchise.canonical_title,
    entry.title,
    extract(year from entry.aired_from)::integer,
    entry.entry_type,
    franchise.record_status,
    least(
      1::numeric,
      (
        greatest(
          extensions.similarity(franchise.normalized_title, requested.normalized_title),
          extensions.similarity(entry.normalized_title, requested.normalized_title)
        )
        + case
            when p_release_year is not null
             and extract(year from entry.aired_from)::integer = p_release_year
            then 0.15 else 0
          end
        + case
            when p_entry_type is not null
             and entry.entry_type::text = lower(p_entry_type)
            then 0.10 else 0
          end
      )::numeric
    ) as match_score
  from public.anime_franchises franchise
  join public.anime_entries entry on entry.franchise_id = franchise.id
  cross join requested
  where (p_exclude_franchise_id is null or franchise.id <> p_exclude_franchise_id)
    and greatest(
      extensions.similarity(franchise.normalized_title, requested.normalized_title),
      extensions.similarity(entry.normalized_title, requested.normalized_title)
    ) >= 0.35
  order by match_score desc, franchise.canonical_title, entry.sequence_number
  limit greatest(1, least(coalesce(p_limit, 10), 25));
$$;

revoke all on function public.submit_catalog_for_review(uuid, text)
from public, anon, authenticated, service_role;
revoke all on function public.withdraw_catalog_submission(uuid)
from public, anon, authenticated, service_role;
revoke all on function public.review_catalog_submission(uuid, text, text)
from public, anon, authenticated, service_role;
revoke all on function public.find_catalog_duplicates(text, integer, text, uuid, integer)
from public, anon, authenticated, service_role;

grant execute on function public.submit_catalog_for_review(uuid, text)
to authenticated;
grant execute on function public.withdraw_catalog_submission(uuid)
to authenticated;
grant execute on function public.review_catalog_submission(uuid, text, text)
to authenticated;
grant execute on function public.find_catalog_duplicates(text, integer, text, uuid, integer)
to authenticated;
