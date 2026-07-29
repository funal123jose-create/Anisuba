import { AddAnimePage } from "@/components/anime/add-anime-page";

export default async function AddAnimeRoute({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query = "" } = await searchParams;
  return <AddAnimePage initialQuery={query.slice(0, 180)} />;
}
