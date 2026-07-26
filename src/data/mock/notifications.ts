import type { NotificationData } from "@/types/notifications";

export const notificationsDemoData: NotificationData = {
  totalCount: 12,
  unreadCount: 3,
  items: [
    { id: "n1", type: "episode", title: "Nuevo episodio disponible", description: "El episodio 9 de Eclipse of the Abyss ya está disponible.", label: "Eclipse of the Abyss", timeLabel: "Hace 10 min", imageUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-hSNRJM03pvv1.jpg", unread: true, action: "view" },
    { id: "n2", type: "season", title: "Nueva temporada", description: "La temporada 2 de Crimson Vanguard se estrenó.", label: "Crimson Vanguard", timeLabel: "Hace 1 h", imageUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png", unread: true, action: "view" },
    { id: "n3", type: "reminder", title: "Recordatorio", description: "Tienes un anime programado para ver: Frieren: Más allá del viaje – Ep. 12", label: "Hoy a las 20:00", timeLabel: "Hace 3 h", imageUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-n1fmjRv4JQUd.jpg", unread: true, action: "remind" },
    { id: "n4", type: "episode", title: "Nuevo episodio disponible", description: "El episodio 5 de Seraphic Code ya está disponible.", label: "Seraphic Code", timeLabel: "Ayer, 18:30", imageUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx146065-IjirxRK26O03.png", unread: false, action: "view" },
    { id: "n5", type: "system", title: "Actualización del sistema", description: "Hemos mejorado la velocidad de carga y la estabilidad. ¡Gracias por ser parte de AniSuba!", label: "AniSuba", timeLabel: "Ayer, 12:15", imageUrl: "/icon.svg", unread: false, action: "none" },
    { id: "n6", type: "achievement", title: "Logro desbloqueado", description: "¡Felicidades! Completaste 10 animes.", label: "Coleccionista", timeLabel: "15 May, 2024", imageUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg", unread: false, action: "none" },
  ],
  preferences: [
    { id: "episodes", label: "Nuevos episodios", enabled: true },
    { id: "seasons", label: "Nuevas temporadas", enabled: true },
    { id: "reminders", label: "Recordatorios", enabled: true },
    { id: "recommendations", label: "Recomendaciones", enabled: false },
    { id: "system", label: "Noticias del sistema", enabled: true },
  ],
};
