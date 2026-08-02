import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRatingDistribution, getExplorePresentationData, resolveExploreDataMode } from "./explore-source";

const originalExploreMode = process.env.ANISUBA_EXPLORE_DATA_MODE;

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalExploreMode === undefined) delete process.env.ANISUBA_EXPLORE_DATA_MODE;
  else process.env.ANISUBA_EXPLORE_DATA_MODE = originalExploreMode;
});

describe("buildRatingDistribution", () => {
  it("calcula la distribución desde las puntuaciones reales sin valores fijos", () => {
    expect(buildRatingDistribution([1, 4, 5, 7, 8, 9, 9.5])).toEqual([
      33,
      0,
      67,
      33,
      100,
    ]);
  });

  it("mantiene cinco buckets en un catálogo vacío", () => {
    expect(buildRatingDistribution([])).toEqual([0, 0, 0, 0, 0]);
  });

  it("mantiene AniList como fuente principal salvo que demo sea explícito", () => {
    expect(resolveExploreDataMode("live")).toBe("live");
    expect(resolveExploreDataMode(undefined)).toBe("live");
    expect(resolveExploreDataMode("demo")).toBe("demo");
  });

  it("usa el catálogo de respaldo en lugar de vaciar la página ante un 403 de AniList", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    process.env.ANISUBA_EXPLORE_DATA_MODE = "live";

    const result = await getExplorePresentationData();

    expect(result.mode).toBe("demo");
    expect(result.data.sourceStatus).toBe("fallback");
    expect(result.data.trending.length).toBeGreaterThan(0);
    expect(result.data.popular.length).toBeGreaterThan(0);
  });
});
