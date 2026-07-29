import { FavoritesPage } from "@/components/favorites/favorites-page";
import { getFavoritesPresentationData } from "@/data/favorites-source";
import { setLibraryFavoriteAction } from "@/app/(app)/biblioteca/actions";

export default async function FavoritesRoute() {
  const { data, mode } = await getFavoritesPresentationData();
  return (
    <FavoritesPage
      data={data}
      isDemo={mode === "demo"}
      onRemoveFavorite={mode === "live" ? setLibraryFavoriteAction : undefined}
    />
  );
}
