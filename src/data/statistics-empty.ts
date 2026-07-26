import type { StatisticsData } from "@/types/statistics";

export function createEmptyStatisticsData(): StatisticsData {
  return {
    metrics: [
      { label: "Total de animes", value: "0", change: "Sin actividad", tone: "violet" },
      { label: "Episodios vistos", value: "0", change: "Sin actividad", tone: "blue" },
      { label: "Horas estimadas", value: "0 h", change: "Sin actividad", tone: "cyan" },
      { label: "Puntuación promedio", value: "0", change: "Sin actividad", tone: "pink" },
      { label: "Porcentaje completado", value: "0%", change: "Sin actividad", tone: "green" },
    ],
    trend: [],
    statusDistribution: [],
    genres: [],
    studios: [],
    heatmap: Array.from({ length: 7 }, () => Array.from({ length: 18 }, () => 0)),
    insight: { title: "Tu historia empieza aquí", lines: ["Registra actividad para descubrir patrones y recomendaciones personales."], streakDays: 0 },
    lastUpdated: "sin actividad",
  };
}
