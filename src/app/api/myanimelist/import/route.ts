import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAniListAnimeByMalIds } from "@/lib/anilist/client";
import { parseMyAnimeListExport } from "@/lib/myanimelist/import";
import { createClient } from "@/lib/supabase/server";

const acceptedFile = /\.xml(?:\.gz)?$/i;

const genreSlugByAniListName: Record<string, string> = {
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

function entryType(format: string | null) {
  if (format === "MOVIE") return "movie";
  if (format === "OVA") return "ova";
  if (format === "SPECIAL" || format === "MUSIC") return "special";
  return "season";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ message: "Debes iniciar sesión." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const rawSelectedIds = formData.get("selectedIds");
    if (!(file instanceof File) || !acceptedFile.test(file.name)) {
      return NextResponse.json({ message: "Selecciona el XML o XML.GZ original." }, { status: 400 });
    }
    const selectedIds = new Set(
      (JSON.parse(String(rawSelectedIds ?? "[]")) as unknown[])
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0),
    );
    if (selectedIds.size === 0 || selectedIds.size > 500) {
      return NextResponse.json({ message: "Selecciona entre 1 y 500 títulos." }, { status: 400 });
    }

    const entries = parseMyAnimeListExport(
      new Uint8Array(await file.arrayBuffer()),
      file.name,
    ).filter((entry) => selectedIds.has(entry.malId));
    if (entries.length !== selectedIds.size) {
      return NextResponse.json({
        message: "La selección no coincide con el archivo revisado. Genera nuevamente la vista previa.",
      }, { status: 409 });
    }

    const matches = await getAniListAnimeByMalIds(entries.map((entry) => entry.malId));
    const matchByMalId = new Map(
      matches.flatMap((anime) => anime.idMal ? [[anime.idMal, anime] as const] : []),
    );
    const importableEntries = entries.flatMap((entry) => {
      const match = matchByMalId.get(entry.malId);
      if (!match) return [];
      return [{
        malId: entry.malId,
        anilistId: match.id,
        title: match.title,
        alternativeTitle: match.alternativeTitle,
        synopsis: match.description,
        entryType: entryType(match.format),
        episodeCount: match.episodes ?? entry.totalEpisodes,
        watchedEpisodes: entry.watchedEpisodes,
        duration: match.duration,
        releaseYear: match.seasonYear ?? 1900,
        officialStatus: match.status ?? "unknown",
        season: match.season,
        studio: match.studios[0] ?? null,
        genreSlugs: match.genres.flatMap((genre) => genreSlugByAniListName[genre] ?? []),
        tags: match.genres.map((genre) => genre.toLowerCase()),
        status: entry.status,
        score: entry.score,
        startDate: entry.startDate,
        finishDate: entry.finishDate,
        coverUrl: match.coverUrl,
        bannerUrl: match.bannerUrl,
        sourceUrl: match.sourceUrl,
      }];
    });
    if (importableEntries.length === 0) {
      return NextResponse.json({
        message: "Ningún título seleccionado pudo vincularse de forma segura con AniList.",
      }, { status: 422 });
    }

    const { data, error } = await supabase.rpc("import_myanimelist_batch", {
      p_items: importableEntries,
    });
    if (error) {
      console.error("MyAnimeList import RPC failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`MAL_IMPORT_FAILED:${error.code ?? "UNKNOWN"}`);
    }
    const result = Array.isArray(data) ? data[0] : data;
    revalidatePath("/biblioteca");
    revalidatePath("/dashboard");
    revalidatePath("/favoritos");
    revalidatePath("/estadisticas");

    return NextResponse.json({
      imported: Number(result?.imported_count ?? 0),
      updated: Number(result?.updated_count ?? 0),
      skipped: Number(result?.skipped_count ?? 0)
        + (entries.length - importableEntries.length),
      total: entries.length,
      unresolved: entries.length - importableEntries.length,
    });
  } catch (error) {
    console.error(
      "MyAnimeList import failed",
      error instanceof Error ? error.message : "UNKNOWN",
    );
    return NextResponse.json({
      message: "La importación no pudo completarse. No se aplicó ningún cambio parcial.",
    }, { status: 400 });
  }
}
