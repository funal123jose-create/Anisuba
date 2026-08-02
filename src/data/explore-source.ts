import type { PresentationDataMode } from "@/data/data-mode";
import { exploreDemoData } from "@/data/mock/explore";
import { getAniListDiscoverCatalog, type AniListAnime } from "@/lib/anilist/client";
import type { ExploreData } from "@/types/explore";

const metricColors = ["#a855f7", "#3b82f6", "#22d3ee", "#f59e0b", "#ec4899"];

export function resolveExploreDataMode(
  configuredMode = process.env.ANISUBA_EXPLORE_DATA_MODE,
): PresentationDataMode {
  return configuredMode === "demo" ? "demo" : "live";
}

function formatLabel(format: string | null): "TV" | "Película" | "OVA" {
  if (format === "MOVIE") return "Película";
  if (format === "OVA" || format === "ONA" || format === "SPECIAL") return "OVA";
  return "TV";
}

function seasonLabel(season: string | null): "Invierno" | "Primavera" | "Verano" | "Otoño" {
  if (season === "SPRING") return "Primavera";
  if (season === "SUMMER") return "Verano";
  if (season === "FALL") return "Otoño";
  return "Invierno";
}

function mapAnime(anime: AniListAnime) {
  return {
    id: String(anime.id),
    anilistId: anime.id,
    slug: `anilist-${anime.id}`,
    title: anime.title,
    year: anime.seasonYear ?? new Date().getFullYear(),
    episodeCount: anime.episodes ?? 0,
    score: (anime.averageScore ?? 0) / 10,
    coverUrl: anime.coverUrl,
    bannerUrl: anime.bannerUrl || anime.coverUrl,
    genres: anime.genres,
    studio: anime.studios[0] ?? "Estudio por confirmar",
    format: formatLabel(anime.format),
    season: seasonLabel(anime.season),
    synopsis: anime.description || "Sinopsis no disponible.",
    popularity: anime.popularity,
  };
}

function buildMetrics(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  const maximum = Math.max(1, ...counts.values());
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([name, count], index) => ({
      name,
      value: Math.round((count / maximum) * 100),
      color: metricColors[index],
      detail: `${count} títulos`,
    }));
}

export function buildRatingDistribution(scores: number[]) {
  const buckets = [0, 0, 0, 0, 0];
  scores.forEach((score) => {
    const index = Math.min(4, Math.max(0, Math.floor(score / 2)));
    buckets[index] += 1;
  });
  const maximum = Math.max(1, ...buckets);
  return buckets.map((count) => Math.round((count / maximum) * 100));
}

async function getLiveExploreData(): Promise<ExploreData | null> {
  try {
    const catalog = await getAniListDiscoverCatalog();
    const trending = catalog.trending.map(mapAnime);
    const popular = catalog.popular.map(mapAnime);
    const combined = [...new Map([...trending, ...popular].map((item) => [item.id, item])).values()];
    const scores = combined.map((item) => item.score).filter((score) => score > 0);
    return {
      featured: trending.filter((item) => item.bannerUrl).slice(0, 4),
      trending,
      popular,
      genreMetrics: buildMetrics(combined.flatMap((item) => item.genres)),
      studioMetrics: buildMetrics(combined.map((item) => item.studio)),
      averageRating: scores.length
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0,
      ratingDelta: 0,
      ratingDistribution: buildRatingDistribution(scores),
      fetchedAt: new Date().toISOString(),
      sourceLabel: "AniList en vivo",
      sourceDetail: "Actualizado al abrir",
      sourceStatus: "live",
    };
  } catch (error) {
    console.error(
      "Could not load AniList discovery catalog",
      error instanceof Error ? error.message : "UNKNOWN",
    );
    return null;
  }
}

export async function getExplorePresentationData(): Promise<{ data: ExploreData; mode: PresentationDataMode }> {
  const mode = resolveExploreDataMode();
  if (mode === "demo") {
    return {
      data: { ...exploreDemoData, sourceStatus: "demo" },
      mode,
    };
  }

  const liveData = await getLiveExploreData();
  if (liveData) return { data: liveData, mode };

  return {
    data: {
      ...exploreDemoData,
      fetchedAt: new Date().toISOString(),
      sourceLabel: "Respaldo temporal",
      sourceDetail: "AniList no disponible",
      sourceStatus: "fallback",
    },
    mode: "demo",
  };
}
