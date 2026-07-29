export type EntryMarkerInput = {
  entryType: "season" | "movie" | "ova" | "special";
  sequenceNumber: number;
};

export function getEntryMarkerLabel(
  entry: EntryMarkerInput,
  entries: EntryMarkerInput[],
) {
  const sameTypePosition = entries.filter((candidate) =>
    candidate.entryType === entry.entryType
    && candidate.sequenceNumber <= entry.sequenceNumber).length;

  if (entry.entryType === "season") return `T${sameTypePosition}`;
  if (entry.entryType === "ova") {
    return sameTypePosition === 1 ? "OVA" : `OVA ${sameTypePosition}`;
  }
  if (entry.entryType === "movie") {
    return sameTypePosition === 1 ? "PEL" : `PEL ${sameTypePosition}`;
  }
  return sameTypePosition === 1 ? "ESP" : `ESP ${sameTypePosition}`;
}
