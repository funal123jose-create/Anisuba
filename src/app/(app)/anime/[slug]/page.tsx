import { notFound } from "next/navigation";
import { AnimeDetailPage } from "@/components/anime/anime-detail-page";
import { AnimeDetailLivePage } from "@/components/anime/anime-detail-live-page";
import { resolvePresentationDataMode } from "@/data/data-mode";
import { getLiveAnimeDetailData } from "@/lib/anime/anime-detail";

export default async function AnimeDetailRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getLiveAnimeDetailData(slug);
  if (data) return <AnimeDetailLivePage data={data} />;
  if (resolvePresentationDataMode() === "demo") return <AnimeDetailPage isDemo />;
  if (!data) notFound();
}
