import { HistoryPage } from "@/components/history/history-page";
import { getHistoryPresentationData } from "@/data/history-source";

export default function HistoryRoute() {
  const { data, mode } = getHistoryPresentationData();
  return <HistoryPage data={data} isDemo={mode === "demo"} />;
}
