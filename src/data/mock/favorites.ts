import type { FavoriteAnime, FavoritesData } from "@/types/favorites";

const covers = [
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-hSNRJM03pvv1.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx146065-IjirxRK26O03.png",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg",
];

const favoriteSeed: Omit<FavoriteAnime, "id" | "slug" | "coverUrl">[] = [
  { title: "Eclipse of the Abyss", year: 2023, episodeCount: 12, score: 9.7, genres: ["Acción", "Fantasía"], description: "Una obra maestra visual y emocional. Cada episodio deja sin palabras.", addedDaysAgo: 2 },
  { title: "Chronicles of Elysia", year: 2022, episodeCount: 24, score: 9.5, genres: ["Drama", "Fantasía"], description: "Historia épica, personajes inolvidables y un mundo fascinante.", addedDaysAgo: 5 },
  { title: "Shadows of the Dawn", year: 2021, episodeCount: 13, score: 9.3, genres: ["Acción", "Misterio"], description: "Acción, misterio y giros inesperados. Simplemente perfecto.", addedDaysAgo: 9 },
  { title: "Violet Memory", year: 2023, episodeCount: 10, score: 9.1, genres: ["Drama", "Romance"], description: "Emotivo y profundo. Me hizo llorar más de una vez.", addedDaysAgo: 14 },
  { title: "Requiem Zero", year: 2022, episodeCount: 22, score: 8.9, genres: ["Ciencia ficción", "Drama"], description: "Trama compleja y final inolvidable. Muy infravalorado.", addedDaysAgo: 25 },
  { title: "Neon Genesis: Orion", year: 2021, episodeCount: 26, score: 8.8, genres: ["Ciencia ficción", "Acción"], description: "Ciencia ficción en su máxima expresión. Diseño espectacular.", addedDaysAgo: 34 },
];

const items: FavoriteAnime[] = favoriteSeed.map((item, index) => ({
  ...item,
  id: `favorite-${index + 1}`,
  slug: item.title.toLocaleLowerCase("es").replaceAll(" ", "-"),
  coverUrl: covers[index % covers.length],
}));

export const favoritesDemoData: FavoritesData = {
  totalFavorites: 24,
  averageScore: 8.62,
  animeDays: 147,
  lastAdded: { label: "Hace 2 días", title: "Kimetsu no Yaiba T3" },
  items,
  genreMetrics: [
    { name: "Acción", count: 8, percentage: 33, color: "#7c3aed" },
    { name: "Drama", count: 5, percentage: 21, color: "#3b82f6" },
    { name: "Fantasía", count: 4, percentage: 17, color: "#14b8a6" },
    { name: "Ciencia ficción", count: 3, percentage: 13, color: "#f59e0b" },
    { name: "Misterio", count: 2, percentage: 8, color: "#ec4899" },
    { name: "Romance", count: 2, percentage: 8, color: "#f43f5e" },
  ],
};
