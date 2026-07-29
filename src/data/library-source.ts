import { createEmptyLibraryData } from "@/data/library-empty";
import { libraryDemoData } from "@/data/mock/library";
import { createClient } from "@/lib/supabase/server";
import type {
  LibraryData,
  LibraryItem,
  PersonalAnimeStatus,
} from "@/types/library";

export type LibraryDataMode = "demo" | "live";

type LibraryRow = {
  franchise_id: string;
  status: PersonalAnimeStatus;
  updated_at: string;
};

type FranchiseRow = {
  id: string;
  slug: string;
  canonical_title: string;
  cover_url: string | null;
  record_status: string;
  submitted_by: string | null;
};

type EntryRow = {
  id: string;
  franchise_id: string;
  episode_count: number | null;
  aired_from: string | null;
  cover_url: string | null;
  updated_at: string;
};

type ProgressRow = {
  entry_id: string;
  episodes_watched: number;
  updated_at: string;
};

type GenreJoinRow = {
  franchise_id: string;
  genres: { name: string } | { name: string }[] | null;
};

function resolveLibraryDataMode(
  configuredMode = process.env.ANISUBA_LIBRARY_DATA_MODE,
): LibraryDataMode {
  return configuredMode === "demo" ? "demo" : "live";
}

function buildSummaries(items: LibraryItem[]) {
  const empty = createEmptyLibraryData().summaries;
  return empty.map((summary) => ({
    ...summary,
    count: items.filter((item) => item.status === summary.status).length,
  }));
}

export function mapLibraryRows(input: {
  viewerUserId?: string;
  libraryRows: LibraryRow[];
  franchises: FranchiseRow[];
  entries: EntryRow[];
  progressRows: ProgressRow[];
  genreRows: GenreJoinRow[];
  favoriteIds: string[];
  ratings: { franchise_id: string; score: number }[];
}): LibraryData {
  const franchiseById = new Map(input.franchises.map((row) => [row.id, row]));
  const firstEntryByFranchise = new Map<string, EntryRow>();
  for (const entry of input.entries) {
    if (!firstEntryByFranchise.has(entry.franchise_id)) {
      firstEntryByFranchise.set(entry.franchise_id, entry);
    }
  }
  const progressByEntry = new Map(input.progressRows.map((row) => [row.entry_id, row]));
  const ratingByFranchise = new Map(input.ratings.map((row) => [row.franchise_id, Number(row.score)]));
  const favoriteIds = new Set(input.favoriteIds);
  const genresByFranchise = new Map<string, string[]>();

  for (const row of input.genreRows) {
    const relation = Array.isArray(row.genres) ? row.genres[0] : row.genres;
    if (!relation?.name) continue;
    const current = genresByFranchise.get(row.franchise_id) ?? [];
    current.push(relation.name);
    genresByFranchise.set(row.franchise_id, current);
  }

  const items = input.libraryRows.flatMap<LibraryItem>((libraryRow) => {
    const franchise = franchiseById.get(libraryRow.franchise_id);
    if (!franchise) return [];
    const entry = firstEntryByFranchise.get(franchise.id);
    const progress = entry ? progressByEntry.get(entry.id) : undefined;

    return [{
      franchiseId: franchise.id,
      slug: franchise.slug,
      title: franchise.canonical_title,
      genres: genresByFranchise.get(franchise.id) ?? [],
      coverUrl: entry?.cover_url || franchise.cover_url || "/images/anime-eclipse-cover-v2.png",
      score: ratingByFranchise.get(franchise.id) ?? null,
      releaseYear: entry?.aired_from ? Number(entry.aired_from.slice(0, 4)) : null,
      status: libraryRow.status,
      episodesWatched: progress?.episodes_watched ?? 0,
      episodeCount: entry?.episode_count ?? null,
      isFavorite: favoriteIds.has(franchise.id),
      canEditCatalog: Boolean(
        input.viewerUserId
        && franchise.submitted_by === input.viewerUserId
        && (franchise.record_status === "draft" || franchise.record_status === "rejected"),
      ),
      updatedAt: progress?.updated_at ?? libraryRow.updated_at,
    }];
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return {
    totalResults: items.length,
    summaries: buildSummaries(items),
    items,
    recentlyUpdated: items.slice(0, 5),
    continueWatching: items
      .filter((item) => item.status === "watching" || item.status === "caught_up")
      .slice(0, 5),
  };
}

async function getLiveLibraryData(): Promise<LibraryData> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) return createEmptyLibraryData();

  const { data: libraryRows, error: libraryError } = await supabase
    .from("user_library")
    .select("franchise_id,status,updated_at")
    .eq("user_id", userId)
    .is("removed_at", null)
    .order("updated_at", { ascending: false });

  if (libraryError) {
    console.error("Could not load user library", libraryError.code);
    return createEmptyLibraryData();
  }
  if (!libraryRows?.length) return createEmptyLibraryData();

  const franchiseIds = libraryRows.map((row) => row.franchise_id);
  const [
    franchiseResult,
    entryResult,
    genreResult,
    favoriteResult,
    ratingResult,
  ] = await Promise.all([
    supabase.from("anime_franchises")
      .select("id,slug,canonical_title,cover_url,record_status,submitted_by")
      .in("id", franchiseIds),
    supabase.from("anime_entries")
      .select("id,franchise_id,episode_count,aired_from,cover_url,updated_at")
      .in("franchise_id", franchiseIds)
      .order("sequence_number", { ascending: true }),
    supabase.from("anime_genres")
      .select("franchise_id,genres(name)")
      .in("franchise_id", franchiseIds),
    supabase.from("favorites")
      .select("franchise_id")
      .eq("user_id", userId)
      .in("franchise_id", franchiseIds),
    supabase.from("ratings")
      .select("franchise_id,score")
      .eq("user_id", userId)
      .in("franchise_id", franchiseIds),
  ]);

  const entryIds = (entryResult.data ?? []).map((entry) => entry.id);
  const progressResult = entryIds.length
    ? await supabase.from("user_entry_progress")
        .select("entry_id,episodes_watched,updated_at")
        .eq("user_id", userId)
        .in("entry_id", entryIds)
    : { data: [] };

  const queryError = [
    franchiseResult.error,
    entryResult.error,
    genreResult.error,
    favoriteResult.error,
    ratingResult.error,
    "error" in progressResult ? progressResult.error : null,
  ].find(Boolean);
  if (queryError) {
    console.error("Could not hydrate user library");
    return createEmptyLibraryData();
  }

  return mapLibraryRows({
    viewerUserId: userId,
    libraryRows: libraryRows as LibraryRow[],
    franchises: (franchiseResult.data ?? []) as FranchiseRow[],
    entries: (entryResult.data ?? []) as EntryRow[],
    progressRows: (progressResult.data ?? []) as ProgressRow[],
    genreRows: (genreResult.data ?? []) as GenreJoinRow[],
    favoriteIds: (favoriteResult.data ?? []).map((row) => row.franchise_id),
    ratings: (ratingResult.data ?? []).map((row) => ({
      franchise_id: row.franchise_id,
      score: Number(row.score),
    })),
  });
}

export async function getLibraryPresentationData(): Promise<{
  data: LibraryData;
  mode: LibraryDataMode;
}> {
  const mode = resolveLibraryDataMode();
  return {
    data: mode === "demo" ? libraryDemoData : await getLiveLibraryData(),
    mode,
  };
}
