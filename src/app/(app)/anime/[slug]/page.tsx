import { AnimeDetailPage } from "@/components/anime/anime-detail-page";
import { resolvePresentationDataMode } from "@/data/data-mode";

export default async function AnimeDetailRoute({ params }: { params: Promise<{ slug: string }> }) {
  await params;
  return <AnimeDetailPage isDemo={resolvePresentationDataMode() === "demo"} />;
}
