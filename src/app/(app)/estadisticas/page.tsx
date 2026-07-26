import { StatisticsPage } from "@/components/statistics/statistics-page";
import { getStatisticsPresentationData } from "@/data/statistics-source";

export default function StatisticsRoute() {
  const { data, mode } = getStatisticsPresentationData();
  return <StatisticsPage data={data} isDemo={mode === "demo"} />;
}
