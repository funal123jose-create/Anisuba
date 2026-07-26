import { resolvePresentationDataMode, type PresentationDataMode } from "@/data/data-mode";
import { createEmptyFavoritesData } from "@/data/favorites-empty";
import { favoritesDemoData } from "@/data/mock/favorites";
import type { FavoritesData } from "@/types/favorites";

export function getFavoritesPresentationData(): { data: FavoritesData; mode: PresentationDataMode } {
  const mode = resolvePresentationDataMode();
  return { data: mode === "demo" ? favoritesDemoData : createEmptyFavoritesData(), mode };
}
