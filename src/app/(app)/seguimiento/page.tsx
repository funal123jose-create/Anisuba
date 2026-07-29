import { TrackingPage } from "@/components/tracking/tracking-page";
import { getLibraryPresentationData } from "@/data/library-source";
import {
  removeLibraryItemAction,
  setLibraryFavoriteAction,
  updateLibraryProgressAction,
} from "../biblioteca/actions";

export default async function TrackingRoute() {
  const { data, mode } = await getLibraryPresentationData();
  return (
    <TrackingPage
      data={data}
      isDemo={mode === "demo"}
      onFavoriteChange={setLibraryFavoriteAction}
      onProgressChange={updateLibraryProgressAction}
      onRemove={removeLibraryItemAction}
    />
  );
}
