import type { ProfileData } from "@/types/profile";

const fallbackAvatar = "/images/profile-avatar-v1.png";
const fallbackBanner = "/images/profile-cosmic-hero-v1.png";

export function createEmptyProfileData(): ProfileData {
  return {
    user: {
      displayName: "Mi perfil",
      username: "",
      level: 1,
      bio: "Tu historia anime comienza aquí.",
      avatarUrl: fallbackAvatar,
      bannerUrl: fallbackBanner,
      favoriteGenres: [],
    },
    stats: [
      { id: "hours", label: "Días viendo", value: "0 h", detail: "Sin actividad", tone: "violet" },
      { id: "anime", label: "Animes vistos", value: "0", detail: "Sin actividad", tone: "cyan" },
      { id: "episodes", label: "Episodios", value: "0", detail: "Sin actividad", tone: "green" },
      { id: "genres", label: "Géneros", value: "0", detail: "Sin preferencias aún", tone: "amber" },
      { id: "member", label: "Miembro desde", value: "Hoy", detail: "Bienvenido a AniSuba", tone: "pink" },
    ],
    favorites: [],
    achievements: [],
    achievementProgress: { unlocked: 0, total: 24 },
    recentActivity: [],
    currentLibrary: [],
  };
}
