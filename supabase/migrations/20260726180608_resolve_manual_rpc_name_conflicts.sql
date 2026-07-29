-- Table-valued return names overlap with catalog column names. Compile the
-- function with explicit column precedence so SQL column references remain
-- deterministic while local PL/pgSQL variables retain their v_ prefix.

do $migration$
declare
  function_definition text;
begin
  select pg_get_functiondef(procedure.oid)
  into function_definition
  from pg_proc procedure
  join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.proname = 'submit_manual_anime';

  function_definition := replace(
    function_definition,
    E'AS $function$\ndeclare',
    E'AS $function$\n#variable_conflict use_column\ndeclare'
  );

  execute function_definition;
end;
$migration$;
