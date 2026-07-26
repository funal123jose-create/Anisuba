import type { DashboardData } from "@/types/dashboard";

export function createEmptyDashboardData(name: string): DashboardData {
  return {
    user: { name, level: 1 },
    featured: null,
    metrics: [
      { label: "Total de animes", value: "0", change: "Agrega tu primer anime", tone: "violet" },
      { label: "Viendo actualmente", value: "0", change: "Sin actividad", tone: "blue" },
      { label: "Completados", value: "0", change: "Sin actividad", tone: "green" },
      { label: "Episodios vistos", value: "0", change: "Sin actividad", tone: "pink" },
      { label: "Horas invertidas", value: "0 h", change: "Sin actividad", tone: "cyan" },
    ],
    watching: [],
    following: [],
    upcoming: [],
    recentActivity: [],
    statusDistribution: [
      { name: "Viendo", value: 0, color: "#635bff" },
      { name: "Completados", value: 0, color: "#22c5bd" },
      { name: "Planeo ver", value: 0, color: "#6d4adf" },
      { name: "En pausa", value: 0, color: "#f59e42" },
      { name: "Abandonados", value: 0, color: "#ff5c6c" },
    ],
    episodeTrend: [{ day: "Hoy", episodes: 0 }],
    genres: [],
  };
}
