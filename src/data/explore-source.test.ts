import { describe, expect, it } from "vitest";
import { createEmptyExploreData } from "@/data/explore-empty";
import { exploreDemoData } from "@/data/mock/explore";

describe("explore presentation data", () => {
  it("incluye contenido suficiente para validar el mockup", () => {
    expect(exploreDemoData.featured.length).toBeGreaterThan(1);
    expect(exploreDemoData.trending).toHaveLength(6);
    expect(exploreDemoData.popular).toHaveLength(6);
  });

  it("no mezcla el catálogo demo con el estado live vacío", () => {
    const liveData = createEmptyExploreData();

    expect(liveData.featured).toEqual([]);
    expect(liveData.trending).toEqual([]);
    expect(liveData.popular).toEqual([]);
  });
});
