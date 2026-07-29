import { NextResponse } from "next/server";
import { getAniListAnimeByMalIds } from "@/lib/anilist/client";
import { parseMyAnimeListExport } from "@/lib/myanimelist/import";
import { createClient } from "@/lib/supabase/server";

const acceptedFile = /\.(xml|xml\.gz)$/i;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ message: "Debes iniciar sesión." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || !acceptedFile.test(file.name)) {
      return NextResponse.json({
        message: "Selecciona la exportación .xml o .xml.gz de MyAnimeList.",
      }, { status: 400 });
    }
    const entries = parseMyAnimeListExport(
      new Uint8Array(await file.arrayBuffer()),
      file.name,
    );
    const aniListMatches = await getAniListAnimeByMalIds(entries.map((entry) => entry.malId));
    const matchByMalId = new Map(
      aniListMatches.flatMap((anime) => anime.idMal ? [[anime.idMal, anime] as const] : []),
    );
    const { data: existingRows, error: existingError } = await supabase
      .from("anime_external_ids")
      .select("external_id")
      .eq("provider", "myanimelist")
      .in("external_id", entries.map((entry) => String(entry.malId)));
    if (existingError) throw new Error("MAL_DUPLICATE_LOOKUP_FAILED");
    const existingIds = new Set((existingRows ?? []).map((row) => row.external_id));
    const counts = {
      completed: 0,
      dropped: 0,
      paused: 0,
      plan_to_watch: 0,
      watching: 0,
    };
    entries.forEach((entry) => {
      counts[entry.status] += 1;
    });

    const matchedCount = entries.filter((entry) => matchByMalId.has(entry.malId)).length;
    const unresolvedCount = entries.length - matchedCount;
    return NextResponse.json({
      filename: file.name,
      summary: {
        total: entries.length,
        duplicates: existingIds.size,
        ready: entries.filter((entry) => (
          !existingIds.has(String(entry.malId)) && matchByMalId.has(entry.malId)
        )).length,
        matched: matchedCount,
        unresolved: unresolvedCount,
        counts,
      },
      items: entries.map((entry) => {
        const match = matchByMalId.get(entry.malId);
        const alreadyCatalogued = existingIds.has(String(entry.malId));
        return {
          ...entry,
          alreadyCatalogued,
          resolution: alreadyCatalogued ? "existing" : match ? "matched" : "unresolved",
          match: match ? {
            anilistId: match.id,
            title: match.title,
            format: match.format,
            episodes: match.episodes,
            coverUrl: match.coverUrl,
            seasonYear: match.seasonYear,
          } : null,
        };
      }),
    });
  } catch (error) {
    console.error("MyAnimeList preview failed", error instanceof Error ? error.message : "UNKNOWN");
    return NextResponse.json({
      message: "No pudimos leer la exportación. Confirma que sea el archivo original de MyAnimeList.",
    }, { status: 400 });
  }
}
