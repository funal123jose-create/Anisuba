import { NotificationsPage } from "@/components/notifications/notifications-page";
import { getNotificationsPresentationData } from "@/data/notifications-source";

export default function NotificationsRoute() {
  const { data, mode } = getNotificationsPresentationData();
  return <NotificationsPage data={data} isDemo={mode === "demo"} />;
}
