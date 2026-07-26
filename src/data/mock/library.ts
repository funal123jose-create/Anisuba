import type { LibraryData, LibraryItem, PersonalAnimeStatus } from "@/types/library";

const covers = [
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-hSNRJM03pvv1.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx146065-IjirxRK26O03.png",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg",
];

function item(
  slug: string,
  title: string,
  status: PersonalAnimeStatus,
  watched: number,
  total: number,
  index: number,
): LibraryItem {
  return {
    franchiseId: `demo-${slug}`,
    slug,
    title,
    genres: index % 2 === 0 ? ["Acción", "Fantasía"] : ["Drama", "Aventura"],
    coverUrl: covers[index % covers.length],
    score: 8.0 + (index % 10) / 10,
    releaseYear: 2021 + (index % 5),
    status,
    episodesWatched: watched,
    episodeCount: total,
    isFavorite: index === 2 || index === 5,
    updatedAt: new Date(2026, 6, 23, 9 - index).toISOString(),
  };
}

const items = [
  item("eclipse-del-vacio", "Eclipse del Vacío", "watching", 8, 12, 0),
  item("aurora-de-cristal", "Aurora de Cristal", "watching", 6, 13, 1),
  item("sombras-de-hekai", "Sombras de Hekai", "watching", 15, 24, 2),
  item("notas-del-mas-alla", "Notas del Más Allá", "watching", 4, 11, 3),
  item("jardin-de-los-recuerdos", "Jardín de los Recuerdos", "plan_to_watch", 0, 12, 4),
  item("codigo-arcanum", "Código: Arcanum", "completed", 24, 24, 5),
  item("puertas-estelares", "Puertas Estelares", "plan_to_watch", 0, 13, 6),
  item("neon-reverie", "Neón Reverie", "paused", 5, 13, 7),
  item("rencor-del-samurai", "Rencor del Samurái", "paused", 10, 25, 8),
  item("horizontes-perdidos", "Horizontes Perdidos", "waiting_next_season", 12, 12, 9),
  item("la-bruja-del-alba", "La bruja del Alba", "dropped", 6, 12, 10),
  item("cronicas-de-luminis", "Crónicas de Luminis", "plan_to_watch", 0, 24, 11),
];

export const libraryDemoData: LibraryData = {
  totalResults: 146,
  summaries: [
    { status: "watching", label: "Viendo", count: 12, description: "En progreso", tone: "violet" },
    { status: "plan_to_watch", label: "Planeo ver", count: 48, description: "Pendientes", tone: "blue" },
    { status: "completed", label: "Completados", count: 67, description: "Finalizados", tone: "green" },
    { status: "paused", label: "En pausa", count: 7, description: "En pausa", tone: "amber" },
    { status: "dropped", label: "Abandonados", count: 3, description: "Dropeados", tone: "pink" },
    { status: "waiting_next_season", label: "Esperando temp.", count: 9, description: "En espera", tone: "violet" },
  ],
  items,
  recentlyUpdated: items.slice(0, 5),
  continueWatching: items.filter((entry) => entry.status === "watching").slice(0, 5),
};
