import { resolvePresentationDataMode, type PresentationDataMode } from "@/data/data-mode";
import { createEmptyHistoryData } from "@/data/history-empty";
import { historyDemoData } from "@/data/mock/history";
import type { HistoryData } from "@/types/history";

export function getHistoryPresentationData(): { data: HistoryData; mode: PresentationDataMode } {
  const mode = resolvePresentationDataMode();
  return { data: mode === "demo" ? historyDemoData : createEmptyHistoryData(), mode };
}
