import { resolvePresentationDataMode, type PresentationDataMode } from "@/data/data-mode";
import { profileDemoData } from "@/data/mock/profile";
import { createEmptyProfileData } from "@/data/profile-empty";
import type { ProfileData } from "@/types/profile";

export function getProfilePresentationData(): { data: ProfileData; mode: PresentationDataMode } {
  const mode = resolvePresentationDataMode();
  return { data: mode === "demo" ? profileDemoData : createEmptyProfileData(), mode };
}
