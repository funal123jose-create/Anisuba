import { resolvePresentationDataMode, type PresentationDataMode } from "@/data/data-mode";
import { notificationsDemoData } from "@/data/mock/notifications";
import { createEmptyNotificationData } from "@/data/notifications-empty";
import type { NotificationData } from "@/types/notifications";

export function getNotificationsPresentationData(): { data: NotificationData; mode: PresentationDataMode } {
  const mode = resolvePresentationDataMode();
  return { data: mode === "demo" ? notificationsDemoData : createEmptyNotificationData(), mode };
}
