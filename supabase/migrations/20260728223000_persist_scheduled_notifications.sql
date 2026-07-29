create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_key text not null,
  notification_type text not null check (notification_type in ('episode','season','reminder','system','achievement')),
  franchise_id uuid references public.anime_franchises(id) on delete cascade,
  entry_id uuid references public.anime_entries(id) on delete cascade,
  title text not null,
  description text not null,
  label text not null,
  href text,
  image_url text,
  scheduled_for timestamptz,
  source text not null default 'scheduler',
  email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, notification_key)
);

create index if not exists user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);
create index if not exists user_notifications_scheduled_idx
  on public.user_notifications (scheduled_for)
  where scheduled_for is not null;
create index if not exists user_notifications_franchise_idx
  on public.user_notifications (franchise_id);
create index if not exists user_notifications_entry_idx
  on public.user_notifications (entry_id);

alter table public.user_notifications enable row level security;
drop policy if exists "Users read own notifications" on public.user_notifications;
create policy "Users read own notifications" on public.user_notifications
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users delete own notifications" on public.user_notifications;
create policy "Users delete own notifications" on public.user_notifications
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on table public.user_notifications from anon, authenticated;
grant select, delete on table public.user_notifications to authenticated;

alter table public.user_notification_preferences
  add column if not exists email_enabled boolean not null default false;
