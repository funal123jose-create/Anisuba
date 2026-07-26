import { resolvePresentationDataMode, type PresentationDataMode } from "@/data/data-mode";
import { createEmptyLibraryData } from "@/data/library-empty";
import { libraryDemoData } from "@/data/mock/library";
import type { LibraryData } from "@/types/library";

export function getLibraryPresentationData(): {
  data: LibraryData;
  mode: PresentationDataMode;
} {
  const mode = resolvePresentationDataMode();

  return {
    data: mode === "demo" ? libraryDemoData : createEmptyLibraryData(),
    mode,
  };
}
