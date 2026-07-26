import { describe, expect, it } from "vitest";
import { createEmptyFavoritesData } from "@/data/favorites-empty";
import { favoritesDemoData } from "@/data/mock/favorites";

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
});
