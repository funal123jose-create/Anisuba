import { resolvePresentationDataMode, type PresentationDataMode } from "@/data/data-mode";
import { createEmptyHistoryData } from "@/data/history-empty";
import { historyDemoData } from "@/data/mock/history";
import type { HistoryData } from "@/types/history";

export function getHistoryPresentationData(): { data: HistoryData; mode: PresentationDataMode } {
  const mode = resolvePresentationDataMode(process.env.ANISUBA_HISTORY_DATA_MODE ?? "demo");
  return { data: mode === "demo" ? historyDemoData : createEmptyHistoryData(), mode };
}
