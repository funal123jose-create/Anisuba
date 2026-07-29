import { AppShell } from "@/components/layout/app-shell";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth/current-user";
import { canAccessAdminArea } from "@/lib/auth/access";
import { resolvePresentationDataMode } from "@/data/data-mode";
import { getNotificationsPresentationData } from "@/data/notifications-source";

export default async function ProductLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");
  const isDemo = resolvePresentationDataMode() === "demo";
  const { data: notifications } = await getNotificationsPresentationData();
  return (
    <AppShell
      profile={profile}
      canAccessAdmin={canAccessAdminArea({ isAdmin: profile.isAdmin, isDemo })}
      notificationCount={notifications.unreadCount}
    >
      {children}
    </AppShell>
  );
}
