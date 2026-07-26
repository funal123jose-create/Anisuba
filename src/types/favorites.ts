export type FavoriteAnime = {
  id: string;
  slug: string;
  title: string;
  year: number;
  episodeCount: number;
  score: number;
  coverUrl: string;
  genres: string[];
  description: string;
  addedDaysAgo: number;
};

export type FavoriteGenreMetric = {
  name: string;
  count: number;
  percentage: number;
  color: string;
};

export type FavoritesData = {
  totalFavorites: number;
  averageScore: number;
  animeDays: number;
  lastAdded: { label: string; title: string };
  items: FavoriteAnime[];
  genreMetrics: FavoriteGenreMetric[];
};
