import { createEmptyFavoritesData } from "@/data/favorites-empty";
import { favoritesDemoData } from "@/data/mock/favorites";
import {
  mapFavoriteRows,
  type EntryRow,
  type FavoriteRow,
  type FranchiseRow,
  type GenreRow,
} from "@/data/favorites-mapper";
import { createClient } from "@/lib/supabase/server";
import type { FavoritesData } from "@/types/favorites";

export type FavoritesDataMode = "demo" | "live";

function resolveFavoritesDataMode(
  configuredMode = process.env.ANISUBA_FAVORITES_DATA_MODE,
): FavoritesDataMode {
  return configuredMode === "demo" ? "demo" : "live";
}

async function getLiveFavoritesData(): Promise<FavoritesData> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) return createEmptyFavoritesData();

  const { data: favoriteRows, error: favoriteError } = await supabase
    .from("favorites")
    .select("franchise_id,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (favoriteError || !favoriteRows?.length) {
    if (favoriteError) console.error("Could not load favorites", favoriteError.code);
    return createEmptyFavoritesData();
  }

  const franchiseIds = favoriteRows.map((row) => row.franchise_id);
  const [franchiseResult, entryResult, genreResult, ratingResult] = await Promise.all([
    supabase.from("anime_franchises")
      .select("id,slug,canonical_title,synopsis,cover_url")
      .in("id", franchiseIds),
    supabase.from("anime_entries")
      .select("franchise_id,episode_count,episode_duration_minutes,aired_from,cover_url")
      .in("franchise_id", franchiseIds)
      .order("sequence_number", { ascending: true }),
    supabase.from("anime_genres")
      .select("franchise_id,genres(name)")
      .in("franchise_id", franchiseIds),
    supabase.from("ratings")
      .select("franchise_id,score")
      .eq("user_id", userId)
      .in("franchise_id", franchiseIds),
  ]);
  const queryError = [
    franchiseResult.error,
    entryResult.error,
    genreResult.error,
    ratingResult.error,
  ].find(Boolean);
  if (queryError) {
    console.error("Could not hydrate favorites");
    return createEmptyFavoritesData();
  }

  return mapFavoriteRows({
    favoriteRows: favoriteRows as FavoriteRow[],
    franchises: (franchiseResult.data ?? []) as FranchiseRow[],
    entries: (entryResult.data ?? []) as EntryRow[],
    genreRows: (genreResult.data ?? []) as GenreRow[],
    ratings: (ratingResult.data ?? []).map((row) => ({
      franchise_id: row.franchise_id,
      score: Number(row.score),
    })),
  });
}

export async function getFavoritesPresentationData(): Promise<{
  data: FavoritesData;
  mode: FavoritesDataMode;
}> {
  const mode = resolveFavoritesDataMode();
  return {
    data: mode === "demo" ? favoritesDemoData : await getLiveFavoritesData(),
    mode,
  };
}
