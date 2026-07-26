"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  Clock3,
  Eye,
  Flame,
  Heart,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import { PanelHeading } from "@/components/ui/panel-heading";
import type { HistoryActivityType, HistoryData, HistoryEvent } from "@/types/history";

type HistoryPageProps = { data: HistoryData; isDemo: boolean };
type HistoryFilter = "all" | HistoryActivityType;
const timelineTones = ["#8b5cf6", "#34d399", "#3b82f6", "#ec4899", "#f59e0b", "#22d3ee"];

const activityConfig = {
  added: { label: "Agregados", icon: Plus, color: "#34d399" },
  progress: { label: "Progreso", icon: BarChart3, color: "#3b82f6" },
  rating: { label: "Puntuaciones", icon: Star, color: "#fbbf24" },
  favorite: { label: "Favoritos", icon: Heart, color: "#ec4899" },
  comment: { label: "Comentarios", icon: MessageSquare, color: "#22d3ee" },
  status: { label: "Estados", icon: Eye, color: "#f59e0b" },
} satisfies Record<HistoryActivityType, { label: string; icon: typeof Plus; color: string }>;

function HistoryEventRow({ event, timelineTone }: { event: HistoryEvent; timelineTone: string }) {
  const config = activityConfig[event.type];
  const Icon = config.icon;
  return (
    <article className="history-event micro-row" style={{ "--history-tone": config.color, "--timeline-tone": timelineTone } as React.CSSProperties}>
      <time dateTime={`${event.date}T${event.time}`}>{event.time}</time>
      <span className="history-event-icon" style={{ "--history-tone": config.color } as React.CSSProperties}><Icon size={14} /></span>
      <Image alt="" height={39} src={event.coverUrl} width={32} />
      <span className="history-event-copy"><strong>{event.title}</strong><small>{event.description}</small></span>
      {event.progress !== undefined && <span className="history-event-progress"><strong>{event.progress}%</strong><span><span style={{ width: `${event.progress}%` }} /></span></span>}
      {event.rating !== undefined && <span className="history-event-rating">{Array.from({ length: 5 }, (_, index) => <Star fill={index < Math.round(event.rating! / 2) ? "currentColor" : "none"} key={index} size={14} />)}</span>}
      {event.status && <span className="history-event-status">{event.status}</span>}
      <button type="button">Ver anime <ChevronRight size={13} /></button>
    </article>
  );
}

export function HistoryPage({ data, isDemo }: HistoryPageProps) {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("30");
  const [activeSummary, setActiveSummary] = useState<number | null>(null);
  const filteredEvents = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return data.events.filter((event) => filter === "all" || event.type === filter)
      .filter((event) => !normalized || `${event.title} ${event.description}`.toLocaleLowerCase("es").includes(normalized));
  }, [data.events, filter, query]);
  const groups = useMemo(() => Array.from(new Map(filteredEvents.map((event) => [event.date, { date: event.date, label: event.dateLabel }])).values()), [filteredEvents]);
  const donutGradient = data.summary.length ? `conic-gradient(${data.summary.map((item, index) => {
    const start = data.summary.slice(0, index).reduce((sum, entry) => sum + entry.percentage, 0);
    const color = activeSummary === null || activeSummary === index ? item.color : `${item.color}35`;
    return `${color} ${start}% ${start + item.percentage}%`;
  }).join(",")})` : "conic-gradient(#252c40 0 100%)";
  const weekLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="history-page">
      <header className="history-header">
        <div><span><Clock3 size={29} /></span><div><h1>Historial</h1><p>Explora tu actividad reciente y todo lo que has hecho en AniSuba.</p></div></div>
        {isDemo && <div className="demo-data-pill"><Sparkles size={14} /><strong>Modo demo</strong><span>Actividad de muestra</span></div>}
      </header>

      <div className="history-layout">
        <main className="history-main">
          <section className="history-overview">
            <article className="panel history-kpi micro-lift tone-violet"><span><TrendingUp size={22} /></span><div><small>Actividades esta semana</small><strong>{data.weekActivities}</strong><em>▲ {data.weekChange}% <span>vs. semana pasada</span></em></div></article>
            <article className="panel history-kpi micro-lift tone-blue"><span><CalendarDays size={22} /></span><div><small>Actividades este mes</small><strong>{data.monthActivities}</strong><em>▲ {data.monthChange}% <span>vs. mes pasado</span></em></div></article>
            <label className="history-range"><CalendarDays size={16} /><span><small>Rango de fechas</small><select aria-label="Rango de fechas" onChange={(event) => setRange(event.target.value)} value={range}><option value="30">Últimos 30 días</option><option value="7">Últimos 7 días</option><option value="90">Últimos 90 días</option></select></span></label>
          </section>

          <section className="history-tabs panel" aria-label="Tipos de actividad">
            <button className={filter === "all" ? "is-active" : undefined} onClick={() => setFilter("all")} style={{ "--history-tone": "#a855f7" } as React.CSSProperties} type="button"><Sparkles size={13} />Todos</button>
            {(Object.entries(activityConfig) as [HistoryActivityType, typeof activityConfig.added][]).map(([type, config]) => {
              const Icon = config.icon;
              return <button className={filter === type ? "is-active" : undefined} key={type} onClick={() => setFilter(type)} style={{ "--history-tone": config.color } as React.CSSProperties} type="button"><Icon size={13} />{config.label}</button>;
            })}
          </section>

          {groups.length ? (
            <div className="history-timeline">
              {groups.map((group, groupIndex) => {
                const events = filteredEvents.filter((event) => event.date === group.date);
                const timelineTone = timelineTones[groupIndex % timelineTones.length];
                return (
                  <section className="history-day panel" key={group.date} style={{ "--timeline-tone": timelineTone } as React.CSSProperties}>
                    <header><h2>{group.label}</h2><span>{events.length} actividades</span></header>
                    <div>{events.map((event) => <HistoryEventRow event={event} key={event.id} timelineTone={timelineTone} />)}</div>
                  </section>
                );
              })}
            </div>
          ) : (
            <section className="history-empty panel"><span><Clock3 size={23} /></span><h2>{data.events.length ? "No encontramos actividad" : "Tu historial está vacío"}</h2><p>{data.events.length ? "Prueba otro tipo de actividad o una búsqueda distinta." : "Tus avances, favoritos, comentarios y puntuaciones aparecerán aquí."}</p></section>
          )}
        </main>

        <aside className="history-sidebar">
          <label className="history-search"><Search size={15} /><input aria-label="Buscar en el historial" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en el historial..." value={query} /></label>
          <section className="panel history-summary-panel">
            <PanelHeading icon={BarChart3} title="Resumen de actividad" tone="#a855f7" /><p>Por tipo de actividad (este mes)</p>
            <div className="history-summary-content">
              <div className={activeSummary === null ? "history-donut" : "history-donut is-highlighted"} style={{ background: donutGradient }}><span><strong>{activeSummary === null ? data.monthActivities : data.summary[activeSummary]?.value}</strong><small>{activeSummary === null ? "Total" : data.summary[activeSummary]?.label}</small></span></div>
              <ul>{data.summary.map((item, index) => <li className={activeSummary === index ? "is-active" : undefined} key={item.type}><button onBlur={() => setActiveSummary(null)} onFocus={() => setActiveSummary(index)} onMouseEnter={() => setActiveSummary(index)} onMouseLeave={() => setActiveSummary(null)} type="button"><i style={{ background: item.color }} /><span>{item.label}</span><strong>{item.value} ({item.percentage}%)</strong></button></li>)}</ul>
            </div>
          </section>
          <section className="panel history-hours-panel">
            <PanelHeading icon={Clock3} meta={`${data.hourlyActivity.reduce((sum, value) => sum + value, 0)} actividades`} title="Últimas 24 horas" tone="#3b82f6" />
            <div className="history-hour-bars">{data.hourlyActivity.map((value, index) => <span key={index}><span style={{ height: `${Math.max(5, value * 15)}%` }} /></span>)}</div>
            <div className="history-hour-axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
          </section>
          <section className="panel history-streak-panel">
            <PanelHeading icon={Flame} title="Racha de seguimiento" tone="#f97316" /><div><Flame size={22} /><strong>{data.streakDays} <span>días</span></strong><em>¡Sigue así!</em></div>
            <ul>{weekLabels.map((label, index) => <li key={label}><span className={data.streakWeek[index] ? "is-complete" : undefined}>{data.streakWeek[index] ? "✓" : ""}</span><small>{label}</small></li>)}</ul>
          </section>
          <section className="panel history-highlight-panel"><PanelHeading icon={Target} title="Actividad destacada" tone="#ec4899" /><div><Star size={16} /><span><small>Día más activo</small><strong>{data.highlightDate}</strong></span><em>{data.highlightCount} actividades</em></div></section>
          <button className="history-stats-button" type="button">Ver estadísticas completas <ChevronRight size={13} /></button>
        </aside>
      </div>
    </div>
  );
}
