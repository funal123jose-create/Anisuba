import type { HistoryData } from "@/types/history";

export function createEmptyHistoryData(): HistoryData {
  return { weekActivities: 0, weekChange: 0, monthActivities: 0, monthChange: 0, events: [], summary: [], hourlyActivity: [], streakDays: 0, streakWeek: [false, false, false, false, false, false, false], highlightDate: "Sin actividad", highlightCount: 0 };
}
