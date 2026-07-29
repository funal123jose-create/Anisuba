import { NextResponse } from "next/server";
import { z } from "zod";
import { searchAniListAnime } from "@/lib/anilist/client";
import { createClient } from "@/lib/supabase/server";

const querySchema = z.object({
  q: z.string().trim().min(2).max(120),
  page: z.coerce.number().int().min(1).max(500).default(1),
  format: z.enum(["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"]).optional(),
  year: z.coerce.number().int().min(1940).max(new Date().getFullYear() + 2).optional(),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ message: "Debes iniciar sesión." }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q"),
    page: url.searchParams.get("page") || 1,
    format: url.searchParams.get("format") || undefined,
    year: url.searchParams.get("year") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ message: "Revisa los filtros de búsqueda." }, { status: 400 });
  }

  try {
    const search = await searchAniListAnime({
      query: parsed.data.q,
      page: parsed.data.page,
      format: parsed.data.format,
      seasonYear: parsed.data.year,
    });
    const ids = search.results.map((anime) => String(anime.id));
    const { data: existingIds } = ids.length
      ? await supabase
        .from("anime_external_ids")
        .select("external_id")
        .eq("provider", "anilist")
        .in("external_id", ids)
      : { data: [] as Array<{ external_id: string }> };
    const catalogued = new Set((existingIds ?? []).map((row) => row.external_id));

    return NextResponse.json({
      ...search,
      results: search.results.map((anime) => ({
        ...anime,
        isAlreadyCatalogued: catalogued.has(String(anime.id)),
      })),
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ANILIST_UNAVAILABLE";
    return NextResponse.json(
      {
        message: code === "ANILIST_RATE_LIMITED"
          ? "AniList alcanzó temporalmente su límite de consultas. Intenta nuevamente en un momento."
          : "AniList no respondió correctamente. Intenta nuevamente.",
      },
      { status: code === "ANILIST_RATE_LIMITED" ? 429 : 502 },
    );
  }
}
