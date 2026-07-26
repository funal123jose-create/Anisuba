export type PersonalAnimeStatus =
  | "plan_to_watch"
  | "watching"
  | "caught_up"
  | "paused"
  | "completed"
  | "waiting_next_season"
  | "dropped";

export type LibrarySummary = {
  status: PersonalAnimeStatus;
  label: string;
  count: number;
  description: string;
  tone: "violet" | "blue" | "green" | "amber" | "pink";
};

export type LibraryItem = {
  franchiseId: string;
  slug: string;
  title: string;
  genres: string[];
  coverUrl: string;
  score: number | null;
  releaseYear: number | null;
  status: PersonalAnimeStatus;
  episodesWatched: number;
  episodeCount: number | null;
  isFavorite: boolean;
  updatedAt: string;
};

export type LibraryData = {
  totalResults: number;
  summaries: LibrarySummary[];
  items: LibraryItem[];
  recentlyUpdated: LibraryItem[];
  continueWatching: LibraryItem[];
};
