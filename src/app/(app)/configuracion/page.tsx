import { SettingsPage } from "@/components/settings/settings-page";
import { resolvePresentationDataMode } from "@/data/data-mode";
import { getCurrentUserProfile } from "@/lib/auth/current-user";

export default async function SettingsRoute() {
  const profile = await getCurrentUserProfile();
  return (
    <SettingsPage
      avatarUrl={profile?.avatarUrl ?? "/images/profile-avatar-v1.png"}
      displayName={profile?.displayName ?? "José Luis"}
      email={profile?.email ?? "joseluis12@email.com"}
      isDemo={resolvePresentationDataMode() === "demo"}
      username={profile?.username ?? "joseluis12"}
    />
  );
}
