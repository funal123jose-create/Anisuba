import { describe, expect, it } from "vitest";
import { createEmptyFavoritesData } from "@/data/favorites-empty";
import { favoritesDemoData } from "@/data/mock/favorites";
import { mapFavoriteRows } from "@/data/favorites-mapper";

describe("favorites presentation data", () => {
  it("mantiene el escenario demo aprobado", () => {
    expect(favoritesDemoData.totalFavorites).toBe(24);
    expect(favoritesDemoData.items).toHaveLength(6);
    expect(favoritesDemoData.genreMetrics.reduce((sum, item) => sum + item.percentage, 0)).toBe(100);
  });

  it("mantiene vacío el estado live sin actividad real", () => {
    const liveData = createEmptyFavoritesData();

    expect(liveData.totalFavorites).toBe(0);
    expect(liveData.items).toEqual([]);
    expect(liveData.genreMetrics).toEqual([]);
  });

  it("convierte un favorito persistido en contenido visible", () => {
    const liveData = mapFavoriteRows({
      now: new Date("2026-07-28T12:00:00Z"),
      favoriteRows: [{
        franchise_id: "franchise-1",
        created_at: "2026-07-28T10:00:00Z",
      }],
      franchises: [{
        id: "franchise-1",
        slug: "mecha-ude",
        canonical_title: "Mecha-Ude",
        synopsis: "Sinopsis",
        cover_url: "/cover.png",
      }],
      entries: [{
        franchise_id: "franchise-1",
        episode_count: 12,
        episode_duration_minutes: 24,
        aired_from: "2024-01-01",
        cover_url: null,
      }],
      genreRows: [{
        franchise_id: "franchise-1",
        genres: { name: "Acción" },
      }],
      ratings: [{ franchise_id: "franchise-1", score: 8 }],
    });

    expect(liveData.totalFavorites).toBe(1);
    expect(liveData.items[0]).toMatchObject({
      title: "Mecha-Ude",
      episodeCount: 12,
      score: 8,
      genres: ["Acción"],
    });
  });
});
