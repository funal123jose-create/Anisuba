import type { AnimeCard, DashboardData } from "@/types/dashboard";

const kimetsu: AnimeCard = {
  id: "kimetsu-no-yaiba",
  title: "Kimetsu no Yaiba",
  subtitle: "Temporada 3 · Arco de la Aldea de los Herreros",
  episode: 9,
  episodes: 11,
  progress: 82,
  status: "Viendo",
  accent: "#8b5cf6",
  coverUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png",
  sourceUrl: "https://anilist.co/anime/145139",
};

const jujutsu: AnimeCard = {
  id: "jujutsu-kaisen-s2",
  title: "Jujutsu Kaisen S2",
  subtitle: "Episodio 17 de 23",
  episode: 17,
  episodes: 23,
  progress: 74,
  status: "Viendo",
  accent: "#4d7cfe",
  coverUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-hSNRJM03pvv1.jpg",
  sourceUrl: "https://anilist.co/anime/145064",
};

const onePiece: AnimeCard = {
  id: "one-piece",
  title: "One Piece",
  subtitle: "Episodio 1086 de 1120+",
  episode: 1086,
  episodes: 1120,
  progress: 68,
  status: "Viendo",
  accent: "#22a8f7",
  coverUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg",
  sourceUrl: "https://anilist.co/anime/21",
};

const mushoku: AnimeCard = {
  id: "mushoku-tensei-s2",
  title: "Mushoku Tensei S2",
  subtitle: "Episodio 5 de 12",
  episode: 5,
  episodes: 12,
  progress: 41,
  status: "Viendo",
  accent: "#209ed8",
  coverUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx146065-IjirxRK26O03.png",
  sourceUrl: "https://anilist.co/anime/146065",
};

const frieren: AnimeCard = {
  id: "sousou-no-frieren",
  title: "Sousou no Frieren",
  subtitle: "Episodio 10 de 28",
  episode: 10,
  episodes: 28,
  progress: 36,
  status: "Viendo",
  accent: "#86d6a7",
  coverUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg",
  sourceUrl: "https://anilist.co/anime/154587",
};

export const dashboardData: DashboardData = {
  user: { name: "José Luis", level: 12 },
  featured: {
    ...kimetsu,
    season: "Continúa viendo",
    nextEpisode: 10,
    bannerUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg",
  },
  metrics: [
    { label: "Total de animes", value: "156", change: "+8 este mes", tone: "violet" },
    { label: "Viendo actualmente", value: "12", change: "+2 esta semana", tone: "blue" },
    { label: "Completados", value: "67", change: "+5 este mes", tone: "green" },
    { label: "Episodios vistos", value: "2,842", change: "+156 esta semana", tone: "pink" },
    { label: "Horas invertidas", value: "1,248 h", change: "+72 h este mes", tone: "cyan" },
  ],
  watching: [jujutsu, kimetsu, onePiece],
  following: [jujutsu, onePiece, mushoku, frieren],
  upcoming: [
    {
      id: "upcoming-jujutsu",
      anime: jujutsu,
      episodeLabel: "Ep. 18",
      releaseLabel: "Estrena en 2 días",
      releaseDate: "17 May, 2024",
      indicatorColor: "#4d7cfe",
    },
    {
      id: "upcoming-mushoku",
      anime: mushoku,
      episodeLabel: "Ep. 6",
      releaseLabel: "Estrena en 3 días",
      releaseDate: "18 May, 2024",
      indicatorColor: "#f59e42",
    },
    {
      id: "upcoming-kimetsu",
      anime: kimetsu,
      episodeLabel: "Ep. 10",
      releaseLabel: "Estrena en 5 días",
      releaseDate: "20 May, 2024",
      indicatorColor: "#ec4899",
    },
  ],
  recentActivity: [
    { id: "a1", action: "Viste el episodio 16", title: "Jujutsu Kaisen S2", time: "Hace 2 horas", tone: "violet" },
    { id: "a2", action: "Agregaste a tu lista", title: "Chainsaw Man", time: "Hace 5 horas", tone: "green" },
    { id: "a3", action: "Terminaste de ver", title: "Cyberpunk: Edgerunners", time: "Ayer", tone: "green" },
    { id: "a4", action: "Calificaste con 9/10", title: "Fullmetal Alchemist: Brotherhood", time: "Ayer", tone: "amber" },
  ],
  statusDistribution: [
    { name: "Viendo", value: 12, color: "#635bff" },
    { name: "Completados", value: 67, color: "#22c5bd" },
    { name: "Planeo ver", value: 48, color: "#6d4adf" },
    { name: "En pausa", value: 17, color: "#f59e42" },
    { name: "Abandonados", value: 12, color: "#ff5c6c" },
  ],
  episodeTrend: [
    { day: "20 abr", episodes: 5 },
    { day: "24 abr", episodes: 12 },
    { day: "28 abr", episodes: 30 },
    { day: "2 may", episodes: 42 },
    { day: "6 may", episodes: 33 },
    { day: "10 may", episodes: 58 },
    { day: "14 may", episodes: 75 },
    { day: "18 may", episodes: 112 },
  ],
  genres: [
    { name: "Acción", value: 28, color: "#8b5cf6" },
    { name: "Aventura", value: 21, color: "#4d7cfe" },
    { name: "Comedia", value: 17, color: "#22d3ee" },
    { name: "Drama", value: 12, color: "#ec4899" },
    { name: "Fantasía", value: 9, color: "#f59e42" },
  ],
};
