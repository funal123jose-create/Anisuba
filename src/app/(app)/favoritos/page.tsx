import { FavoritesPage } from "@/components/favorites/favorites-page";
import { getFavoritesPresentationData } from "@/data/favorites-source";

export default function FavoritesRoute() {
  const { data, mode } = getFavoritesPresentationData();
  return <FavoritesPage data={data} isDemo={mode === "demo"} />;
}
