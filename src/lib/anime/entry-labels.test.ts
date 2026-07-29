import { describe, expect, it } from "vitest";
import { getEntryMarkerLabel, type EntryMarkerInput } from "@/lib/anime/entry-labels";

describe("etiquetas cronológicas de contenidos", () => {
  const entries: EntryMarkerInput[] = [
    { entryType: "season", sequenceNumber: 1 },
    { entryType: "ova", sequenceNumber: 2 },
    { entryType: "season", sequenceNumber: 3 },
    { entryType: "ova", sequenceNumber: 4 },
    { entryType: "movie", sequenceNumber: 5 },
  ];

  it("numera cada tipo sin exponer el orden cronológico interno", () => {
    expect(entries.map((entry) => getEntryMarkerLabel(entry, entries))).toEqual([
      "T1",
      "OVA",
      "T2",
      "OVA 2",
      "PEL",
    ]);
  });
});
