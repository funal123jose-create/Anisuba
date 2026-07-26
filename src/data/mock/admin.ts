import type { AdminDashboardData } from "@/types/admin";

const avatars = [
  "/images/profile-avatar-v1.png",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-hSNRJM03pvv1.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx146065-IjirxRK26O03.png",
];

export const adminDemoData: AdminDashboardData = {
  metrics: [
    { id: "users", label: "Usuarios totales", value: "24,812", change: "12.4%", comparison: "vs. mes anterior", direction: "up", tone: "violet", icon: "users", sparkline: [12,13,13,15,16,18,18,22,21,25,26,29] },
    { id: "catalog", label: "Animes en catálogo", value: "3,482", change: "5.7%", comparison: "vs. mes anterior", direction: "up", tone: "blue", icon: "catalog", sparkline: [11,12,13,13,15,16,15,18,19,22,23,27] },
    { id: "sync", label: "Sincronizaciones (24h)", value: "128", change: "18.2%", comparison: "vs. ayer", direction: "up", tone: "green", icon: "sync", sparkline: [14,13,15,16,18,17,20,19,21,23,24,25] },
    { id: "errors", label: "Errores API (24h)", value: "7", change: "-22.2%", comparison: "vs. ayer", direction: "down", tone: "red", icon: "error", sparkline: [9,10,10,11,12,12,13,15,14,17,16,19] },
    { id: "uptime", label: "Actividad del sistema", value: "98.2%", change: "1.1%", comparison: "Uptime 30 días", direction: "up", tone: "amber", icon: "server", sparkline: [15,17,16,18,18,17,19,18,21,20,22,22] },
  ],
  recentUsers: [
    { id: "u1", name: "AkaneTsuki", email: "akane.tsuki@email.com", registered: "18 May, 2024", activity: "hace 5 min", country: "🇲🇽 MX", role: "Usuario", avatarUrl: avatars[0] },
    { id: "u2", name: "Shinra01", email: "shinra01@protonmail.com", registered: "18 May, 2024", activity: "hace 28 min", country: "🇪🇸 ES", role: "Usuario", avatarUrl: avatars[1] },
    { id: "u3", name: "OtakuMaster", email: "otaku.master@icloud.com", registered: "17 May, 2024", activity: "hace 1 h", country: "🇦🇷 AR", role: "Usuario", avatarUrl: avatars[2] },
    { id: "u4", name: "LunaNoYume", email: "luna.yume@gmail.com", registered: "17 May, 2024", activity: "hace 2 h", country: "🇨🇱 CL", role: "Moderador", avatarUrl: avatars[3] },
    { id: "u5", name: "KuroNeko", email: "kuroneko@outlook.com", registered: "16 May, 2024", activity: "hace 3 h", country: "🇵🇪 PE", role: "Usuario", avatarUrl: avatars[4] },
  ],
  alerts: [
    { id: "a1", severity: "warning", type: "Metadatos incompletos", description: "Animes sin sinopsis o portada", affected: 23, detected: "hace 12 min" },
    { id: "a2", severity: "error", type: "Episodios duplicados", description: "Episodios duplicados detectados", affected: 8, detected: "hace 34 min" },
    { id: "a3", severity: "warning", type: "Enlaces rotos", description: "Fuentes de video no disponibles", affected: 15, detected: "hace 1 h" },
    { id: "a4", severity: "info", type: "Tags inconsistentes", description: "Tags fuera de taxonomía", affected: 31, detected: "hace 2 h" },
    { id: "a5", severity: "warning", type: "Títulos sin normalizar", description: "Títulos con formato irregular", affected: 12, detected: "hace 3 h" },
  ],
  syncJobs: [
    { id: "s1", job: "Sync MyAnimeList", source: "MyAnimeList API", status: "Completado", execution: "hace 8 min" },
    { id: "s2", job: "Sync Kitsu", source: "Kitsu API", status: "Completado", execution: "hace 18 min" },
    { id: "s3", job: "Sync Jikan", source: "Jikan API", status: "En progreso", execution: "45%" },
    { id: "s4", job: "Sync Gogoanime", source: "Gogoanime", status: "Completado", execution: "hace 1 h" },
    { id: "s5", job: "Sync AniList", source: "AniList API", status: "Fallido", execution: "hace 1 h" },
  ],
  apiHealth: [
    { name: "MyAnimeList API", status: "Operativo", uptime: "98.7%", latency: "182 ms" },
    { name: "AniList API", status: "Operativo", uptime: "99.1%", latency: "156 ms" },
    { name: "Jikan API", status: "Operativo", uptime: "97.8%", latency: "245 ms" },
    { name: "Kitsu API", status: "Operativo", uptime: "98.9%", latency: "134 ms" },
    { name: "Gogoanime API", status: "Degradado", uptime: "95.2%", latency: "412 ms" },
  ],
  userGrowth: [2,5,4,7,9,8,11,13,12,15,16,18,17,20,19,22,21,25],
  requests: [45,58,52,72,60,48,56,75,51,66,47,59,43,61,72,63,78,69],
  errors: [20,16,8,18,23,10,15,33,12,25,36,18,52,24,31,22,48,17],
};
