export type HistoryActivityType = "added" | "progress" | "rating" | "favorite" | "comment" | "status";

export type HistoryEvent = {
  id: string;
  date: string;
  dateLabel: string;
  time: string;
  type: HistoryActivityType;
  title: string;
  description: string;
  coverUrl: string;
  progress?: number;
  rating?: number;
  status?: string;
};

export type HistorySummary = {
  type: HistoryActivityType;
  label: string;
  value: number;
  percentage: number;
  color: string;
};

export type HistoryData = {
  weekActivities: number;
  weekChange: number;
  monthActivities: number;
  monthChange: number;
  events: HistoryEvent[];
  summary: HistorySummary[];
  hourlyActivity: number[];
  streakDays: number;
  streakWeek: boolean[];
  highlightDate: string;
  highlightCount: number;
};
