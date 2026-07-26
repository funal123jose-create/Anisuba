export type AnimeStatus =
  | "Viendo"
  | "Planeo ver"
  | "Completado"
  | "En pausa"
  | "Abandonado"
  | "Esperando temporada";

export type AnimeCard = {
  id: string;
  title: string;
  subtitle: string;
  episode: number;
  episodes: number;
  progress: number;
  status: AnimeStatus;
  accent: string;
  coverUrl: string;
  sourceUrl: string;
};

export type UpcomingEpisode = {
  id: string;
  anime: AnimeCard;
  episodeLabel: string;
  releaseLabel: string;
  releaseDate: string;
  indicatorColor: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  change: string;
  tone: "violet" | "blue" | "green" | "pink" | "cyan";
};

export type DashboardData = {
  user: {
    name: string;
    level: number;
  };
  featured: (AnimeCard & {
    season: string;
    nextEpisode: number;
    bannerUrl: string;
  }) | null;
  metrics: DashboardMetric[];
  watching: AnimeCard[];
  following: AnimeCard[];
  upcoming: UpcomingEpisode[];
  recentActivity: Array<{
    id: string;
    action: string;
    title: string;
    time: string;
    tone: "violet" | "blue" | "green" | "amber";
  }>;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  episodeTrend: Array<{ day: string; episodes: number }>;
  genres: Array<{ name: string; value: number; color: string }>;
};
