"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import {
  BarChart3,
  Bookmark,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit3,
  Flame,
  Heart,
  Library,
  Medal,
  MessageSquare,
  MoreHorizontal,
  Play,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";
import { PanelHeading } from "@/components/ui/panel-heading";
import type { ProfileAchievement, ProfileData, ProfileTone } from "@/types/profile";

type ProfilePageProps = { data: ProfileData; isDemo: boolean };

const toneColors: Record<ProfileTone, string> = {
  violet: "#a855f7",
  cyan: "#22d3ee",
  green: "#34d399",
  amber: "#f59e0b",
  pink: "#ec4899",
  blue: "#3b82f6",
};

const achievementIcons = {
  flame: Flame,
  trophy: Trophy,
  star: Star,
  clock: Clock3,
  heart: Heart,
  target: Target,
} satisfies Record<ProfileAchievement["icon"], typeof Star>;

const statIcons = {
  hours: Clock3,
  anime: BookOpen,
  episodes: Play,
  genres: Library,
  member: UserRound,
} as const;

const activityIcons = [Play, Bookmark, CheckCircle2, MessageSquare, Star] as const;

function toneStyle(tone: ProfileTone) {
  return { "--profile-tone": toneColors[tone] } as CSSProperties;
}

function ViewAllButton({ label }: { label: string }) {
  return <button className="profile-view-all" type="button">{label}<ChevronRight size={12} /></button>;
}

export function ProfilePage({ data, isDemo }: ProfilePageProps) {
  const [editing, setEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const achievementPercentage = data.achievementProgress.total
    ? Math.round((data.achievementProgress.unlocked / data.achievementProgress.total) * 100)
    : 0;

  return (
    <div className="profile-page">
      <section className="profile-hero panel">
        <video
          aria-hidden="true"
          autoPlay
          className="profile-banner-video"
          loop
          muted
          playsInline
          poster={data.user.bannerUrl}
          preload="metadata"
        >
          <source src="/videos/profile-cosmic-loop.mp4" type="video/mp4" />
        </video>
        <div className="profile-banner-overlay" />

        <div className="profile-identity">
          <div className="profile-avatar-wrap">
            <Image alt={`Avatar de ${data.user.displayName}`} fill sizes="130px" src={data.user.avatarUrl} />
            <span><Edit3 size={13} /></span>
          </div>
          <div className="profile-identity-copy">
            <div className="profile-name-line"><h1>{data.user.displayName}</h1></div>
            <div className="profile-user-line">
              <p className="profile-username">{data.user.username ? `@${data.user.username}` : "@usuario"}</p>
              <span>Nivel {data.user.level}</span>
            </div>
            <p className="profile-bio">{data.user.bio}</p>
          </div>
        </div>

        <div className="profile-actions">
          {isDemo && <span className="profile-demo-label"><Sparkles size={12} />Demo</span>}
          <div>
            <button className={editing ? "is-active" : undefined} onClick={() => setEditing((current) => !current)} type="button"><Edit3 size={14} />{editing ? "Vista previa activa" : "Editar perfil"}</button>
            <button aria-expanded={showMenu} aria-label="Más opciones de perfil" onClick={() => setShowMenu((current) => !current)} type="button"><MoreHorizontal size={16} /></button>
            {showMenu && <div className="profile-action-menu"><Link href="/perfil/publico">Ver perfil público</Link><button type="button">Compartir perfil</button><button type="button">Copiar enlace</button></div>}
          </div>
        </div>

        <div className="profile-hero-footer">
          <div className="profile-favorite-genres">
            <strong>Géneros favoritos</strong>
            <div className="profile-genre-chips">
              {data.user.favoriteGenres.length
                ? data.user.favoriteGenres.map((genre, index) => <span data-tone={index % 5} key={genre}>{genre}</span>)
                : <span>Agrega tus géneros favoritos</span>}
            </div>
          </div>
          <div className="profile-stats" aria-label="Resumen del perfil">
            {data.stats.map((stat) => {
              const Icon = statIcons[stat.id];
              return (
                <article className="profile-stat" key={stat.id} style={toneStyle(stat.tone)}>
                  <span><Icon size={18} /></span>
                  <div><small>{stat.label}</small><strong>{stat.value}</strong></div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <div className="profile-primary-grid">
        <section className="panel profile-favorites-panel">
          <PanelHeading icon={Heart} meta={<ViewAllButton label="Ver todos" />} title="Animes favoritos" tone="#ec4899" />
          {data.favorites.length ? (
            <ol>
              {data.favorites.map((anime) => (
                <li key={anime.id} style={{ "--profile-tone": anime.rank === 1 ? "#fbbf24" : "#a855f7" } as CSSProperties}>
                  <strong>{anime.rank}</strong>
                  <Image alt="" height={48} src={anime.coverUrl} width={38} />
                  <span><b>{anime.title}</b><small>{anime.detail}</small></span>
                  <em><Heart fill="currentColor" size={10} />{anime.score.toFixed(1)}/10</em>
                </li>
              ))}
            </ol>
          ) : <div className="profile-empty-state"><Heart size={22} /><strong>Sin favoritos todavía</strong><span>Tu ranking personal aparecerá aquí.</span></div>}
        </section>

        <section className="panel profile-achievements-panel">
          <PanelHeading icon={Trophy} meta={<ViewAllButton label="Ver todos" />} title="Logros" tone="#f59e0b" />
          {data.achievements.length ? (
            <div className="profile-achievement-grid">
              {data.achievements.map((achievement) => {
                const Icon = achievementIcons[achievement.icon];
                return (
                  <article className={achievement.unlocked ? "is-unlocked" : "is-locked"} key={achievement.id} style={toneStyle(achievement.tone)}>
                    <span><Icon size={21} /></span>
                    <div><strong>{achievement.title}</strong><small>{achievement.description}</small></div>
                  </article>
                );
              })}
            </div>
          ) : <div className="profile-empty-state"><Trophy size={22} /><strong>Tu vitrina está lista</strong><span>Los logros se desbloquearán con tu actividad.</span></div>}
          <div className="profile-achievement-progress">
            <div>
              <strong>Progreso general</strong>
              <span>{data.achievementProgress.unlocked} / {data.achievementProgress.total} logros desbloqueados</span>
            </div>
            <div className="profile-achievement-bar"><span><span style={{ width: `${achievementPercentage}%` }} /></span><strong>{achievementPercentage}%</strong></div>
          </div>
        </section>

        <section className="panel profile-activity-panel">
          <PanelHeading icon={BarChart3} meta={<ViewAllButton label="Ver todos" />} title="Resumen de actividad" tone="#22d3ee" />
          {data.recentActivity.length ? (
            <ul>
              {data.recentActivity.map((activity, index) => {
                const Icon = activityIcons[index % activityIcons.length];
                return (
                  <li key={activity.id} style={toneStyle(activity.tone)}>
                    <span className="profile-activity-icon"><Icon size={15} /></span>
                    <span className="profile-activity-copy"><strong>{activity.title}</strong><small>{activity.detail}</small><time>{activity.timeLabel}</time></span>
                    <Image alt="" height={42} src={activity.coverUrl} width={34} />
                  </li>
                );
              })}
            </ul>
          ) : <div className="profile-empty-state"><BarChart3 size={22} /><strong>Sin actividad todavía</strong><span>Tus avances recientes aparecerán aquí.</span></div>}
          <button className="profile-panel-link" type="button">Ver historial completo <ChevronRight size={13} /></button>
        </section>
      </div>

      <section className="panel profile-library-panel">
        <PanelHeading icon={Library} meta={<ViewAllButton label="Ver todos" />} title="Mi biblioteca actual / Favoritos en curso" tone="#8b5cf6" />
        {data.currentLibrary.length ? (
          <div className="profile-library-grid">
            {data.currentLibrary.map((anime) => (
              <article key={anime.id} style={toneStyle(anime.tone)}>
                <Image alt="" height={70} src={anime.coverUrl} width={54} />
                <div>
                  <strong>{anime.title}</strong>
                  <small>{anime.detail}</small>
                  <div className="profile-library-progress"><span><span style={{ "--progress": `${anime.progress}%` } as CSSProperties} /></span><b>{anime.progress}%</b></div>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="profile-empty-state"><Library size={22} /><strong>Tu biblioteca está vacía</strong><span>Agrega un anime para comenzar a registrar progreso.</span></div>}
      </section>

      {editing && <aside className="profile-edit-note" role="status"><UserRound size={15} /><span>La edición visual está preparada. Los cambios reales de perfil se conectarán al formulario de Supabase.</span><Medal size={15} /></aside>}
    </div>
  );
}
