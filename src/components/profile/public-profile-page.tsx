"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import {
  BadgeCheck, BookOpen, CalendarCheck, CalendarDays, Check, Clock3, Compass,
  Edit3, Eye, Flame, Heart, ListChecks, MapPin, MoreHorizontal, PenLine,
  Play, Sparkles, Star, Trophy, UserRound, UsersRound,
} from "lucide-react";
import { profileDemoData } from "@/data/mock/profile";

const tones = ["#8b5cf6", "#22d3ee", "#ec4899", "#f59e0b", "#3b82f6"];
const genreTones = ["#8b5cf6", "#ec4899", "#3b82f6", "#14b8a6", "#f59e0b", "#64748b"];
const publicTabs = ["Resumen", "Listas", "Actividad", "Animes favoritos", "Logros", "Reseñas", "Amigos"];
const metricIcons = [Eye, Play, Clock3, Star, ListChecks];
const metricValues = [
  ["Animes vistos", "124"], ["Episodios vistos", "2,156"], ["Horas vistas", "2,840"],
  ["Puntuación promedio", "8.7 /10"], ["Listas creadas", "6"],
];
const achievementIcons = [Flame, Compass, PenLine, CalendarCheck, BadgeCheck];
const achievementTones = ["#f97316", "#22d3ee", "#a855f7", "#ec4899", "#f59e0b"];

function DiscordMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M19.5 5.3A16 16 0 0 0 15.6 4l-.5 1.1a14 14 0 0 0-6.2 0L8.4 4a16 16 0 0 0-3.9 1.3C2 9 1.3 12.7 1.7 16.4a16 16 0 0 0 4.8 2.4l1.2-1.7-1.7-.8.4-.3c3.6 1.7 7.6 1.7 11.2 0l.4.3-1.7.8 1.2 1.7a16 16 0 0 0 4.8-2.4c.5-4.3-.8-8-2.8-11.1ZM8.7 14.5c-1 0-1.9-1-1.9-2.2 0-1.2.8-2.2 1.9-2.2s1.9 1 1.9 2.2c0 1.2-.8 2.2-1.9 2.2Zm6.6 0c-1 0-1.9-1-1.9-2.2 0-1.2.8-2.2 1.9-2.2s1.9 1 1.9 2.2c0 1.2-.8 2.2-1.9 2.2Z" fill="currentColor"/></svg>;
}

function YouTubeMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M23 7.1a3 3 0 0 0-2.1-2.2C19 4.4 12 4.4 12 4.4s-7 0-8.9.5A3 3 0 0 0 1 7.1 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.9 3 3 0 0 0 2.1 2.2c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.2 31 31 0 0 0 .5-4.9 31 31 0 0 0-.5-4.9ZM9.7 15.4V8.6L15.8 12l-6.1 3.4Z" fill="currentColor"/></svg>;
}

export function PublicProfilePage() {
  const [activeTab, setActiveTab] = useState("Resumen");
  const [following, setFollowing] = useState(false);
  const data = profileDemoData;

  return (
    <div className="public-profile-page">
      <div className="public-profile-main">
        <section className="public-profile-hero">
          <Image alt="" fill priority sizes="100vw" src="/images/profile-cosmic-hero-v1.png" />
          <div className="public-profile-hero-shade" />
          <div className="public-profile-identity">
            <div><Image alt="Avatar de José Luis" fill sizes="126px" src="/images/profile-avatar-v1.png" /><span>12</span></div>
            <div><h1>José Luis</h1><strong>@joseluis</strong><p>Apasionado por el anime y las buenas historias.<br />Siempre en busca de nuevas aventuras.</p><small><CalendarDays size={13} />Miembro desde mayo 2024 <MapPin size={13} />Perú</small></div>
          </div>
          <div className="public-profile-actions"><button className={following ? "is-active" : undefined} onClick={() => setFollowing((value) => !value)} type="button">{following ? <Check size={14} /> : <UserRound size={14} />}{following ? "Siguiendo" : "Seguir"}</button><Link href="/perfil"><Edit3 size={14} />Editar perfil</Link><button aria-label="Más opciones" type="button"><MoreHorizontal size={17} /></button></div>
        </section>

        <section className="public-profile-metrics">{metricValues.map(([label, value], index) => { const Icon = metricIcons[index]; return <article key={label} style={{ "--public-tone": tones[index] } as CSSProperties}><span><Icon size={17} /></span><div><small>{label}</small><strong>{value}</strong><i><span style={{ width: `${52 + index * 7}%` }} /></i></div></article>; })}</section>

        <nav className="public-profile-tabs" aria-label="Secciones del perfil">{publicTabs.map((tab) => <button aria-current={activeTab === tab ? "page" : undefined} className={activeTab === tab ? "is-active" : undefined} key={tab} onClick={() => setActiveTab(tab)} type="button">{tab}</button>)}</nav>

        {activeTab === "Resumen" ? <div className="public-profile-content">
          <section className="public-profile-panel public-about"><h2><UserRound size={15} />Sobre mí</h2><p>Me encanta el anime desde hace más de 10 años. Disfruto todos los géneros, pero mis favoritos son acción, ciencia ficción y drama. Siempre trato de descubrir joyas ocultas y compartir recomendaciones.</p><a href="https://discord.com" target="_blank" rel="noreferrer"><DiscordMark />joseluis#9873</a><a href="https://youtube.com" target="_blank" rel="noreferrer"><YouTubeMark />youtube.com/@joseluis_anime</a></section>
          <section className="public-profile-panel public-genres"><h2><Sparkles size={15} />Géneros favoritos</h2><div><span className="public-profile-donut" /><ul>{[["Acción","28%"],["Aventura","24%"],["Drama","18%"],["Ciencia ficción","15%"],["Fantasía","9%"],["Otros","6%"]].map(([name,value],index)=><li key={name}><i style={{background:genreTones[index]}} />{name}<strong>{value}</strong></li>)}</ul></div></section>
          <section className="public-profile-panel public-status"><h2><ListChecks size={15} />Distribución por estado</h2><ul>{[["Viendo actualmente","28 (22%)",Play],["Planeo ver","42 (33%)",BookOpen],["Terminado","35 (27%)",Check],["Esperando temporadas","19 (15%)",Heart]].map(([name,value,Icon],index)=><li key={String(name)}><span style={{"--public-tone":tones[index]} as CSSProperties}><Icon size={13}/></span>{String(name)}<strong>{String(value)}</strong></li>)}</ul></section>
          <section className="public-profile-panel public-favorite-strip"><header><h2><Heart size={15} />Animes favoritos</h2><button type="button">Ver todos</button></header><div>{data.favorites.map((anime)=><article key={anime.id}><Image alt={`Portada de ${anime.title}`} height={240} quality={92} sizes="(max-width: 650px) 45vw, 180px" src={anime.coverUrl} width={180}/><strong>{anime.title}</strong><span><Star fill="currentColor" size={10}/>{anime.score.toFixed(1)}</span></article>)}</div></section>
        </div> : <section className="public-profile-panel public-profile-placeholder"><Sparkles size={24}/><h2>{activeTab}</h2><p>Vista pública preparada para mostrar esta sección cuando conectemos la lógica real.</p></section>}
      </div>

      <aside className="public-profile-aside">
        <section><header><h2><Trophy size={15}/>Logros</h2><button type="button">Ver todos</button></header>{data.achievements.slice(0,5).map((achievement,index)=>{const AchievementIcon=achievementIcons[index%achievementIcons.length];const achievementStyle={"--public-tone":achievementTones[index]} as CSSProperties;return <article key={achievement.id} style={achievementStyle}><span className="public-achievement-badge" style={achievementStyle}><AchievementIcon size={18}/></span><div><strong>{achievement.title}</strong><small>{achievement.description}</small></div></article>;})}</section>
        <section><header><h2><Clock3 size={15}/>Actividad reciente</h2><button type="button">Ver toda</button></header>{data.recentActivity.slice(0,4).map((activity)=><article key={activity.id}><Image alt="" height={42} src={activity.coverUrl} width={34}/><div><strong>{activity.title}</strong><small>{activity.timeLabel}</small></div></article>)}</section>
        <section className="public-friends"><header><h2><UsersRound size={15}/>Amigos (12)</h2><button type="button">Ver todos</button></header><div>{data.favorites.slice(0,5).map((anime,index)=><Image alt={`Amigo ${index+1}`} height={35} key={anime.id} src={anime.coverUrl} width={35}/>)}<span>+7</span></div></section>
      </aside>
    </div>
  );
}
