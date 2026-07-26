import { ExplorePage } from "@/components/explore/explore-page";
import { getExplorePresentationData } from "@/data/explore-source";

export default function ExploreRoute() {
  const { data, mode } = getExplorePresentationData();
  return <ExplorePage data={data} isDemo={mode === "demo"} />;
}
