import "server-only";

import { getAniListAnimeDetails, type AniListAnimeDetails } from "@/lib/anilist/client";
import { createClient } from "@/lib/supabase/server";
import type { PersonalAnimeStatus } from "@/types/library";

export type LiveAnimeDetailData = {
  franchiseId: string;
  slug: string;
  title: string;
  synopsis: string;
  coverUrl: string;
  bannerUrl: string;
  genres: string[];
  status: PersonalAnimeStatus;
  episodesWatched: number;
  episodeCount: number;
  isFavorite: boolean;
  rating: number | null;
  canEdit: boolean;
  contents: {
    id: string;
    title: string;
    type: string;
    sequence: number;
    episodeCount: number;
    episodesWatched: number;
    coverUrl: string;
    anilistId: number | null;
  }[];
  anilist: AniListAnimeDetails | null;
};

export async function getLiveAnimeDetailData(slug: string): Promise<LiveAnimeDetailData | null> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;
  const { data: franchise } = await supabase.from("anime_franchises")
    .select("id,slug,canonical_title,synopsis,cover_url,banner_url,submitted_by,record_status")
    .eq("slug", slug).maybeSingle();
  if (!franchise) return null;
  const { data: entries } = await supabase.from("anime_entries")
    .select("id,title,entry_type,sequence_number,episode_count,cover_url").eq("franchise_id", franchise.id)
    .order("sequence_number", { ascending: true });
  const firstEntry = entries?.[0];
  const entryIds = (entries ?? []).map((entry) => entry.id);
  const [{ data: library }, { data: favorite }, { data: progressRows }, { data: rating }, { data: genres }, { data: externalRows }] = await Promise.all([
    supabase.from("user_library").select("status").eq("user_id", authData.user.id).eq("franchise_id", franchise.id).is("removed_at", null).maybeSingle(),
    supabase.from("favorites").select("franchise_id").eq("user_id", authData.user.id).eq("franchise_id", franchise.id).maybeSingle(),
    entryIds.length
      ? supabase.from("user_entry_progress").select("entry_id,episodes_watched").eq("user_id", authData.user.id).in("entry_id", entryIds)
      : Promise.resolve({ data: [] }),
    supabase.from("ratings").select("score").eq("user_id", authData.user.id).eq("franchise_id", franchise.id).maybeSingle(),
    supabase.from("anime_genres").select("genres(name)").eq("franchise_id", franchise.id),
    entryIds.length
      ? supabase.from("anime_external_ids").select("entry_id,external_id").in("entry_id", entryIds).eq("provider", "anilist")
      : Promise.resolve({ data: [] }),
  ]);
  const externalByEntry = new Map((externalRows ?? []).map((row) => [row.entry_id, Number(row.external_id)]));
  const progressByEntry = new Map((progressRows ?? []).map((row) => [row.entry_id, row.episodes_watched]));
  let anilist: AniListAnimeDetails | null = null;
  const primaryAniListId = firstEntry ? externalByEntry.get(firstEntry.id) : null;
  if (primaryAniListId) {
    try { anilist = await getAniListAnimeDetails(primaryAniListId); }
    catch (error) { console.error("Could not hydrate AniList anime details", error); }
  }
  const genreNames = (genres ?? []).flatMap((row) => {
    const value = row.genres as { name?: string } | { name?: string }[] | null;
    return Array.isArray(value) ? value.flatMap((entry) => entry.name ?? []) : value?.name ? [value.name] : [];
  });
  return {
    franchiseId: franchise.id,
    slug: franchise.slug,
    title: anilist?.title || franchise.canonical_title,
    synopsis: anilist?.description || franchise.synopsis || "Sinopsis no disponible.",
    coverUrl: anilist?.coverUrl || firstEntry?.cover_url || franchise.cover_url || "/images/anime-eclipse-cover-v2.png",
    bannerUrl: anilist?.bannerUrl || franchise.banner_url || anilist?.coverUrl || firstEntry?.cover_url || "/images/anime-eclipse-hero-v1.png",
    genres: anilist?.genres.length ? anilist.genres : genreNames,
    status: (library?.status ?? "plan_to_watch") as PersonalAnimeStatus,
    episodesWatched: firstEntry ? progressByEntry.get(firstEntry.id) ?? 0 : 0,
    episodeCount: anilist?.episodes ?? firstEntry?.episode_count ?? 0,
    isFavorite: Boolean(favorite),
    rating: rating?.score == null ? null : Number(rating.score),
    canEdit: franchise.submitted_by === authData.user.id && ["draft", "rejected"].includes(franchise.record_status),
    contents: (entries ?? []).map((entry) => ({
      id: entry.id,
      title: entry.title,
      type: entry.entry_type,
      sequence: Number(entry.sequence_number),
      episodeCount: entry.episode_count ?? 0,
      episodesWatched: progressByEntry.get(entry.id) ?? 0,
      coverUrl: entry.cover_url || franchise.cover_url || "/images/anime-eclipse-cover-v2.png",
      anilistId: externalByEntry.get(entry.id) ?? null,
    })),
    anilist,
  };
}
