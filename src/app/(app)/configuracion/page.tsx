import { SettingsPage } from "@/components/settings/settings-page";
import { resolvePresentationDataMode } from "@/data/data-mode";
import { getCurrentUserProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsRoute() {
  const profile = await getCurrentUserProfile();
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const { data: emailPreference } = authData.user
    ? await supabase.from("user_notification_preferences")
        .select("email_enabled").eq("user_id", authData.user.id)
        .eq("notification_type", "system").maybeSingle()
    : { data: null };
  return (
    <SettingsPage
      avatarUrl={profile?.avatarUrl
        ?? (profile?.username.toLocaleLowerCase() === "atreus"
          ? "/images/avatar-subaru-v1.png"
          : "/images/profile-avatar-v1.png")}
      displayName={profile?.displayName ?? "José Luis"}
      email={profile?.email ?? "joseluis12@email.com"}
      isDemo={resolvePresentationDataMode() === "demo"}
      emailNotificationsEnabled={emailPreference?.email_enabled ?? false}
      username={profile?.username ?? "joseluis12"}
    />
  );
}
