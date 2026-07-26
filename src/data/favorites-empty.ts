import type { FavoritesData } from "@/types/favorites";

export function createEmptyFavoritesData(): FavoritesData {
  return {
    totalFavorites: 0,
    averageScore: 0,
    animeDays: 0,
    lastAdded: { label: "Sin actividad", title: "Aún no agregaste favoritos" },
    items: [],
    genreMetrics: [],
  };
}
