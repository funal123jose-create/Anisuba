export type StatisticsMetricTone = "violet" | "blue" | "cyan" | "pink" | "green";

export type StatisticsMetric = {
  label: string;
  value: string;
  change: string;
  tone: StatisticsMetricTone;
};

export type StatisticsTrendPoint = {
  label: string;
  episodes: number;
};

export type StatisticsDistributionItem = {
  name: string;
  value: number;
  color: string;
};

export type StatisticsGenre = {
  name: string;
  episodes: number;
  percentage: number;
  color: string;
};

export type StatisticsStudio = {
  name: string;
  episodes: number;
  color: string;
};

export type StatisticsData = {
  metrics: StatisticsMetric[];
  trend: StatisticsTrendPoint[];
  statusDistribution: StatisticsDistributionItem[];
  genres: StatisticsGenre[];
  studios: StatisticsStudio[];
  heatmap: number[][];
  insight: {
    title: string;
    lines: string[];
    streakDays: number;
  };
  lastUpdated: string;
};
