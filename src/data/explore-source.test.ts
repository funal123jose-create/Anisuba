import { describe, expect, it } from "vitest";
import { buildRatingDistribution } from "./explore-source";

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
});
