import { createEmptyDashboardData } from "@/data/dashboard-empty";
import { dashboardData } from "@/data/mock/dashboard";
import type { PresentationDataMode } from "@/data/data-mode";
import type { AnimeStatus, DashboardData } from "@/types/dashboard";
import type { LibraryItem, PersonalAnimeStatus } from "@/types/library";

export function createDemoDashboardData(name: string): DashboardData {
  return {
    ...dashboardData,
    user: {
      ...dashboardData.user,
      name,
    },
  };
}

const statusLabel: Record<PersonalAnimeStatus, AnimeStatus> = {
  plan_to_watch: "Planeo ver",
  watching: "Viendo",
  caught_up: "Viendo",
  paused: "En pausa",
  completed: "Completado",
  waiting_next_season: "Esperando temporada",
  dropped: "Abandonado",
};
const distributionLabel: Record<PersonalAnimeStatus, string> = {
  ...statusLabel,
  completed: "Completados",
  dropped: "Abandonados",
};

function toAnimeCard(item: LibraryItem): DashboardData["watching"][number] {
  const episodes = item.episodeCount ?? 0;
  return {
    id: item.franchiseId,
    title: item.title,
    subtitle: item.genres.slice(0, 2).join(" · ") || (item.releaseYear ? String(item.releaseYear) : "Anime"),
    episode: item.episodesWatched,
    episodes,
    progress: episodes > 0 ? Math.min(100, Math.round(item.episodesWatched / episodes * 100)) : 0,
    status: statusLabel[item.status],
    accent: "#8b5cf6",
    coverUrl: item.coverUrl,
    sourceUrl: `/anime/${item.slug}`,
  };
}

async function createLiveDashboardData(name: string): Promise<DashboardData> {
  const { getLibraryPresentationData } = await import("@/data/library-source");
  const { data: library } = await getLibraryPresentationData();
  if (!library.items.length) return createEmptyDashboardData(name);
  const watchingItems = library.items.filter((item) => item.status === "watching" || item.status === "caught_up");
  const completed = library.items.filter((item) => item.status === "completed").length;
  const episodesWatched = library.items.reduce((sum, item) => sum + item.episodesWatched, 0);
  const estimatedHours = Math.round(episodesWatched * 24 / 60);
  const genreCounts = new Map<string, number>();
  for (const item of library.items) for (const genre of item.genres) genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
  const genreColors = ["#8b5cf6", "#22d3ee", "#ec4899", "#f59e0b", "#22c55e"];
  const genres = [...genreCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([genre, value], index) => ({ name: genre, value, color: genreColors[index] }));
  const distributionOrder: PersonalAnimeStatus[] = ["watching", "completed", "plan_to_watch", "paused", "dropped"];
  const colors = ["#635bff", "#22c5bd", "#6d4adf", "#f59e42", "#ff5c6c"];
  const watching = watchingItems.slice(0, 4).map(toAnimeCard);
  const featuredBase = watchingItems[0] ?? library.items[0];
  const featuredCard = toAnimeCard(featuredBase);
  return {
    user: { name, level: Math.max(1, Math.floor(completed / 10) + 1) },
    featured: { ...featuredCard, season: String(featuredBase.releaseYear ?? ""), nextEpisode: featuredBase.episodesWatched + 1, bannerUrl: featuredBase.coverUrl },
    metrics: [
      { label: "Total de animes", value: String(library.items.length), change: "Biblioteca real", tone: "violet" },
      { label: "Viendo actualmente", value: String(watchingItems.length), change: "Seguimiento activo", tone: "blue" },
      { label: "Completados", value: String(completed), change: "Finalizados", tone: "green" },
      { label: "Episodios vistos", value: episodesWatched.toLocaleString("es-CO"), change: "Progreso registrado", tone: "pink" },
      { label: "Horas invertidas", value: `${estimatedHours.toLocaleString("es-CO")} h`, change: "Estimación a 24 min/ep.", tone: "cyan" },
    ],
    watching,
    following: library.items.filter((item) => item.isFavorite).slice(0, 4).map(toAnimeCard),
    upcoming: [],
    recentActivity: library.recentlyUpdated.slice(0, 4).map((item, index) => ({
      id: item.franchiseId,
      action: item.status === "completed" ? "Completaste" : item.episodesWatched > 0 ? `Avanzaste al episodio ${item.episodesWatched}` : "Actualizaste tu lista",
      title: item.title,
      time: "Actividad reciente",
      tone: (["green", "violet", "blue", "amber"] as const)[index % 4],
    })),
    statusDistribution: distributionOrder.map((status, index) => ({
      name: distributionLabel[status],
      value: library.items.filter((item) => item.status === status || (status === "watching" && item.status === "caught_up")).length,
      color: colors[index],
    })),
    episodeTrend: [{ day: "Actual", episodes: episodesWatched }],
    genres,
  };
}

export async function getDashboardPresentationData(name: string): Promise<{
  data: DashboardData;
  mode: PresentationDataMode;
}> {
  const mode: PresentationDataMode = process.env.ANISUBA_DASHBOARD_DATA_MODE === "demo" ? "demo" : "live";

  return {
    data: mode === "demo" ? createDemoDashboardData(name) : await createLiveDashboardData(name),
    mode,
  };
}
