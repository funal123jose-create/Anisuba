import { describe, expect, it } from "vitest";
import { notificationsDemoData } from "@/data/mock/notifications";
import { createEmptyNotificationData } from "@/data/notifications-empty";

describe("notifications presentation data", () => {
  it("mantiene coherente el contador inicial de no leídas", () => {
    expect(notificationsDemoData.items.filter((item) => item.unread).length).toBe(notificationsDemoData.unreadCount);
  });

  it("no mezcla alertas demo con el estado live", () => {
    expect(createEmptyNotificationData().items).toEqual([]);
  });
});
