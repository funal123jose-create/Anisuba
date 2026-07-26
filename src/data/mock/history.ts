import type { HistoryActivityType, HistoryData, HistoryEvent } from "@/types/history";

const covers = [
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-hSNRJM03pvv1.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx146065-IjirxRK26O03.png",
];

function event(id: string, date: string, dateLabel: string, time: string, type: HistoryActivityType, title: string, description: string, index: number, detail: Partial<HistoryEvent> = {}): HistoryEvent {
  return { id, date, dateLabel, time, type, title, description, coverUrl: covers[index % covers.length], ...detail };
}

export const historyDemoData: HistoryData = {
  weekActivities: 48,
  weekChange: 18,
  monthActivities: 176,
  monthChange: 24,
  events: [
    event("h1", "2024-05-18", "18 de mayo de 2024", "21:47", "added", "Eclipse of the Celestials", "Agregaste a tu biblioteca", 0),
    event("h2", "2024-05-18", "18 de mayo de 2024", "20:15", "progress", "Eclipse of the Celestials", "Avanzaste al episodio 6", 1, { progress: 24 }),
    event("h3", "2024-05-18", "18 de mayo de 2024", "18:33", "rating", "Eclipse of the Celestials", "Calificaste con 8/10", 2, { rating: 8 }),
    event("h4", "2024-05-18", "18 de mayo de 2024", "15:22", "favorite", "Nocturna", "Marcaste como favorito", 3),
    event("h5", "2024-05-18", "18 de mayo de 2024", "13:08", "comment", "Nocturna", "Comentaste en el episodio 3", 3),
    event("h6", "2024-05-18", "18 de mayo de 2024", "09:41", "status", "Chronicles of the Abyss", "Cambiaste estado a En pausa", 2, { status: "En pausa" }),
    event("h7", "2024-05-17", "17 de mayo de 2024", "23:56", "added", "Chronicles of the Abyss", "Agregaste a tu biblioteca", 2),
    event("h8", "2024-05-17", "17 de mayo de 2024", "19:34", "progress", "Dawn of the Vanguard", "Avanzaste al episodio 9", 1, { progress: 60 }),
  ],
  summary: [
    { type: "added", label: "Agregados", value: 45, percentage: 25.6, color: "#34d399" },
    { type: "progress", label: "Progreso", value: 61, percentage: 34.7, color: "#3b82f6" },
    { type: "rating", label: "Puntuaciones", value: 24, percentage: 13.6, color: "#fbbf24" },
    { type: "favorite", label: "Favoritos", value: 18, percentage: 10.2, color: "#ec4899" },
    { type: "comment", label: "Comentarios", value: 14, percentage: 8, color: "#22d3ee" },
    { type: "status", label: "Estados", value: 14, percentage: 8, color: "#f59e0b" },
  ],
  hourlyActivity: [0, 3, 2, 1, 1, 0, 2, 3, 1, 0, 2, 3, 4, 1, 0, 0, 3, 5, 1, 0, 0, 3, 0, 0],
  streakDays: 37,
  streakWeek: [true, true, true, true, true, true, false],
  highlightDate: "15 de mayo de 2024",
  highlightCount: 22,
};
