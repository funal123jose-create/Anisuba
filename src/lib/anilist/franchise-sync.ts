import "server-only";

import {
  getAniListFranchiseById,
  type AniListFranchiseEntry,
} from "@/lib/anilist/client";
import type { createClient } from "@/lib/supabase/server";

const entryTypeMap: Record<string, "season" | "movie" | "ova" | "special"> = {
  MOVIE: "movie",
  OVA: "ova",
  SPECIAL: "special",
};

const statusMap: Record<string, string> = {
  FINISHED: "Finalizado",
  RELEASING: "En emisión",
  NOT_YET_RELEASED: "Próximamente",
  CANCELLED: "Cancelado",
  HIATUS: "Pausado",
};

function trackingEntry(entry: AniListFranchiseEntry) {
  return {
    anilistId: entry.id,
    malId: entry.idMal,
    title: entry.title,
    entryType: entryTypeMap[entry.format ?? ""] ?? "season",
    episodeCount: entry.episodes ?? 0,
    duration: entry.duration,
    startDate: entry.startDate,
    officialStatus: statusMap[entry.status ?? ""] ?? "Sin definir",
    coverUrl: entry.coverUrl,
    bannerUrl: entry.bannerUrl,
    season: entry.season,
    studio: entry.studios[0] ?? null,
    sourceUrl: entry.sourceUrl,
    relationType: entry.relationType,
  };
}

export async function syncAniListFranchise({
  anilistId,
  franchiseId,
  supabase,
}: {
  anilistId: number;
  franchiseId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const entries = await getAniListFranchiseById(anilistId);
  const { data, error } = await supabase.rpc("sync_anilist_franchise_tracking_v2", {
    p_franchise_id: franchiseId,
    p_primary_anilist_id: anilistId,
    p_entries: entries.map(trackingEntry),
  });
  if (error) throw new Error("FRANCHISE_SYNC_FAILED");
  const result = Array.isArray(data) ? data[0] : data;
  return {
    syncedCount: Number(result?.synced_count ?? 0),
    skippedCount: Number(result?.skipped_count ?? 0),
    totalCount: Number(result?.total_count ?? entries.length),
  };
}
