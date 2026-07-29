import { LibraryPage } from "@/components/library/library-page";
import { getLibraryPresentationData } from "@/data/library-source";
import {
  removeLibraryItemAction,
  setLibraryFavoriteAction,
  updateLibraryProgressAction,
} from "@/app/(app)/biblioteca/actions";

export default async function LibraryRoute() {
  const { data, mode } = await getLibraryPresentationData();
  return (
    <LibraryPage
      data={data}
      isDemo={mode === "demo"}
      onFavoriteChange={mode === "live" ? setLibraryFavoriteAction : undefined}
      onProgressChange={mode === "live" ? updateLibraryProgressAction : undefined}
      onRemove={mode === "live" ? removeLibraryItemAction : undefined}
    />
  );
}
