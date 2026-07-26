import type { ExploreAnime, ExploreData } from "@/types/explore";

const covers = [
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-hSNRJM03pvv1.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx146065-IjirxRK26O03.png",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg",
];

const banners = [
  "https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg",
];

const titles = [
  "Eclipse de Neón",
  "Vórtice Celestial",
  "Réquiem del Alba",
  "Sombras del Pétalo",
  "Crónicas de Aether",
  "Guardianes del Vacío",
  "Puertas Estelares",
  "Neón Reverie",
  "Rencor del Samurái",
  "Horizontes Perdidos",
  "La bruja del Alba",
  "Códice Arcanum",
];

const genres = [
  ["Acción", "Ciencia ficción", "Drama"],
  ["Fantasía", "Aventura"],
  ["Acción", "Sobrenatural"],
  ["Drama", "Misterio"],
  ["Aventura", "Fantasía"],
  ["Acción", "Suspenso"],
];

const studios = ["MAPPA Originals", "Sunset Studio", "Lumière Works", "Silver Fox", "A-1 Pictures"];
const seasons: ExploreAnime["season"][] = ["Invierno", "Primavera", "Verano", "Otoño"];
const formats: ExploreAnime["format"][] = ["TV", "TV", "Película", "TV", "OVA"];

const anime: ExploreAnime[] = titles.map((title, index) => ({
  id: `explore-${index + 1}`,
  slug: title.toLocaleLowerCase("es").replaceAll(" ", "-"),
  title,
  year: 2024 - (index % 4),
  episodeCount: 12 + (index % 4) * 4,
  score: Number((9.1 - index * 0.09).toFixed(1)),
  coverUrl: covers[index % covers.length],
  bannerUrl: banners[index % banners.length],
  genres: genres[index % genres.length],
  studio: studios[index % studios.length],
  format: formats[index % formats.length],
  season: seasons[index % seasons.length],
  synopsis: "En una ciudad donde el día nunca llega, sus habitantes enfrentan fuerzas capaces de cambiar el destino de la humanidad.",
}));

export const exploreDemoData: ExploreData = {
  featured: anime.slice(0, 3),
  trending: anime.slice(0, 6),
  popular: [anime[0], anime[1], anime[2], anime[3], anime[4], anime[5]],
  genreMetrics: [
    { name: "Acción", value: 78, color: "#ec4899" },
    { name: "Fantasía", value: 65, color: "#8b5cf6" },
    { name: "Ciencia ficción", value: 54, color: "#3b82f6" },
    { name: "Aventura", value: 48, color: "#22c5bd" },
    { name: "Drama", value: 42, color: "#f59e0b" },
    { name: "Suspenso", value: 33, color: "#f43f5e" },
  ],
  studioMetrics: [
    { name: "MAPPA Originals", value: 82, color: "#34d399", detail: "12 títulos" },
    { name: "Sunset Studio", value: 68, color: "#f97316", detail: "9 títulos" },
    { name: "Lumière Works", value: 57, color: "#60a5fa", detail: "7 títulos" },
    { name: "Silver Fox", value: 49, color: "#a78bfa", detail: "6 títulos" },
    { name: "A-1 Pictures", value: 41, color: "#fbbf24", detail: "5 títulos" },
  ],
  averageRating: 8.46,
  ratingDelta: 0.23,
  ratingDistribution: [42, 57, 71, 49, 88, 34, 72, 45, 63],
};
