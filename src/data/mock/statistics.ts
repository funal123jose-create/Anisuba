import type { StatisticsData } from "@/types/statistics";

export const statisticsDemoData: StatisticsData = {
  metrics: [
    { label: "Total de animes", value: "168", change: "+6 este mes", tone: "violet" },
    { label: "Episodios vistos", value: "347", change: "+82 este mes", tone: "blue" },
    { label: "Horas estimadas", value: "112 h", change: "+23 h este mes", tone: "cyan" },
    { label: "Puntuación promedio", value: "8.35", change: "+0.21 este mes", tone: "pink" },
    { label: "Porcentaje completado", value: "68%", change: "+7% este mes", tone: "green" },
  ],
  trend: [
    { label: "20 Abr", episodes: 8 }, { label: "22 Abr", episodes: 23 }, { label: "24 Abr", episodes: 34 },
    { label: "26 Abr", episodes: 29 }, { label: "28 Abr", episodes: 45 }, { label: "30 Abr", episodes: 51 },
    { label: "2 May", episodes: 68 }, { label: "4 May", episodes: 44 }, { label: "5 May", episodes: 62 },
    { label: "7 May", episodes: 39 }, { label: "9 May", episodes: 47 }, { label: "11 May", episodes: 54 },
    { label: "13 May", episodes: 59 }, { label: "15 May", episodes: 76 }, { label: "16 May", episodes: 68 },
    { label: "18 May", episodes: 96 },
  ],
  statusDistribution: [
    { name: "Completados", value: 57, color: "#8b5cf6" },
    { name: "En progreso", value: 63, color: "#3b82f6" },
    { name: "Planeo ver", value: 32, color: "#22d3ee" },
    { name: "En pausa", value: 9, color: "#ec4899" },
    { name: "Abandonado", value: 7, color: "#f59e0b" },
  ],
  genres: [
    { name: "Acción", episodes: 92, percentage: 26, color: "#8b5cf6" },
    { name: "Aventura", episodes: 76, percentage: 22, color: "#3b82f6" },
    { name: "Ciencia ficción", episodes: 58, percentage: 17, color: "#22d3ee" },
    { name: "Drama", episodes: 46, percentage: 13, color: "#ec4899" },
    { name: "Fantasía", episodes: 41, percentage: 12, color: "#f59e0b" },
    { name: "Romance", episodes: 34, percentage: 10, color: "#34d399" },
  ],
  studios: [
    { name: "Luminous Frame", episodes: 72, color: "#8b5cf6" },
    { name: "Blue Crescent Studio", episodes: 58, color: "#a855f7" },
    { name: "Daybreak Animation", episodes: 47, color: "#7c3aed" },
    { name: "NovaWorks", episodes: 39, color: "#6d28d9" },
    { name: "Silverline Pictures", episodes: 31, color: "#5b21b6" },
  ],
  heatmap: [
    [0,1,0,1,2,1,0,2,1,0,3,1,1,2,1,0,1,1],
    [1,2,1,0,1,2,3,1,2,1,3,2,2,1,1,1,0,2],
    [0,1,1,2,2,1,1,2,1,2,2,2,3,1,2,3,1,0],
    [1,0,2,1,3,2,1,1,2,1,1,3,1,2,1,1,2,1],
    [0,1,1,2,2,3,4,1,2,1,3,2,2,1,1,2,1,0],
    [2,1,0,1,2,1,1,3,1,2,1,1,2,2,1,3,0,1],
    [1,2,1,0,1,1,2,1,1,2,2,1,1,0,2,1,1,0],
  ],
  insight: {
    title: "¡Vas por un gran camino!",
    lines: [
      "Has visto 82 episodios más que el mes pasado.",
      "Tu género principal es Acción, representando el 26% de lo que has visto.",
      "Sueles ver más anime los fines de semana.",
    ],
    streakDays: 12,
  },
  lastUpdated: "hoy a las 08:45",
};
