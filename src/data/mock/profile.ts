import type { ProfileData } from "@/types/profile";

const covers = [
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-hSNRJM03pvv1.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx146065-IjirxRK26O03.png",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg",
];

export const profileDemoData: ProfileData = {
  user: {
    displayName: "José Luis",
    username: "joseluis_12",
    level: 12,
    bio: "Apasionado del anime desde 2016. Buscando siempre historias que dejen huella.",
    avatarUrl: "/images/profile-avatar-v1.png",
    bannerUrl: "/images/profile-cosmic-hero-v1.png",
    favoriteGenres: ["Acción", "Aventura", "Drama", "Fantasía", "Misterio"],
  },
  stats: [
    { id: "hours", label: "Días viendo", value: "1,248 h", detail: "52 días de anime", tone: "violet" },
    { id: "anime", label: "Animes vistos", value: "156", detail: "67 completados", tone: "cyan" },
    { id: "episodes", label: "Episodios", value: "2,842", detail: "48 este mes", tone: "green" },
    { id: "genres", label: "Géneros", value: "18", detail: "Acción es tu favorito", tone: "amber" },
    { id: "member", label: "Miembro desde", value: "Abr 2023", detail: "1 año en AniSuba", tone: "pink" },
  ],
  favorites: [
    { id: "pf1", rank: 1, title: "Eclipse del Vacío", detail: "Acción · Fantasía", score: 9.7, coverUrl: covers[0] },
    { id: "pf2", rank: 2, title: "Aurora de Cristal", detail: "Drama · Aventura", score: 9.5, coverUrl: covers[1] },
    { id: "pf3", rank: 3, title: "Sombras de Hekai", detail: "Acción · Misterio", score: 9.3, coverUrl: covers[2] },
    { id: "pf4", rank: 4, title: "Notas del Más Allá", detail: "Drama · Fantasía", score: 9.1, coverUrl: covers[3] },
    { id: "pf5", rank: 5, title: "Jardín de los Recuerdos", detail: "Romance · Drama", score: 8.9, coverUrl: covers[4] },
  ],
  achievements: [
      { id: "pa1", icon: "flame", title: "Maratonista", description: "Viste 50 episodios en una semana.", tone: "violet", unlocked: true },
      { id: "pa2", icon: "trophy", title: "No Life", description: "Viste anime durante 30 días seguidos.", tone: "pink", unlocked: true },
      { id: "pa3", icon: "star", title: "Explorador", description: "Viste anime de 10 géneros distintos.", tone: "blue", unlocked: true },
      { id: "pa4", icon: "clock", title: "Coleccionista", description: "Agregaste 100 animes a tu biblioteca.", tone: "cyan", unlocked: true },
      { id: "pa5", icon: "heart", title: "Veterano", description: "Miembro activo por más de un año.", tone: "amber", unlocked: true },
      { id: "pa6", icon: "target", title: "No Spoiler", description: "Completaste un anime sin spoilers.", tone: "green", unlocked: true },
  ],
  achievementProgress: { unlocked: 12, total: 24 },
  recentActivity: [
    { id: "pr1", title: "Avanzaste en Eclipse del Vacío", detail: "Episodio 8 de 12", timeLabel: "Hace 25 min", coverUrl: covers[0], tone: "violet" },
    { id: "pr2", title: "Completaste Aurora de Cristal", detail: "Puntuación: 9.5", timeLabel: "Hace 3 h", coverUrl: covers[1], tone: "green" },
    { id: "pr3", title: "Agregaste Sombras de Hekai", detail: "A tu lista Viendo", timeLabel: "Ayer", coverUrl: covers[2], tone: "cyan" },
    { id: "pr4", title: "Marcaste como favorito", detail: "Notas del Más Allá", timeLabel: "Hace 2 días", coverUrl: covers[3], tone: "pink" },
    { id: "pr5", title: "Calificaste Jardín de los Recuerdos", detail: "8.9 de 10", timeLabel: "Hace 3 días", coverUrl: covers[4], tone: "amber" },
  ],
  currentLibrary: [
    { id: "pl1", title: "Eclipse del Vacío", detail: "8/12 episodios", progress: 67, coverUrl: covers[0], tone: "violet" },
    { id: "pl2", title: "Aurora de Cristal", detail: "6/13 episodios", progress: 46, coverUrl: covers[1], tone: "cyan" },
    { id: "pl3", title: "Sombras de Hekai", detail: "15/24 episodios", progress: 63, coverUrl: covers[2], tone: "amber" },
    { id: "pl4", title: "Notas del Más Allá", detail: "4/11 episodios", progress: 36, coverUrl: covers[3], tone: "pink" },
    { id: "pl5", title: "Jardín de los Recuerdos", detail: "2/12 episodios", progress: 17, coverUrl: covers[4], tone: "green" },
  ],
};
