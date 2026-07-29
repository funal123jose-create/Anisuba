"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Play,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { PanelHeading } from "@/components/ui/panel-heading";
import type { NotificationData, NotificationItem, NotificationType } from "@/types/notifications";

type NotificationsPageProps = {
  data: NotificationData;
  isDemo: boolean;
  onMarkRead?: (key: string) => Promise<{ ok: boolean }>;
  onMarkAllRead?: (keys: string[]) => Promise<{ ok: boolean }>;
  onSaveReminder?: (key: string) => Promise<{ ok: boolean }>;
  onUpdatePreference?: (input: {
    type: "episode" | "season" | "reminder" | "system";
    enabled: boolean;
  }) => Promise<{ ok: boolean }>;
};
type NotificationFilter = "all" | Exclude<NotificationType, "achievement">;

const notificationConfig = {
  episode: { label: "Nuevos episodios", icon: Play, color: "#8b5cf6" },
  season: { label: "Nuevas temporadas", icon: CalendarDays, color: "#3b82f6" },
  reminder: { label: "Recordatorios", icon: Bell, color: "#ec4899" },
  system: { label: "Sistema", icon: ShieldCheck, color: "#f59e0b" },
  achievement: { label: "Logro", icon: Trophy, color: "#a855f7" },
} satisfies Record<NotificationType, { label: string; icon: typeof Bell; color: string }>;

function NotificationRow({
  item,
  isRead,
  reminderSaved,
  onMarkRead,
  onSaveReminder,
}: {
  item: NotificationItem;
  isRead: boolean;
  reminderSaved: boolean;
  onMarkRead: () => void;
  onSaveReminder: () => void;
}) {
  const config = notificationConfig[item.type];
  const Icon = config.icon;

  return (
    <article className={`notification-row ${isRead ? "is-read" : "is-unread"}`} style={{ "--notification-tone": config.color } as React.CSSProperties}>
      <i className="notification-unread-dot" />
      <span className="notification-type-icon"><Icon size={18} /></span>
      <Image alt="" height={76} src={item.imageUrl} width={64} />
      <div className="notification-copy">
        <h2>{item.title}</h2>
        <p>{item.description}</p>
        <span><Icon size={10} />{item.label}</span>
      </div>
      <div className="notification-meta">
        <time>{item.timeLabel}</time>
        {item.action === "view" && <Link className="notification-primary-action" href={item.href ?? "/biblioteca"}>Ver anime</Link>}
        {item.action === "remind" && <button className={reminderSaved ? "notification-secondary-action is-saved" : "notification-secondary-action"} onClick={onSaveReminder} type="button">{reminderSaved ? "Recordatorio guardado" : "Recordarme luego"}</button>}
        <button className="notification-read-action" disabled={isRead} onClick={onMarkRead} type="button">Marcar como leída</button>
      </div>
    </article>
  );
}

export function NotificationsPage({
  data,
  isDemo,
  onMarkRead,
  onMarkAllRead,
  onSaveReminder,
  onUpdatePreference,
}: NotificationsPageProps) {
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [sort, setSort] = useState<"recent" | "oldest">("recent");
  const [readIds, setReadIds] = useState<Record<string, boolean>>({});
  const [savedReminders, setSavedReminders] = useState<Record<string, boolean>>({});
  const [preferences, setPreferences] = useState(() => Object.fromEntries(data.preferences.map((item) => [item.id, item.enabled])));
  const [, startTransition] = useTransition();

  const isRead = (item: NotificationItem) => !item.unread || Boolean(readIds[item.id]);
  const unreadCount = data.items.filter((item) => !isRead(item)).length;
  const visibleItems = useMemo(() => data.items
    .filter((item) => filter === "all" || item.type === filter)
    .toSorted((a, b) => sort === "recent" ? data.items.indexOf(a) - data.items.indexOf(b) : data.items.indexOf(b) - data.items.indexOf(a)), [data.items, filter, sort]);
  const counts = {
    episode: data.items.filter((item) => item.type === "episode").length,
    season: data.items.filter((item) => item.type === "season").length,
    reminder: data.items.filter((item) => item.type === "reminder").length,
    system: data.items.filter((item) => item.type === "system").length,
  };
  const summary = (["episode", "season", "reminder", "system"] as const).map((type) => ({ ...notificationConfig[type], type, value: counts[type] }));

  return (
    <div className="notifications-page">
      <header className="notifications-header">
        <div><h1>Notificaciones</h1><p>Mantente al día con lo que pasa en tu universo anime.</p></div>
        {isDemo && <div className="demo-data-pill"><Sparkles size={14} /><strong>Modo demo</strong><span>Alertas de muestra</span></div>}
      </header>

      <div className="notifications-layout">
        <main className="notifications-main">
          <section className="notification-toolbar" aria-label="Filtros de notificaciones">
            <button className={filter === "all" ? "is-active" : undefined} onClick={() => setFilter("all")} style={{ "--notification-tone": "#8b5cf6" } as React.CSSProperties} type="button">Todas <span>{unreadCount}</span></button>
            {(Object.entries(notificationConfig).filter(([type]) => type !== "achievement") as [Exclude<NotificationType, "achievement">, typeof notificationConfig.episode][]).map(([type, config]) => {
              const Icon = config.icon;
              return <button className={filter === type ? "is-active" : undefined} key={type} onClick={() => setFilter(type)} style={{ "--notification-tone": config.color } as React.CSSProperties} type="button"><Icon size={13} />{config.label}<span>{counts[type]}</span></button>;
            })}
            <label><Clock3 size={13} /><select aria-label="Ordenar notificaciones" onChange={(event) => setSort(event.target.value as "recent" | "oldest")} value={sort}><option value="recent">Más recientes</option><option value="oldest">Más antiguas</option></select></label>
          </section>

          <section className="panel notification-list">
            {visibleItems.length ? visibleItems.map((item) => <NotificationRow isRead={isRead(item)} item={item} key={item.id} onMarkRead={() => {setReadIds((current) => ({ ...current, [item.id]: true }));if(onMarkRead)startTransition(async()=>{await onMarkRead(item.id);});}} onSaveReminder={() => {setSavedReminders((current) => ({ ...current, [item.id]: true }));if(onSaveReminder)startTransition(async()=>{await onSaveReminder(item.id);});}} reminderSaved={Boolean(savedReminders[item.id])} />) : <div className="notifications-empty"><span><Bell size={23} /></span><h2>No hay notificaciones</h2><p>Las novedades de esta categoría aparecerán aquí.</p></div>}
          </section>

          {visibleItems.length > 0 && <nav className="notification-pagination" aria-label="Paginación de notificaciones"><button aria-label="Página anterior" disabled type="button"><ChevronLeft size={14} /></button><button className="is-active" type="button">1</button><button type="button">2</button><button type="button">3</button><button aria-label="Página siguiente" type="button"><ChevronRight size={14} /></button></nav>}
        </main>

        <aside className="notifications-sidebar">
          <section className="panel notification-summary-panel">
            <PanelHeading icon={Bell} title="Resumen de notificaciones" tone="#8b5cf6" />
            <div className="notification-summary-value"><strong>{unreadCount}</strong><span>No leídas</span><small>De {data.totalCount} notificaciones en total</small></div>
            <div className="notification-summary-progress"><span style={{ width: `${data.totalCount ? (unreadCount / data.totalCount) * 100 : 0}%` }} /></div>
            <ul>{summary.map((item) => <li key={item.type}><i style={{ background: item.color }} /><span>{item.label}</span><strong>{item.value}</strong></li>)}</ul>
            <button className="notification-mark-all" onClick={() => {const ids=data.items.map((item)=>item.id);setReadIds(Object.fromEntries(ids.map((id)=>[id,true])));if(onMarkAllRead)startTransition(async()=>{await onMarkAllRead(ids);});}} type="button"><CheckCircle2 size={14} />Marcar todas como leídas</button>
          </section>

          <section className="panel notification-preferences-panel">
            <PanelHeading icon={Settings} title="Preferencias rápidas" tone="#22d3ee" />
            <ul>{data.preferences.map((item) => {
              const enabled = Boolean(preferences[item.id]);
              return <li key={item.id}><span>{item.label}</span><button aria-label={`${enabled ? "Desactivar" : "Activar"} ${item.label}`} aria-pressed={enabled} onClick={() => {setPreferences((current) => ({ ...current, [item.id]: !enabled }));if(onUpdatePreference)startTransition(async()=>{await onUpdatePreference({type:item.id as "episode"|"season"|"reminder"|"system",enabled:!enabled});});}} type="button"><strong>{enabled ? "Activadas" : "Desactivadas"}</strong>{enabled ? <Check size={13} /> : <X size={13} />}</button></li>;
            })}</ul>
            <button className="notification-settings-link" type="button">Ir a configuración <ChevronRight size={14} /></button>
          </section>
        </aside>
      </div>
    </div>
  );
}
