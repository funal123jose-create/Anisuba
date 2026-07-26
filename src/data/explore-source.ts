import { resolvePresentationDataMode, type PresentationDataMode } from "@/data/data-mode";
import { createEmptyExploreData } from "@/data/explore-empty";
import { exploreDemoData } from "@/data/mock/explore";
import type { ExploreData } from "@/types/explore";

export function getExplorePresentationData(): { data: ExploreData; mode: PresentationDataMode } {
  const mode = resolvePresentationDataMode();
  return { data: mode === "demo" ? exploreDemoData : createEmptyExploreData(), mode };
}
