import type { NotificationData } from "@/types/notifications";

export function createEmptyNotificationData(): NotificationData {
  return {
    totalCount: 0,
    unreadCount: 0,
    items: [],
    preferences: [
      { id: "episodes", label: "Nuevos episodios", enabled: true },
      { id: "seasons", label: "Nuevas temporadas", enabled: true },
      { id: "reminders", label: "Recordatorios", enabled: true },
      { id: "recommendations", label: "Recomendaciones", enabled: false },
      { id: "system", label: "Noticias del sistema", enabled: true },
    ],
  };
}
