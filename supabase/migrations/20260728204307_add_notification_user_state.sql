create table public.user_notification_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_key text not null,
  read_at timestamptz,
  remind_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, notification_key),
  constraint user_notification_states_key_check
    check (char_length(btrim(notification_key)) between 3 and 180)
);

create index user_notification_states_remind_at_idx
  on public.user_notification_states (user_id, remind_at)
  where remind_at is not null;

alter table public.user_notification_states enable row level security;

create policy "notification states are readable by owner"
on public.user_notification_states
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "notification states are insertable by owner"
on public.user_notification_states
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "notification states are updatable by owner"
on public.user_notification_states
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "notification states are deletable by owner"
on public.user_notification_states
for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.user_notification_states from anon;
grant select, insert, update, delete on table public.user_notification_states to authenticated;

create table public.user_notification_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, notification_type),
  constraint user_notification_preferences_type_check
    check (notification_type in ('episode', 'season', 'reminder', 'system'))
);

alter table public.user_notification_preferences enable row level security;

create policy "notification preferences are readable by owner"
on public.user_notification_preferences
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "notification preferences are insertable by owner"
on public.user_notification_preferences
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "notification preferences are updatable by owner"
on public.user_notification_preferences
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "notification preferences are deletable by owner"
on public.user_notification_preferences
for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.user_notification_preferences from anon;
grant select, insert, update, delete on table public.user_notification_preferences to authenticated;

comment on table public.user_notification_states is
  'Owner-scoped read and reminder state for notifications derived from current catalog and airing signals.';

comment on table public.user_notification_preferences is
  'Owner-scoped notification category preferences.';
