export type AdminTone = "violet" | "blue" | "green" | "red" | "amber" | "cyan" | "pink";

export type AdminMetric = {
  id: string;
  label: string;
  value: string;
  change: string;
  comparison: string;
  direction: "up" | "down";
  tone: AdminTone;
  icon: "users" | "catalog" | "sync" | "error" | "server";
  sparkline: number[];
};

export type AdminRecentUser = {
  id: string;
  name: string;
  email: string;
  registered: string;
  activity: string;
  country: string;
  role: "Usuario" | "Moderador";
  avatarUrl: string;
};

export type AdminDataAlert = {
  id: string;
  severity: "warning" | "error" | "info";
  type: string;
  description: string;
  affected: number;
  detected: string;
};

export type AdminSyncJob = {
  id: string;
  job: string;
  source: string;
  status: "Completado" | "En progreso" | "Fallido";
  execution: string;
};

export type AdminApiHealth = {
  name: string;
  status: "Operativo" | "Degradado";
  uptime: string;
  latency: string;
};

export type AdminDashboardData = {
  metrics: AdminMetric[];
  recentUsers: AdminRecentUser[];
  alerts: AdminDataAlert[];
  syncJobs: AdminSyncJob[];
  apiHealth: AdminApiHealth[];
  userGrowth: number[];
  requests: number[];
  errors: number[];
};
