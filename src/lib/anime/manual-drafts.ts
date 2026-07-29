import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CatalogWorkflowStatus =
  | "draft"
  | "in_review"
  | "published"
  | "rejected"
  | "archived";

export type ManualDraftSummary = {
  id: string;
  title: string;
  status: CatalogWorkflowStatus;
  updatedAt: string;
};

export type ManualDraftDuplicate = {
  franchiseId: string;
  title: string;
  releaseYear: number | null;
  entryType: string;
  status: string;
  matchScore: number;
};

export type ManualAnimeInitialValues = {
  franchiseId: string;
  slug: string;
  entryId: string;
  title: string;
  alternativeTitle: string;
  synopsis: string;
  entryType: "season" | "movie" | "ova" | "special";
  episodeCount: number;
  episodeDurationMinutes: number | "";
  releaseYear: number;
  releaseSeason: string;
  studio: string;
  originCountry: string;
  genres: string[];
  officialStatus: string;
  sourceMaterial: string;
  ageRating: string;
  tags: string[];
  isInLibrary: boolean;
  libraryStatus: string;
  initialEpisode: number;
  favorite: boolean;
  rating: number;
  personalNote: string;
  status: CatalogWorkflowStatus;
  rejectionReason: string;
  submissionId?: string;
  submissionStatus?: string;
  reviewNotes?: string;
  cover?: { url: string; path: string };
  banner?: { url: string; path: string };
};

export type ManualAnimePageData = {
  drafts: ManualDraftSummary[];
  selected?: ManualAnimeInitialValues;
  duplicates?: ManualDraftDuplicate[];
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getManualAnimePageData(
  requestedDraftId?: string,
  includeDuplicates = false,
): Promise<ManualAnimePageData> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { drafts: [] };

  const { data: franchiseRows, error: franchiseError } = await supabase
    .from("anime_franchises")
    .select(
      "id, slug, canonical_title, alternative_title, synopsis, cover_url, banner_url, tags, record_status, rejection_reason, updated_at",
    )
    .eq("submitted_by", authData.user.id)
    .in("record_status", ["draft", "rejected", "in_review"])
    .order("updated_at", { ascending: false });

  if (franchiseError) {
    console.error("Manual draft list failed", franchiseError.code);
    return { drafts: [] };
  }

  const drafts: ManualDraftSummary[] = (franchiseRows ?? []).map((row) => ({
    id: row.id,
    title: row.canonical_title,
    status: row.record_status as CatalogWorkflowStatus,
    updatedAt: row.updated_at,
  }));

  if (!requestedDraftId || !UUID_PATTERN.test(requestedDraftId)) {
    return { drafts };
  }

  const franchise = franchiseRows?.find((row) => row.id === requestedDraftId);
  if (!franchise) return { drafts };

  const { data: entry, error: entryError } = await supabase
    .from("anime_entries")
    .select(
      "id, title, entry_type, episode_count, episode_duration_minutes, aired_from, official_status, release_season, studio, origin_country, source_material, age_rating",
    )
    .eq("franchise_id", franchise.id)
    .order("sequence_number", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (entryError || !entry) {
    console.error("Manual draft entry failed", entryError?.code ?? "ENTRY_NOT_FOUND");
    return { drafts };
  }

  const [
    genreResult,
    assetResult,
    preferenceResult,
    submissionResult,
    duplicateResult,
    libraryResult,
    progressResult,
    favoriteResult,
    ratingResult,
  ] =
    await Promise.all([
      supabase
        .from("anime_genres")
        .select("genres(slug)")
        .eq("franchise_id", franchise.id),
      supabase
        .from("anime_assets")
        .select("asset_kind, asset_url, storage_path")
        .eq("franchise_id", franchise.id)
        .eq("is_primary", true),
      supabase
        .from("catalog_draft_preferences")
        .select(
          "library_status, initial_episode, favorite, rating, personal_note",
        )
        .eq("user_id", authData.user.id)
        .eq("franchise_id", franchise.id)
        .maybeSingle(),
      supabase
        .from("catalog_submissions")
        .select("id, status, review_notes")
        .eq("franchise_id", franchise.id)
        .order("review_round", { ascending: false })
        .limit(1)
        .maybeSingle(),
      includeDuplicates
        ? supabase.rpc("find_catalog_duplicates", {
          p_title: franchise.canonical_title,
          p_release_year: entry.aired_from
            ? Number.parseInt(entry.aired_from.slice(0, 4), 10)
            : null,
          p_entry_type: entry.entry_type,
          p_exclude_franchise_id: franchise.id,
          p_limit: 8,
        })
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("user_library")
        .select("status")
        .eq("user_id", authData.user.id)
        .eq("franchise_id", franchise.id)
        .is("removed_at", null)
        .maybeSingle(),
      supabase
        .from("user_entry_progress")
        .select("episodes_watched, personal_note")
        .eq("user_id", authData.user.id)
        .eq("entry_id", entry.id)
        .maybeSingle(),
      supabase
        .from("favorites")
        .select("franchise_id")
        .eq("user_id", authData.user.id)
        .eq("franchise_id", franchise.id)
        .maybeSingle(),
      supabase
        .from("ratings")
        .select("score")
        .eq("user_id", authData.user.id)
        .eq("franchise_id", franchise.id)
        .maybeSingle(),
    ]);

  const assets = assetResult.data ?? [];
  const coverAsset = assets.find((asset) => asset.asset_kind === "cover");
  const bannerAsset = assets.find((asset) => asset.asset_kind === "banner");
  const preferences = preferenceResult.data;
  const latestSubmission = submissionResult.data;
  const library = libraryResult.data;
  const liveProgress = progressResult.data;
  const liveFavorite = favoriteResult.data;
  const liveRating = ratingResult.data;

  const genres = (genreResult.data ?? []).flatMap((row) => {
    const relation = row.genres as { slug?: string } | { slug?: string }[] | null;
    if (Array.isArray(relation)) return relation.flatMap((item) => item.slug ?? []);
    return relation?.slug ? [relation.slug] : [];
  });
  const duplicates: ManualDraftDuplicate[] = (duplicateResult.data ?? [])
    .map((candidate: {
      franchise_id: string;
      canonical_title: string;
      release_year: number | null;
      entry_type: string;
      record_status: string;
      match_score: number | string;
    }) => ({
      franchiseId: candidate.franchise_id,
      title: candidate.canonical_title,
      releaseYear: candidate.release_year,
      entryType: candidate.entry_type,
      status: candidate.record_status,
      matchScore: Number(candidate.match_score),
    }))
    .filter((candidate: ManualDraftDuplicate) => candidate.matchScore >= 0.7);

  return {
    drafts,
    duplicates,
    selected: {
      franchiseId: franchise.id,
      slug: franchise.slug,
      entryId: entry.id,
      title: franchise.canonical_title,
      alternativeTitle: franchise.alternative_title ?? "",
      synopsis: franchise.synopsis ?? "",
      entryType: entry.entry_type as ManualAnimeInitialValues["entryType"],
      episodeCount: entry.episode_count ?? 0,
      episodeDurationMinutes: entry.episode_duration_minutes ?? "",
      releaseYear: entry.aired_from
        ? Number.parseInt(entry.aired_from.slice(0, 4), 10)
        : new Date().getFullYear(),
      releaseSeason: entry.release_season ?? "",
      studio: entry.studio ?? "",
      originCountry: entry.origin_country ?? "",
      genres,
      officialStatus: entry.official_status ?? "",
      sourceMaterial: entry.source_material ?? "",
      ageRating: entry.age_rating ?? "",
      tags: franchise.tags ?? [],
      isInLibrary: Boolean(library),
      libraryStatus: library?.status ?? preferences?.library_status ?? "plan_to_watch",
      initialEpisode: liveProgress?.episodes_watched ?? preferences?.initial_episode ?? 0,
      favorite: Boolean(liveFavorite) || (preferences?.favorite ?? false),
      rating: liveRating?.score
        ? Number(liveRating.score)
        : preferences?.rating
          ? Number(preferences.rating)
          : 0,
      personalNote: liveProgress?.personal_note ?? preferences?.personal_note ?? "",
      status: franchise.record_status as CatalogWorkflowStatus,
      rejectionReason: franchise.rejection_reason ?? "",
      submissionId: latestSubmission?.id,
      submissionStatus: latestSubmission?.status,
      reviewNotes: latestSubmission?.review_notes ?? undefined,
      cover: coverAsset?.storage_path
        ? { url: coverAsset.asset_url, path: coverAsset.storage_path }
        : undefined,
      banner: bannerAsset?.storage_path
        ? { url: bannerAsset.asset_url, path: bannerAsset.storage_path }
        : undefined,
    },
  };
}
