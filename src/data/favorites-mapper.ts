import type { FavoriteAnime, FavoritesData } from "@/types/favorites";

export type FavoriteRow = {
  franchise_id: string;
  created_at: string;
};

export type FranchiseRow = {
  id: string;
  slug: string;
  canonical_title: string;
  synopsis: string | null;
  cover_url: string | null;
};

export type EntryRow = {
  franchise_id: string;
  episode_count: number | null;
  episode_duration_minutes: number | null;
  aired_from: string | null;
  cover_url: string | null;
};

export type GenreRow = {
  franchise_id: string;
  genres: { name: string } | { name: string }[] | null;
};

const genreColors = [
  "#7c3aed", "#3b82f6", "#14b8a6", "#f59e0b",
  "#ec4899", "#f43f5e", "#22d3ee", "#84cc16",
];

function relativeDayLabel(days: number) {
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
}

export function mapFavoriteRows(input: {
  now?: Date;
  favoriteRows: FavoriteRow[];
  franchises: FranchiseRow[];
  entries: EntryRow[];
  genreRows: GenreRow[];
  ratings: { franchise_id: string; score: number }[];
}): FavoritesData {
  const now = input.now ?? new Date();
  const franchiseById = new Map(input.franchises.map((row) => [row.id, row]));
  const entryByFranchise = new Map<string, EntryRow>();
  for (const entry of input.entries) {
    if (!entryByFranchise.has(entry.franchise_id)) entryByFranchise.set(entry.franchise_id, entry);
  }
  const ratingByFranchise = new Map(input.ratings.map((row) => [row.franchise_id, Number(row.score)]));
  const genresByFranchise = new Map<string, string[]>();
  for (const row of input.genreRows) {
    const relations = Array.isArray(row.genres) ? row.genres : row.genres ? [row.genres] : [];
    for (const relation of relations) {
      if (!relation.name) continue;
      genresByFranchise.set(row.franchise_id, [
        ...(genresByFranchise.get(row.franchise_id) ?? []),
        relation.name,
      ]);
    }
  }

  const items = input.favoriteRows.flatMap<FavoriteAnime>((favorite) => {
    const franchise = franchiseById.get(favorite.franchise_id);
    if (!franchise) return [];
    const entry = entryByFranchise.get(franchise.id);
    const addedDaysAgo = Math.max(
      0,
      Math.floor((now.getTime() - new Date(favorite.created_at).getTime()) / 86_400_000),
    );
    return [{
      id: franchise.id,
      slug: franchise.slug,
      title: franchise.canonical_title,
      year: entry?.aired_from ? Number(entry.aired_from.slice(0, 4)) : 0,
      episodeCount: entry?.episode_count ?? 0,
      score: ratingByFranchise.get(franchise.id) ?? 0,
      coverUrl: entry?.cover_url || franchise.cover_url || "/images/anime-eclipse-cover-v2.png",
      genres: genresByFranchise.get(franchise.id) ?? [],
      description: franchise.synopsis || "Sinopsis pendiente.",
      addedDaysAgo,
    }];
  });

  const genreCounts = new Map<string, number>();
  for (const item of items) {
    for (const genre of item.genres) genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
  }
  const assignmentTotal = Array.from(genreCounts.values()).reduce((sum, count) => sum + count, 0);
  let allocatedPercentage = 0;
  const genreMetrics = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count], index, entries) => {
      const percentage = index === entries.length - 1
        ? 100 - allocatedPercentage
        : Math.round((count / Math.max(1, assignmentTotal)) * 100);
      allocatedPercentage += percentage;
      return { name, count, percentage, color: genreColors[index % genreColors.length] };
    });

  const ratedItems = items.filter((item) => item.score > 0);
  const totalMinutes = items.reduce((sum, item) => {
    const duration = entryByFranchise.get(item.id)?.episode_duration_minutes ?? 0;
    return sum + item.episodeCount * duration;
  }, 0);
  const newest = items.toSorted((a, b) => a.addedDaysAgo - b.addedDaysAgo)[0];

  return {
    totalFavorites: items.length,
    averageScore: ratedItems.length
      ? ratedItems.reduce((sum, item) => sum + item.score, 0) / ratedItems.length
      : 0,
    animeDays: Math.round((totalMinutes / 1_440) * 10) / 10,
    lastAdded: newest
      ? { label: relativeDayLabel(newest.addedDaysAgo), title: newest.title }
      : { label: "Sin actividad", title: "Ningún favorito agregado" },
    items,
    genreMetrics,
  };
}
