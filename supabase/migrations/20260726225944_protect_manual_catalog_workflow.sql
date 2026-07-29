-- Prevent regular submitters from changing catalog content while a record is
-- under review or already published. This is database-level defense in depth
-- for SECURITY DEFINER catalog RPCs.

create or replace function private.enforce_catalog_workflow_lock()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  -- Trusted backend jobs do not carry an end-user JWT. Administrators retain
  -- the moderation and correction capabilities granted by the workflow.
  if v_user_id is null or private.is_catalog_admin(v_user_id) then
    return new;
  end if;

  if old.record_status in (
    'draft'::public.catalog_record_status,
    'rejected'::public.catalog_record_status
  ) then
    return new;
  end if;

  -- The owner may withdraw a pending submission. That operation changes only
  -- the workflow status (plus the normal updated_at timestamp).
  if old.record_status = 'in_review'::public.catalog_record_status
     and new.record_status = 'draft'::public.catalog_record_status
     and (
       to_jsonb(new) - 'record_status' - 'updated_at'
     ) = (
       to_jsonb(old) - 'record_status' - 'updated_at'
     ) then
    return new;
  end if;

  raise exception 'CATALOG_RECORD_LOCKED' using errcode = '42501';
end;
$$;

drop trigger if exists anime_franchises_enforce_workflow_lock
on public.anime_franchises;

create trigger anime_franchises_enforce_workflow_lock
before update on public.anime_franchises
for each row
execute function private.enforce_catalog_workflow_lock();

comment on function private.enforce_catalog_workflow_lock() is
  'Blocks end-user catalog edits while a record is in review, published, or archived.';
