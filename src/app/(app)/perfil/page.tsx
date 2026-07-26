import { ProfilePage } from "@/components/profile/profile-page";
import { getProfilePresentationData } from "@/data/profile-source";
import { getCurrentUserProfile } from "@/lib/auth/current-user";

export default async function ProfileRoute() {
  const profile = await getCurrentUserProfile();
  const { data, mode } = getProfilePresentationData();
  const user = profile
    ? {
        ...data.user,
        displayName: profile.displayName,
        username: profile.username,
        avatarUrl: profile.avatarUrl ?? data.user.avatarUrl,
      }
    : data.user;

  return <ProfilePage data={{ ...data, user }} isDemo={mode === "demo"} />;
}
