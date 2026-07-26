export type NotificationType = "episode" | "season" | "reminder" | "system" | "achievement";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  label: string;
  timeLabel: string;
  imageUrl: string;
  unread: boolean;
  action: "view" | "remind" | "none";
};

export type NotificationPreference = {
  id: string;
  label: string;
  enabled: boolean;
};

export type NotificationData = {
  totalCount: number;
  unreadCount: number;
  items: NotificationItem[];
  preferences: NotificationPreference[];
};
