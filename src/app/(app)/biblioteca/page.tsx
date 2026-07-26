import { LibraryPage } from "@/components/library/library-page";
import { getLibraryPresentationData } from "@/data/library-source";

export default function LibraryRoute() {
  const { data, mode } = getLibraryPresentationData();
  return <LibraryPage data={data} isDemo={mode === "demo"} />;
}
