import type { LibraryData, LibrarySummary } from "@/types/library";

const emptySummaries: LibrarySummary[] = [
  { status: "watching", label: "Viendo", count: 0, description: "En progreso", tone: "violet" },
  { status: "plan_to_watch", label: "Planeo ver", count: 0, description: "Pendientes", tone: "blue" },
  { status: "completed", label: "Completados", count: 0, description: "Finalizados", tone: "green" },
  { status: "paused", label: "En pausa", count: 0, description: "En pausa", tone: "amber" },
  { status: "dropped", label: "Abandonados", count: 0, description: "Dropeados", tone: "pink" },
  { status: "waiting_next_season", label: "Esperando temp.", count: 0, description: "En espera", tone: "violet" },
];

export function createEmptyLibraryData(): LibraryData {
  return {
    totalResults: 0,
    summaries: emptySummaries.map((summary) => ({ ...summary })),
    items: [],
    recentlyUpdated: [],
    continueWatching: [],
  };
}
