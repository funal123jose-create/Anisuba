export type ProfileTone = "violet" | "cyan" | "green" | "amber" | "pink" | "blue";

export type ProfileStat = {
  id: "hours" | "anime" | "episodes" | "genres" | "member";
  label: string;
  value: string;
  detail: string;
  tone: ProfileTone;
};

export type ProfileFavorite = {
  id: string;
  rank: number;
  title: string;
  detail: string;
  score: number;
  coverUrl: string;
};

export type ProfileAchievement = {
  id: string;
  icon: "flame" | "trophy" | "star" | "clock" | "heart" | "target";
  title: string;
  description: string;
  tone: ProfileTone;
  unlocked: boolean;
};

export type ProfileActivity = {
  id: string;
  title: string;
  detail: string;
  timeLabel: string;
  coverUrl: string;
  tone: ProfileTone;
};

export type ProfileLibraryItem = {
  id: string;
  title: string;
  detail: string;
  progress: number;
  coverUrl: string;
  tone: ProfileTone;
};

export type ProfileData = {
  user: {
    displayName: string;
    username: string;
    level: number;
    bio: string;
    avatarUrl: string;
    bannerUrl: string;
    favoriteGenres: string[];
  };
  stats: ProfileStat[];
  favorites: ProfileFavorite[];
  achievements: ProfileAchievement[];
  achievementProgress: { unlocked: number; total: number };
  recentActivity: ProfileActivity[];
  currentLibrary: ProfileLibraryItem[];
};
