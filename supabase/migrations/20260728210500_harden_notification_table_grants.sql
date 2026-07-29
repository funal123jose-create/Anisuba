revoke truncate, references, trigger
on table public.user_notification_states
from authenticated;

revoke truncate, references, trigger
on table public.user_notification_preferences
from authenticated;

grant select, insert, update, delete
on table public.user_notification_states
to authenticated;

grant select, insert, update, delete
on table public.user_notification_preferences
to authenticated;
