import { resolvePresentationDataMode, type PresentationDataMode } from "@/data/data-mode";
import { profileDemoData } from "@/data/mock/profile";
import { createEmptyProfileData } from "@/data/profile-empty";
import type { ProfileData } from "@/types/profile";

export function getProfilePresentationData(): { data: ProfileData; mode: PresentationDataMode } {
  const mode = resolvePresentationDataMode(process.env.ANISUBA_PROFILE_DATA_MODE ?? "demo");
  return { data: mode === "demo" ? profileDemoData : createEmptyProfileData(), mode };
}
