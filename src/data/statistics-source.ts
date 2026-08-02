import { resolvePresentationDataMode, type PresentationDataMode } from "@/data/data-mode";
import { statisticsDemoData } from "@/data/mock/statistics";
import { createEmptyStatisticsData } from "@/data/statistics-empty";
import type { StatisticsData } from "@/types/statistics";

export function getStatisticsPresentationData(): { data: StatisticsData; mode: PresentationDataMode } {
  const mode = resolvePresentationDataMode(process.env.ANISUBA_STATISTICS_DATA_MODE ?? "demo");
  return { data: mode === "demo" ? statisticsDemoData : createEmptyStatisticsData(), mode };
}
