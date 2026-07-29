import { NotificationsPage } from "@/components/notifications/notifications-page";
import { getNotificationsPresentationData } from "@/data/notifications-source";
import {
  markNotificationReadAction,
  markNotificationsReadAction,
  saveNotificationReminderAction,
  updateNotificationPreferenceAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function NotificationsRoute() {
  const { data, mode } = await getNotificationsPresentationData();
  return (
    <NotificationsPage
      data={data}
      isDemo={mode === "demo"}
      onMarkAllRead={markNotificationsReadAction}
      onMarkRead={markNotificationReadAction}
      onSaveReminder={saveNotificationReminderAction}
      onUpdatePreference={updateNotificationPreferenceAction}
    />
  );
}
