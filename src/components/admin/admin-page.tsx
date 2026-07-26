"use client";

import Image from "next/image";
import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Activity, AlertTriangle, Ban, BookOpen, ChevronRight, CircleAlert, Database,
  FileText, Gauge, HardDrive, Import, Layers3, ListVideo, RefreshCw, Server,
  Settings, ShieldCheck, Sparkles, Tag, Users,
} from "lucide-react";
import type { AdminDashboardData, AdminMetric, AdminTone } from "@/types/admin";

type AdminPageProps = { data: AdminDashboardData; isDemo: boolean };

const tones: Record<AdminTone, string> = {
  violet: "#a855f7", blue: "#3b82f6", green: "#34d399", red: "#f43f5e",
  amber: "#f59e0b", cyan: "#22d3ee", pink: "#ec4899",
};
const metricIcons = { users: Users, catalog: BookOpen, sync: RefreshCw, error: AlertTriangle, server: Server } as const;
const alertIcons = { warning: AlertTriangle, error: CircleAlert, info: Gauge } as const;

function chartCoordinates(values: number[], width = 220, height = 44) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  return values.map((value, index) => ({
    value,
    x: (index / (values.length - 1)) * width,
    y: height - ((value - min) / Math.max(1, max - min)) * (height - 5),
  }));
}

function points(values: number[], width = 220, height = 44) {
  return chartCoordinates(values, width, height).map(({ x, y }) => `${x},${y}`).join(" ");
}

function ChartPoints({
  values,
  label,
  suffix = "",
  width = 520,
  height = 145,
  className,
}: {
  values: number[];
  label: string;
  suffix?: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  return chartCoordinates(values, width, height).map(({ value, x, y }, index) => (
    <circle className={className} cx={x} cy={y} key={`${label}-${index}`} r="3.2">
      <title>{`${label}: ${value}${suffix}`}</title>
    </circle>
  ));
}

function ChartHoverPoints({
  values,
  label,
  suffix = "",
  tone,
}: {
  values: number[];
  label: string;
  suffix?: string;
  tone: string;
}) {
  return (
    <span className="admin-hover-points" style={{ "--chart-point-tone": tone } as CSSProperties}>
      {chartCoordinates(values, 100, 100).map(({ value, x, y }, index) => (
        <button
          aria-label={`${label}: ${value}${suffix}`}
          key={`${label}-tooltip-${index}`}
          style={{ left: `${x}%`, top: `${y}%` }}
          type="button"
        >
          <span>{`${label}: ${value}${suffix}`}</span>
        </button>
      ))}
    </span>
  );
}

function AdminPanelHeading({ title, action = "Ver todos" }: { title: string; action?: string }) {
  return <header className="admin-panel-heading"><h2>{title}</h2>{action && <button type="button">{action}<ChevronRight size={12} /></button>}</header>;
}

function MetricCard({ metric }: { metric: AdminMetric }) {
  const Icon = metricIcons[metric.icon];
  return (
    <article className="admin-metric panel" style={{ "--admin-tone": tones[metric.tone] } as CSSProperties}>
      <div className="admin-metric-main"><span><Icon size={22} /></span><div><small>{metric.label}</small><strong>{metric.value}</strong><em className={metric.direction === "down" ? "is-down" : ""}>{metric.direction === "up" ? "↑" : "↓"} {metric.change}</em><p>{metric.comparison}</p></div></div>
      <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 220 44"><polyline points={points(metric.sparkline)} /></svg>
    </article>
  );
}

function ChartPanel({ children, title, range, onRange }: { children: ReactNode; title: string; range?: string; onRange?: (value: string) => void }) {
  return <section className="panel admin-chart-panel"><header><h2>{title}</h2>{range && onRange && <select aria-label={`Rango para ${title}`} onChange={(event) => onRange(event.target.value)} value={range}><option value="30">30 días</option><option value="7">7 días</option><option value="90">90 días</option></select>}</header>{children}</section>;
}

export function AdminPage({ data, isDemo }: AdminPageProps) {
  const [range, setRange] = useState("30");
  const [lastUpdate, setLastUpdate] = useState("hace 2 min");
  const [actionMessage, setActionMessage] = useState("");

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div><span><ShieldCheck size={25} /></span><div><h1>Panel de Administración</h1><p>Supervisa y administra toda la plataforma AniSuba desde aquí.</p></div></div>
        <button onClick={() => setLastUpdate("ahora")} type="button">{isDemo && <Sparkles size={12} />}Última actualización: {lastUpdate}<RefreshCw size={13} /></button>
      </header>

      <section className="admin-metrics" aria-label="Métricas de administración">{data.metrics.map((metric) => <MetricCard key={metric.id} metric={metric} />)}</section>

      <div className="admin-table-grid">
        <section className="panel admin-users-panel">
          <AdminPanelHeading title="Usuarios recientes" />
          <div className="admin-table-wrap"><table><thead><tr><th>Usuario</th><th>Registrado</th><th>Última actividad</th><th>País</th><th>Rol</th></tr></thead><tbody>{data.recentUsers.map((user) => <tr key={user.id}><td><Image alt="" height={28} src={user.avatarUrl} width={28} /><span><strong>{user.name}</strong><small>{user.email}</small></span></td><td>{user.registered}</td><td>{user.activity}</td><td>{user.country}</td><td><em className={user.role === "Moderador" ? "is-moderator" : ""}>{user.role}</em></td></tr>)}</tbody></table></div>
        </section>
        <section className="panel admin-alerts-panel">
          <AdminPanelHeading title="Alertas de calidad de datos" />
          <div className="admin-table-wrap"><table><thead><tr><th>Tipo</th><th>Descripción</th><th>Afectados</th><th>Detectado</th></tr></thead><tbody>{data.alerts.map((alert) => { const Icon = alertIcons[alert.severity]; return <tr key={alert.id}><td><span className={`admin-severity is-${alert.severity}`}><Icon size={13} /></span><strong>{alert.type}</strong></td><td>{alert.description}</td><td>{alert.affected}</td><td>{alert.detected}</td></tr>; })}</tbody></table></div>
          <button className="admin-table-footer" type="button">Ver todas las alertas <ChevronRight size={13} /></button>
        </section>
        <section className="panel admin-sync-panel">
          <AdminPanelHeading title="Estado de sincronizaciones" />
          <div className="admin-table-wrap"><table><thead><tr><th>Job</th><th>Fuente</th><th>Estado</th><th>Última ejecución</th></tr></thead><tbody>{data.syncJobs.map((job) => <tr key={job.id}><td><RefreshCw size={12} />{job.job}</td><td>{job.source}</td><td><em data-status={job.status}>{job.status}</em></td><td>{job.execution}</td></tr>)}</tbody></table></div>
          <button className="admin-table-footer" type="button">Ver todos los jobs <ChevronRight size={13} /></button>
        </section>
      </div>

      <div className="admin-analytics-grid">
        <ChartPanel onRange={setRange} range={range} title="Crecimiento de usuarios">
          <div className="admin-chart-summary"><span>Total de usuarios<strong>24,812</strong></span><em>↑ 12.4% <small>vs. 30 días anteriores</small></em></div>
          <div className="admin-line-chart">
            <span className="admin-axis admin-axis-left"><i>30K</i><i>24K</i><i>18K</i><i>12K</i><i>6K</i><i>0</i></span>
            <svg aria-label="Gráfico de crecimiento de usuarios. Pasa el cursor por los puntos para ver sus valores." preserveAspectRatio="none" viewBox="0 0 520 150">
              <defs><linearGradient id="adminArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#a855f7" stopOpacity=".35"/><stop offset="1" stopColor="#a855f7" stopOpacity="0"/></linearGradient></defs>
              <polygon fill="url(#adminArea)" points={`0,150 ${points(data.userGrowth,520,145)} 520,150`} />
              <polyline points={points(data.userGrowth,520,145)} />
              <g className="admin-chart-points"><ChartPoints label="Usuarios" values={data.userGrowth} /></g>
            </svg>
            <ChartHoverPoints label="Usuarios" tone="#a855f7" values={data.userGrowth} />
            <div className="admin-chart-dates"><span>20 Abr</span><span>27 Abr</span><span>4 May</span><span>11 May</span><span>18 May</span></div>
          </div>
        </ChartPanel>
        <ChartPanel title="Actividad del sistema (30 días)">
          <div className="admin-system-summary"><span>Requests<strong>2.4M</strong></span><span>Tiempo de respuesta<strong>182 ms</strong></span><span>Errores<strong>0.42%</strong></span><span>Uptime<strong>98.2%</strong></span></div>
          <div className="admin-chart-legend"><span><i />Requests</span><span><i />Errores (%)</span></div>
          <div className="admin-line-chart is-dual">
            <span className="admin-axis admin-axis-left"><i>3M</i><i>2.4M</i><i>1.8M</i><i>1.2M</i><i>600K</i><i>0</i></span>
            <span className="admin-axis admin-axis-right"><i>1.0%</i><i>0.8%</i><i>0.6%</i><i>0.4%</i><i>0.2%</i><i>0%</i></span>
            <svg aria-label="Gráfico de requests y porcentaje de errores. Pasa el cursor por los puntos para ver sus valores." preserveAspectRatio="none" viewBox="0 0 520 150">
              <polyline className="requests" points={points(data.requests,520,145)} />
              <polyline className="errors" points={points(data.errors,520,145)} />
              <g className="admin-chart-points is-requests"><ChartPoints label="Requests" values={data.requests} /></g>
              <g className="admin-chart-points is-errors"><ChartPoints label="Errores" suffix="%" values={data.errors} /></g>
            </svg>
            <ChartHoverPoints label="Requests" tone="#a855f7" values={data.requests} />
            <ChartHoverPoints label="Errores" suffix="%" tone="#f43f5e" values={data.errors} />
            <div className="admin-chart-dates"><span>20 Abr</span><span>27 Abr</span><span>4 May</span><span>11 May</span><span>18 May</span></div>
          </div>
        </ChartPanel>
        <section className="panel admin-health-panel">
          <AdminPanelHeading action="Últimos 30 días" title="Salud de integraciones API" />
          <div className="admin-table-wrap"><table><thead><tr><th>API</th><th>Estado</th><th>Uptime (30d)</th><th>Avg. latencia</th></tr></thead><tbody>{data.apiHealth.map((api) => <tr key={api.name}><td>{api.name}</td><td><em data-health={api.status}>{api.status}</em></td><td>{api.uptime}</td><td>{api.latency}</td></tr>)}</tbody></table></div>
        </section>
      </div>

      <div className="admin-bottom-grid">
        <section className="panel admin-quick-panel">
          <AdminPanelHeading action="" title="Accesos rápidos de catálogo" />
          <div>{[
            { icon: Layers3, title: "Gestionar animes", detail: "3,482 en catálogo", tone: "violet" }, { icon: ListVideo, title: "Gestionar episodios", detail: "87,231 episodios", tone: "blue" },
            { icon: Tag, title: "Géneros y tags", detail: "156 géneros", tone: "cyan" }, { icon: Database, title: "Estudios", detail: "512 estudios", tone: "green" },
            { icon: HardDrive, title: "Fuentes", detail: "38 fuentes", tone: "amber" }, { icon: Import, title: "Importar anime", detail: "Desde APIs", tone: "pink" },
          ].map((item) => { const Icon = item.icon; return <button key={item.title} onClick={() => setActionMessage(item.title)} style={{ "--admin-tone": tones[item.tone as AdminTone] } as CSSProperties} type="button"><span><Icon size={22} /></span><strong>{item.title}</strong><small>{item.detail}</small></button>; })}</div>
        </section>
        <section className="panel admin-actions-panel">
          <AdminPanelHeading action="" title="Acciones de administración" />
          <div>{[
            { icon: Users, title: "Usuarios", detail: "Gestionar cuentas", tone: "violet" }, { icon: FileText, title: "Reportes", detail: "Revisar reportes", tone: "pink" },
            { icon: Ban, title: "Baneo/IP", detail: "Gestionar bloqueos", tone: "red" }, { icon: Activity, title: "Logs del sistema", detail: "Ver registros", tone: "green" },
            { icon: Settings, title: "Configuración", detail: "Ajustes globales", tone: "blue" }, { icon: HardDrive, title: "Backups", detail: "Gestionar copias", tone: "red" },
          ].map((item) => { const Icon = item.icon; return <button key={item.title} onClick={() => setActionMessage(item.title)} style={{ "--admin-tone": tones[item.tone as AdminTone] } as CSSProperties} type="button"><Icon size={17} /><span><strong>{item.title}</strong><small>{item.detail}</small></span></button>; })}</div>
        </section>
      </div>
      {actionMessage && <aside className="admin-demo-toast" role="status"><Sparkles size={14} />Vista demo: {actionMessage}<button aria-label="Cerrar mensaje" onClick={() => setActionMessage("")} type="button">×</button></aside>}
    </div>
  );
}
