import type { ExploreData } from "@/types/explore";

export function createEmptyExploreData(): ExploreData {
  return {
    featured: [],
    trending: [],
    popular: [],
    genreMetrics: [],
    studioMetrics: [],
    averageRating: 0,
    ratingDelta: 0,
    ratingDistribution: [],
  };
}
