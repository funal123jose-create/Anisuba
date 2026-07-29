create or replace function private.enforce_catalog_workflow_lock()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null or private.is_catalog_admin() then
    return new;
  end if;

  if old.record_status in (
    'draft'::public.catalog_record_status,
    'rejected'::public.catalog_record_status
  ) then
    return new;
  end if;

  if old.record_status = 'in_review'::public.catalog_record_status
     and new.record_status = 'draft'::public.catalog_record_status
     and (to_jsonb(new) - 'record_status' - 'updated_at')
       = (to_jsonb(old) - 'record_status' - 'updated_at') then
    return new;
  end if;

  raise exception 'CATALOG_RECORD_LOCKED' using errcode = '42501';
end;
$$;
