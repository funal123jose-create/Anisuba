export type ExploreAnime = {
  id: string;
  anilistId?: number;
  slug: string;
  title: string;
  year: number;
  episodeCount: number;
  score: number;
  coverUrl: string;
  bannerUrl: string;
  genres: string[];
  studio: string;
  format: "TV" | "Película" | "OVA";
  season: "Invierno" | "Primavera" | "Verano" | "Otoño";
  synopsis: string;
  popularity?: number;
};

export type ExploreMetric = {
  name: string;
  value: number;
  color: string;
  detail?: string;
};

export type ExploreData = {
  featured: ExploreAnime[];
  trending: ExploreAnime[];
  popular: ExploreAnime[];
  genreMetrics: ExploreMetric[];
  studioMetrics: ExploreMetric[];
  averageRating: number;
  ratingDelta: number;
  ratingDistribution: number[];
  fetchedAt?: string | null;
  sourceLabel?: string;
};
