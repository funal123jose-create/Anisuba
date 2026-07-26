import { describe, expect, it } from "vitest";
import { createEmptyLibraryData } from "@/data/library-empty";
import { libraryDemoData } from "@/data/mock/library";

describe("library presentation data", () => {
  it("mantiene coherente el total del escenario aprobado", () => {
    const total = libraryDemoData.summaries.reduce((sum, summary) => sum + summary.count, 0);

    expect(total).toBe(146);
    expect(libraryDemoData.totalResults).toBe(total);
  });

  it("no mezcla registros demo en el estado vacío real", () => {
    const liveData = createEmptyLibraryData();

    expect(liveData.totalResults).toBe(0);
    expect(liveData.items).toEqual([]);
    expect(liveData.summaries.every((summary) => summary.count === 0)).toBe(true);
  });
});
