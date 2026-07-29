import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bookmark,
  Check,
  ChevronRight,
  Clock3,
  Database,
  Eye,
  Heart,
  Library,
  PieChart,
  Play,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AnimeCard, DashboardData, DashboardMetric } from "@/types/dashboard";
import { EpisodeTrend, StatusDonut } from "@/components/dashboard/dashboard-charts";

const metricIcons = [Library, Play, Check, Eye, Clock3];

function SectionHeading({
  title,
  eyebrow,
  action,
  icon: Icon,
}: {
  title: string;
  eyebrow?: string;
  action?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="section-heading">
      <div>
        {Icon && <Icon className="section-heading-icon" size={15} aria-hidden="true" />}
        {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {action && <Link href="#todos">{action}<ChevronRight size={14} /></Link>}
    </div>
  );
}

function MetricCard({ metric, index }: { metric: DashboardMetric; index: number }) {
  const Icon = metricIcons[index] ?? Sparkles;
  return (
    <article className={`metric-card micro-lift tone-${metric.tone}`}>
      <span className="metric-icon"><Icon size={18} strokeWidth={2} /></span>
      <span className="metric-copy"><small>{metric.label}</small><strong>{metric.value}</strong><em>{metric.change}</em></span>
    </article>
  );
}

function AnimeCover({ anime, className = "" }: { anime: AnimeCard; className?: string }) {
  return (
    <div className={`anime-cover ${className}`} style={{ "--anime-accent": anime.accent } as React.CSSProperties}>
      <Image
        src={anime.coverUrl}
        alt={`Portada de ${anime.title}`}
        fill
        quality={92}
        sizes="(max-width: 680px) 56px, 132px"
      />
    </div>
  );
}

function AnimeProgress({ anime }: { anime: AnimeCard }) {
  return (
    <span className="anime-progress-track" style={{ "--anime-accent": anime.accent } as React.CSSProperties}>
      <span style={{ width: `${anime.progress}%` }} />
    </span>
  );
}

function WatchingCard({ anime }: { anime: AnimeCard }) {
  return (
    <article className="watching-card micro-lift">
      <AnimeCover anime={anime} />
      <div className="watching-card-copy">
        <h3>{anime.title}</h3>
        <p>{anime.subtitle}</p>
        <div className="progress-row">
          <AnimeProgress anime={anime} />
          <strong>{anime.progress}%</strong>
        </div>
      </div>
      <span className="status-badge">Viendo</span>
    </article>
  );
}

function ActivityItem({ item }: { item: DashboardData["recentActivity"][number] }) {
  const activityIcons = { violet: Play, blue: BookOpen, green: Check, amber: Star };
  const Icon = activityIcons[item.tone];
  return (
    <li className={`activity-item micro-row activity-${item.tone}`}>
      <span className="activity-icon"><Icon size={14} /></span>
      <span><strong>{item.action}</strong><small>{item.title}</small></span>
      <time>{item.time}</time>
    </li>
  );
}

function EmptyState({ title, text, compact = false }: { title: string; text: string; compact?: boolean }) {
  return (
    <div className={`dashboard-empty ${compact ? "is-compact" : ""}`}>
      <span><Sparkles size={17} /></span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

export function Dashboard({ data, isDemo = false }: { data: DashboardData; isDemo?: boolean }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const currentDate = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" }).format(now);

  return (
    <div className="dashboard-page">
      <header className="dashboard-welcome">
        <div>
          <p>{currentDate}</p>
          <h1>¡{greeting}, {data.user.name}! <span aria-hidden="true">👋</span></h1>
          <span>Aquí tienes un resumen de tu universo anime.</span>
        </div>
        <div className="dashboard-welcome-actions">
          {isDemo && (
            <div className="demo-data-pill" aria-label="Datos de demostración">
              <Database size={14} />
              <strong>Modo demo</strong>
              <span>Datos de demostración</span>
            </div>
          )}
          <div className="streak-pill"><TrendingUp size={15} /><strong>0 días</strong><span>de racha</span></div>
        </div>
      </header>

      <div className="dashboard-upper-grid">
        <section className="featured-section">
          <article className={`featured-card ${data.featured ? "" : "featured-card-empty"}`}>
            {data.featured ? (
              <>
                <Image
                  className="featured-banner"
                  src={data.featured.bannerUrl}
                  alt=""
                  fill
                  priority
                  quality={92}
                  sizes="(max-width: 900px) 100vw, 70vw"
                />
                <div className="featured-overlay" />
                <div className="featured-card-heading"><SectionHeading title="Continúa viendo" icon={Bookmark} /></div>
                <div className="featured-layout">
                  <AnimeCover anime={data.featured} className="featured-poster" />
                  <div className="featured-copy">
                    <h2>{data.featured.title}</h2>
                    <p>{data.featured.subtitle}</p>
                    <div className="featured-episode"><span>Episodio actual</span><strong>{data.featured.episode} de {data.featured.episodes}</strong></div>
                    <div className="featured-progress"><span><span style={{ width: `${data.featured.progress}%` }} /></span><strong>{data.featured.progress}%</strong></div>
                    <div className="featured-actions">
                      <button type="button"><Play size={14} fill="currentColor" />Ver siguiente episodio</button>
                      <Link href={data.featured.sourceUrl.startsWith("/") ? data.featured.sourceUrl : "/anime/eclipse-del-vacio"}>Ver detalle<ArrowRight size={14} /></Link>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="featured-card-heading"><SectionHeading title="Continúa viendo" icon={Bookmark} /></div>
                <EmptyState title="Tu próxima aventura empieza aquí" text="Agrega un anime a tu biblioteca para comenzar a registrar tu progreso." />
              </>
            )}
          </article>
        </section>

        <aside className="following-panel panel">
          <SectionHeading title={`Siguiendo (${data.following.length})`} action="Ver todos" icon={Heart} />
          <div className="following-list">
            {data.following.length ? data.following.map((anime) => (
              <div className="following-item micro-lift" key={anime.id}>
                <AnimeCover anime={anime} />
                <span>
                  <strong>{anime.title}</strong>
                  <small>{anime.subtitle}</small>
                  <AnimeProgress anime={anime} />
                </span>
                <em>{anime.progress}%</em>
              </div>
            )) : <EmptyState compact title="Aún no sigues ningún anime" text="Tus series activas aparecerán aquí." />}
          </div>
        </aside>
      </div>

      <section className="metrics-grid" aria-label="Resumen de estadísticas">
        {data.metrics.map((metric, index) => <MetricCard key={metric.label} metric={metric} index={index} />)}
      </section>

      <div className="dashboard-middle-grid">
        <section className="panel watching-panel">
          <SectionHeading title="Viendo actualmente" action="Ver todos" icon={Play} />
          <div className="watching-list">{data.watching.length ? data.watching.map((anime) => <WatchingCard key={anime.id} anime={anime} />) : <EmptyState compact title="Nada en reproducción" text="Cuando comiences un anime, verás aquí su progreso." />}</div>
        </section>

        <section className="panel activity-panel">
          <SectionHeading title="Última actividad" action="Ver todo" icon={Sparkles} />
          {data.recentActivity.length ? <ul>{data.recentActivity.map((item) => <ActivityItem key={item.id} item={item} />)}</ul> : <EmptyState compact title="Sin actividad todavía" text="Tus avances y calificaciones aparecerán aquí." />}
        </section>

        <section className="panel next-panel">
          <SectionHeading title="Próximos episodios" action="Ver todos" icon={Clock3} />
          <div className="upcoming-list">
            {data.upcoming.length ? data.upcoming.map((item) => (
              <article className="next-anime micro-row" key={item.id}>
                <AnimeCover anime={item.anime} />
                <span className="next-anime-copy">
                  <strong>{item.anime.title} - {item.episodeLabel}</strong>
                  <small>{item.releaseLabel}</small>
                </span>
                <span className="release-meta">
                  <i style={{ background: item.indicatorColor }} />
                  <time>{item.releaseDate}</time>
                </span>
              </article>
            )) : <EmptyState compact title="Sin estrenos pendientes" text="Sigue una serie para ver sus próximos episodios." />}
          </div>
        </section>
      </div>

      <div className="dashboard-analytics-grid">
        <section className="panel chart-panel">
          <SectionHeading title="Distribución por estado" icon={PieChart} />
          <StatusDonut data={data.statusDistribution} />
        </section>
        <section className="panel chart-panel wide-chart-panel">
          <div className="section-heading"><div><BarChart3 className="section-heading-icon" size={15} /><h2>Episodios vistos</h2><span className="chart-subtitle">Últimos 30 días</span></div><button className="chart-period" type="button">30 días<ChevronRight size={13} className="rotate-90" /></button></div>
          <EpisodeTrend data={data.episodeTrend} />
        </section>
        <section className="panel genre-panel">
          <SectionHeading title="Géneros más vistos" icon={Heart} />
          <ul>
            {data.genres.length ? data.genres.map((genre) => (
              <li key={genre.name}><span>{genre.name}</span><span className="genre-track"><span style={{ width: `${Math.min(100, genre.value * 3)}%`, background: genre.color }} /></span><strong>{genre.value}%</strong></li>
            )) : <li className="genre-empty">Tus géneros favoritos aparecerán al registrar actividad.</li>}
          </ul>
          {data.genres.length > 0 && <div className="genre-insight"><Heart size={14} /><span>Tu género favorito sigue siendo <strong>{data.genres[0].name}</strong></span></div>}
        </section>
      </div>
    </div>
  );
}
