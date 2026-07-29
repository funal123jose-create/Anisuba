import { ExplorePage } from "@/components/explore/explore-page";
import { getExplorePresentationData } from "@/data/explore-source";

export const dynamic = "force-dynamic";

export default async function ExploreRoute() {
  const { data, mode } = await getExplorePresentationData();
  return <ExplorePage data={data} isDemo={mode === "demo"} />;
}
