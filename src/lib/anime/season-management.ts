import "server-only";

import {
  getAniListAnimeById,
  getAniListLibrarySignals,
  type AniListAnime,
  type AniListWatchLink,
} from "@/lib/anilist/client";
import { createClient } from "@/lib/supabase/server";

export type ManagedAnimeEntry = {
  id: string;
  title: string;
  entryType: "season" | "movie" | "ova" | "special";
  sequenceNumber: number;
  episodeCount: number;
  episodeDurationMinutes: number;
  releaseYear: number | null;
  officialStatus: string;
  coverUrl: string;
  episodesWatched: number;
  personalStatus: "not_started" | "watching" | "completed";
  watchLinks: AniListWatchLink[];
};

export type SeasonManagementData = {
  franchiseId: string;
  slug: string;
  title: string;
  alternativeTitle: string;
  synopsis: string;
  coverUrl: string;
  bannerUrl: string;
  recordStatus: string;
  sourceName: string | null;
  sourceExternalId: string | null;
  canEdit: boolean;
  genres: string[];
  entries: ManagedAnimeEntry[];
};

export async function getSeasonManagementData(
  slug: string,
): Promise<SeasonManagementData | null> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data: franchise, error: franchiseError } = await supabase
    .from("anime_franchises")
    .select(
      "id,slug,canonical_title,alternative_title,synopsis,cover_url,banner_url,record_status,source_name,source_external_id,submitted_by",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (franchiseError || !franchise) return null;

  const [entryResult, genreResult] = await Promise.all([
    supabase
      .from("anime_entries")
      .select(
        "id,title,entry_type,sequence_number,episode_count,episode_duration_minutes,aired_from,official_status,cover_url",
      )
      .eq("franchise_id", franchise.id)
      .order("sequence_number", { ascending: true }),
    supabase
      .from("anime_genres")
      .select("genres(name)")
      .eq("franchise_id", franchise.id),
  ]);
  const { data: entries, error: entriesError } = entryResult;
  if (entriesError) return null;

  const localEntries = entries ?? [];
  const localEntryIds = localEntries.map((entry) => entry.id);
  const { data: primaryExternalId } = localEntryIds.length
    ? await supabase
        .from("anime_external_ids")
        .select("entry_id,external_id")
        .eq("provider", "anilist")
        .eq("is_primary", true)
        .in("entry_id", localEntryIds)
        .maybeSingle()
    : { data: null };
  const { data: relatedRows } = primaryExternalId
    ? await supabase
        .from("anime_relations")
        .select("target_entry_id,sort_order")
        .eq("source_entry_id", primaryExternalId.entry_id)
        .order("sort_order", { ascending: true })
    : { data: [] };
  const relatedOrder = new Map(
    (relatedRows ?? []).map((row) => [row.target_entry_id, Number(row.sort_order)]),
  );
  const relatedIds = (relatedRows ?? [])
    .map((row) => row.target_entry_id)
    .filter((id) => !localEntryIds.includes(id));
  const { data: relatedEntries } = relatedIds.length
    ? await supabase
        .from("anime_entries")
        .select(
          "id,title,entry_type,sequence_number,episode_count,episode_duration_minutes,aired_from,official_status,cover_url",
        )
        .in("id", relatedIds)
    : { data: [] };
  const allEntries = [...localEntries, ...(relatedEntries ?? [])]
    .sort((left, right) => {
      const leftOrder = relatedOrder.get(left.id) ?? Number(left.sequence_number);
      const rightOrder = relatedOrder.get(right.id) ?? Number(right.sequence_number);
      return leftOrder - rightOrder;
    });
  const entryIds = allEntries.map((entry) => entry.id);
  const [progressResult, externalIdResult] = entryIds.length
    ? await Promise.all([
      supabase
        .from("user_entry_progress")
        .select("entry_id,episodes_watched")
        .eq("user_id", authData.user.id)
        .in("entry_id", entryIds),
      supabase
        .from("anime_external_ids")
        .select("entry_id,external_id")
        .eq("provider", "anilist")
        .in("entry_id", entryIds),
    ])
    : [{ data: [] }, { data: [] }];
  const progressRows = progressResult.data ?? [];
  const anilistIdByEntry = new Map(
    (externalIdResult.data ?? []).map((row) => [row.entry_id, Number(row.external_id)]),
  );
  let primaryAniListMedia: AniListAnime | null = null;
  let watchLinksByAniListId = new Map<number, AniListWatchLink[]>();
  try {
    const anilistIds = [...anilistIdByEntry.values()].filter(Number.isInteger);
    if (anilistIds.length) {
      const [signals, primaryMedia] = await Promise.all([
        getAniListLibrarySignals(anilistIds),
        getAniListAnimeById(Number(primaryExternalId?.external_id ?? anilistIds[0])),
      ]);
      watchLinksByAniListId = signals.watchLinks;
      primaryAniListMedia = primaryMedia;
    }
  } catch (error) {
    console.error(
      "Could not load official streaming links",
      error instanceof Error ? error.message : "UNKNOWN",
    );
  }
  const progressByEntry = new Map(
    progressRows.map((row) => [row.entry_id, row.episodes_watched]),
  );
  const firstEntryCover = allEntries.find((entry) => Boolean(entry.cover_url))?.cover_url ?? null;
  const resolvedCoverUrl =
    primaryAniListMedia?.coverUrl
    || franchise.cover_url
    || firstEntryCover
    || "/images/anime-eclipse-cover-v2.png";
  const resolvedBannerUrl =
    primaryAniListMedia?.bannerUrl
    || franchise.banner_url
    || primaryAniListMedia?.coverUrl
    || firstEntryCover
    || "/images/anime-eclipse-hero-v1.png";

  return {
    franchiseId: franchise.id,
    slug: franchise.slug,
    title: franchise.canonical_title,
    alternativeTitle: franchise.alternative_title ?? "",
    synopsis: franchise.synopsis ?? "",
    coverUrl: resolvedCoverUrl,
    bannerUrl: resolvedBannerUrl,
    recordStatus: franchise.record_status,
    sourceName: franchise.source_name,
    sourceExternalId: franchise.source_external_id,
    canEdit:
      franchise.submitted_by === authData.user.id
      && franchise.record_status === "draft",
    genres: (genreResult.data ?? []).flatMap((row) => {
      const relation = row.genres as { name?: string } | { name?: string }[] | null;
      if (Array.isArray(relation)) return relation.flatMap((item) => item.name ?? []);
      return relation?.name ? [relation.name] : [];
    }),
    entries: allEntries.map((entry) => {
      const episodeCount = entry.episode_count ?? 0;
      const episodesWatched = progressByEntry.get(entry.id) ?? 0;
      return {
        id: entry.id,
        title: entry.title,
        entryType: entry.entry_type as ManagedAnimeEntry["entryType"],
        sequenceNumber: relatedOrder.get(entry.id) ?? Number(entry.sequence_number),
        episodeCount,
        episodeDurationMinutes: entry.episode_duration_minutes ?? 0,
        releaseYear: entry.aired_from ? Number(entry.aired_from.slice(0, 4)) : null,
        officialStatus: entry.official_status ?? "",
        coverUrl: entry.cover_url || franchise.cover_url || "/images/anime-eclipse-cover-v2.png",
        episodesWatched,
        personalStatus: episodeCount > 0 && episodesWatched >= episodeCount
          ? "completed" as const
          : episodesWatched > 0
            ? "watching" as const
            : "not_started" as const,
        watchLinks: watchLinksByAniListId.get(anilistIdByEntry.get(entry.id) ?? 0) ?? [],
      };
    }),
  };
}
