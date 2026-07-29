import { NextResponse } from "next/server";
import { z } from "zod";
import { getAniListAnimeById } from "@/lib/anilist/client";
import { syncAniListFranchise } from "@/lib/anilist/franchise-sync";
import { createClient } from "@/lib/supabase/server";

const importSchema = z.object({
  anilistId: z.number().int().positive(),
  libraryStatus: z.enum(["plan_to_watch", "watching", "completed"]),
  episodesWatched: z.number().int().min(0).max(10000),
  favorite: z.boolean(),
});

const genreSlugMap: Record<string, string> = {
  Action: "accion",
  Adventure: "aventura",
  Comedy: "comedia",
  Drama: "drama",
  Fantasy: "fantasia",
  Horror: "terror",
  Mecha: "mecha",
  Mystery: "misterio",
  Romance: "romance",
  "Sci-Fi": "ciencia-ficcion",
  "Slice of Life": "slice-of-life",
  Sports: "deportes",
  Supernatural: "sobrenatural",
  Thriller: "suspenso",
};

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

async function trySyncTracking({
  anilistId,
  franchiseId,
  supabase,
}: {
  anilistId: number;
  franchiseId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  try {
    return {
      ok: true as const,
      ...await syncAniListFranchise({ anilistId, franchiseId, supabase }),
    };
  } catch {
    return {
      ok: false as const,
      syncedCount: 0,
      skippedCount: 0,
      totalCount: 0,
    };
  }
}

async function addExistingToLibrary({
  entryId,
  favorite,
  libraryStatus,
  episodesWatched,
  supabase,
  userId,
}: {
  entryId: string;
  favorite: boolean;
  libraryStatus: z.infer<typeof importSchema>["libraryStatus"];
  episodesWatched: number;
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
}) {
  const { data: entry, error: entryError } = await supabase
    .from("anime_entries")
    .select("franchise_id,episode_count")
    .eq("id", entryId)
    .single();
  if (entryError || !entry) throw new Error("CATALOG_ENTRY_NOT_VISIBLE");

  const total = entry.episode_count ?? 0;
  const watched = libraryStatus === "completed" ? total
    : libraryStatus === "plan_to_watch" ? 0
      : Math.min(episodesWatched, total || episodesWatched);
  const { error: libraryError } = await supabase.from("user_library").upsert({
    user_id: userId,
    franchise_id: entry.franchise_id,
    status: libraryStatus,
    removed_at: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,franchise_id" });
  if (libraryError) throw new Error("LIBRARY_UPSERT_FAILED");

  const { error: progressError } = await supabase.from("user_entry_progress").upsert({
    user_id: userId,
    entry_id: entryId,
    episodes_watched: watched,
    completed: libraryStatus === "completed",
    last_watched_at: watched > 0 ? new Date().toISOString() : null,
  }, { onConflict: "user_id,entry_id" });
  if (progressError) throw new Error("PROGRESS_UPSERT_FAILED");

  if (favorite) {
    const { error: favoriteError } = await supabase.from("favorites").upsert({
      user_id: userId,
      franchise_id: entry.franchise_id,
    }, { onConflict: "user_id,franchise_id" });
    if (favoriteError) throw new Error("FAVORITE_UPSERT_FAILED");
  }
  return entry.franchise_id as string;
}

export async function POST(request: Request) {
  const parsed = importSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Revisa las preferencias de incorporación." }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ message: "Debes iniciar sesión." }, { status: 401 });
  }

  try {
    const anime = await getAniListAnimeById(parsed.data.anilistId);
    const { data: existing } = await supabase
      .from("anime_external_ids")
      .select("entry_id")
      .eq("provider", "anilist")
      .eq("external_id", String(anime.id))
      .maybeSingle();
    if (existing?.entry_id) {
      const franchiseId = await addExistingToLibrary({
        entryId: existing.entry_id,
        favorite: parsed.data.favorite,
        libraryStatus: parsed.data.libraryStatus,
        episodesWatched: parsed.data.episodesWatched,
        supabase,
        userId: authData.user.id,
      });
      const tracking = await trySyncTracking({
        anilistId: anime.id,
        franchiseId,
        supabase,
      });
      return NextResponse.json({ franchiseId, reused: true, tracking });
    }

    const episodeCount = anime.episodes ?? 0;
    const watched = parsed.data.libraryStatus === "completed" ? episodeCount
      : parsed.data.libraryStatus === "plan_to_watch" ? 0
        : Math.min(parsed.data.episodesWatched, episodeCount || parsed.data.episodesWatched);
    const genreSlugs = anime.genres.flatMap((genre) => genreSlugMap[genre] ? [genreSlugMap[genre]] : []);
    const { data: createdRows, error: createError } = await supabase.rpc("import_external_anime", {
      p_anilist_id: anime.id,
      p_mal_id: anime.idMal,
      p_title: anime.title,
      p_synopsis: anime.description || "Sinopsis no disponible en AniList.",
      p_entry_type: entryTypeMap[anime.format ?? ""] ?? "season",
      p_episode_count: episodeCount,
      p_release_year: anime.seasonYear ?? new Date().getFullYear(),
      p_official_status: statusMap[anime.status ?? ""] ?? "Sin definir",
      p_genre_slugs: genreSlugs.length ? genreSlugs : ["accion"],
      p_library_status: parsed.data.libraryStatus,
      p_alternative_title: anime.alternativeTitle,
      p_episode_duration_minutes: anime.duration,
      p_release_season: anime.season,
      p_studio: anime.studios[0] ?? null,
      p_tags: anime.genres,
      p_initial_episode: watched,
      p_favorite: parsed.data.favorite,
      p_cover_url: anime.coverUrl,
      p_banner_url: anime.bannerUrl,
      p_anilist_url: anime.sourceUrl,
    });
    if (createError) throw new Error("CATALOG_CREATE_FAILED");
    const created = Array.isArray(createdRows) ? createdRows[0] : createdRows;
    if (!created?.entry_id || !created?.franchise_id) throw new Error("CATALOG_CREATE_INVALID");

    const tracking = await trySyncTracking({
      anilistId: anime.id,
      franchiseId: created.franchise_id,
      supabase,
    });

    return NextResponse.json({
      franchiseId: created.franchise_id,
      reused: false,
      tracking,
    });
  } catch (error) {
    console.error("AniList import failed", error instanceof Error ? error.message : "UNKNOWN");
    return NextResponse.json({
      message: "No pudimos incorporar el anime. No se aplicaron cambios a tu biblioteca.",
    }, { status: 500 });
  }
}
