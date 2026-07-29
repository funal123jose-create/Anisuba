"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import {
  AlertTriangle, Bookmark, CalendarDays, Check, CheckCheck, CheckCircle2,
  CirclePause, Clock3, Frown, Heart, History, Info, MessageCircle,
  MoreHorizontal, Play, Save, Star, Trash2, X,
} from "lucide-react";
import type { PersonalAnimeStatus } from "@/types/library";

type AnimeIdentity = {
  title: string;
  alternativeTitle?: string | null;
  coverUrl: string;
  watched: number;
  total: number;
};

const statusOptions: Array<{
  value: PersonalAnimeStatus;
  label: string;
  detail: string;
  icon: typeof Bookmark;
  tone: string;
}> = [
  { value: "plan_to_watch", label: "Planeo ver", detail: "Guardarlo para verlo más adelante.", icon: Bookmark, tone: "#a855f7" },
  { value: "watching", label: "Viendo actualmente", detail: "Seguir registrando episodios en progreso.", icon: Play, tone: "#3b82f6" },
  { value: "caught_up", label: "Al día", detail: "Ya viste todo lo emitido hasta ahora.", icon: CheckCircle2, tone: "#22d3ee" },
  { value: "paused", label: "En pausa", detail: "Pausas temporalmente tu seguimiento.", icon: CirclePause, tone: "#facc15" },
  { value: "completed", label: "Completado", detail: "Terminaste todo el contenido disponible.", icon: CheckCheck, tone: "#22c55e" },
  { value: "waiting_next_season", label: "Esperando nueva temporada", detail: "Completaste lo disponible y esperas continuación.", icon: Clock3, tone: "#f97316" },
  { value: "dropped", label: "Abandonado", detail: "Decidiste no continuar viendo este anime.", icon: X, tone: "#f43f5e" },
];

export function LiveStatusDialog({
  anime, currentStatus, onClose, onSave,
}: {
  anime: AnimeIdentity;
  currentStatus: PersonalAnimeStatus;
  onClose: () => void;
  onSave: (status: PersonalAnimeStatus) => Promise<boolean>;
}) {
  const [draftStatus, setDraftStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const label = statusOptions.find((item) => item.value === currentStatus)?.label ?? currentStatus;

  return <div className="anime-update-overlay" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section aria-labelledby="live-status-title" aria-modal="true" className="anime-update-modal anime-status-drawer" role="dialog">
      <header className="anime-update-header"><div><span><Bookmark size={19}/></span><div><p>ORGANIZACIÓN PERSONAL</p><h2 id="live-status-title">Cambio de estado</h2></div></div><button aria-label="Cerrar cambio de estado" onClick={onClose} type="button"><X size={18}/></button></header>
      <div className="anime-status-body">
        <article className="anime-update-anime"><Image alt={`Portada de ${anime.title}`} height={92} src={anime.coverUrl} width={68}/><div><span>{label.toUpperCase()}</span><h3>{anime.title}</h3><p>Episodio actual: <strong>{anime.watched} de {anime.total || "?"}</strong></p></div><Check size={18}/></article>
        <section className="anime-status-options"><h3>Selecciona el nuevo estado</h3><div>{statusOptions.map(({ value, label: optionLabel, detail, icon: Icon, tone }) => <button aria-pressed={draftStatus === value} className={draftStatus === value ? "is-active" : undefined} key={value} onClick={() => setDraftStatus(value)} style={{ "--status-tone": tone } as CSSProperties} type="button"><span><Icon size={20}/></span><span><strong>{optionLabel}</strong><small>{detail}</small></span>{draftStatus === value && <Check size={14}/>}</button>)}</div></section>
        <section className="anime-status-impact"><Clock3 size={18}/><div><h3>Qué ocurrirá con este cambio</h3><ul><li>Se conservará tu progreso actual.</li><li>El anime aparecerá en la categoría correspondiente.</li><li>Podrás recibir alertas relacionadas con su estado.</li></ul></div></section>
        <section className="anime-status-fields"><label><span>Fecha del cambio</span><input aria-label="Fecha del cambio" defaultValue={new Date().toISOString().slice(0, 10)} type="date"/></label><label><span>Nota rápida <small>(opcional)</small></span><textarea aria-label="Nota del cambio de estado" maxLength={200} onChange={(event) => setNote(event.target.value)} placeholder="Escribe una nota breve..." value={note}/><em>{note.length}/200</em></label></section>
        <p className="anime-update-note"><Info size={14}/>Este cambio actualizará tu biblioteca, historial y estadísticas.</p>
      </div>
      <footer className="anime-update-footer"><button onClick={onClose} type="button">Cancelar</button><button disabled={pending} onClick={async () => { setPending(true); const saved = await onSave(draftStatus); setPending(false); if (saved) onClose(); }} type="button"><Save size={15}/>{pending ? "Guardando..." : "Guardar estado"}</button></footer>
    </section>
  </div>;
}

export function LiveRatingDialog({
  anime, initialScore, averageScore, onClose, onSave,
}: {
  anime: AnimeIdentity;
  initialScore: number;
  averageScore: number | null;
  onClose: () => void;
  onSave: (score: number) => Promise<boolean>;
}) {
  const [score, setScore] = useState(initialScore || 8);
  const [comment, setComment] = useState("");
  const [impressions, setImpressions] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  return <div className="anime-update-overlay" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section aria-labelledby="live-rating-title" aria-modal="true" className="anime-update-modal anime-rating-drawer" role="dialog">
      <header className="anime-update-header"><div><span><Star size={19}/></span><div><p>VALORACIÓN PERSONAL</p><h2 id="live-rating-title">Registro de puntuación</h2></div></div><button aria-label="Cerrar registro de puntuación" onClick={onClose} type="button"><X size={18}/></button></header>
      <div className="anime-rating-body">
        <div className="anime-rating-summary">
          <article className="anime-update-anime"><Image alt={`Portada de ${anime.title}`} height={92} src={anime.coverUrl} width={68}/><div><span>MI BIBLIOTECA</span><h3>{anime.title}</h3><p>Progreso: <strong>{anime.watched} de {anime.total || "?"}</strong></p></div><Check size={18}/></article>
          <article className="anime-rating-stats"><p>Puntuación promedio</p><strong><Star fill="currentColor" size={16}/>{averageScore?.toFixed(1) ?? "N/D"} <small>/ 10</small></strong><p>Tu puntuación actual</p><b>{initialScore ? `${initialScore.toFixed(1)}/10` : "Sin puntuar"}</b><p>Actualización</p><span><CalendarDays size={12}/>{new Date().toLocaleDateString("es-CO")}</span></article>
        </div>
        <section className="anime-rating-panel">
          <header><div><h3>Tu puntuación personal</h3><p>¿Cómo calificarías este anime?</p></div><strong>{score.toFixed(1)} <small>/ 10</small></strong></header>
          <div className="anime-rating-stars">{Array.from({ length: 10 }, (_, index) => { const value = index + 1; return <button aria-label={`Seleccionar puntuación ${value}`} aria-pressed={score === value} key={value} onClick={() => setScore(value)} type="button"><Star fill={score >= value ? "currentColor" : "none"} size={31}/></button>; })}</div>
          <div className="anime-rating-track" style={{ "--rating-progress": `${((score - 1) / 9) * 90}%` } as CSSProperties}>{Array.from({ length: 10 }, (_, index) => { const value = index + 1; return <button aria-label={`Seleccionar puntuación ${value} en escala`} aria-pressed={score === value} className={score === value ? "is-active" : score > value ? "is-complete" : undefined} key={value} onClick={() => setScore(value)} type="button"><i/>{value}</button>; })}</div>
          <div className="anime-rating-impressions"><h4>Impresiones rápidas <small>(opcional)</small></h4><div>{["Historia", "Animación", "Personajes", "Banda sonora"].map((item) => <button aria-pressed={impressions.includes(item)} className={impressions.includes(item) ? "is-active" : undefined} key={item} onClick={() => setImpressions((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])} type="button"><Check size={12}/>{item}</button>)}</div></div>
          <label className="anime-rating-comment"><span>¿Por qué le das esta puntuación? <small>(opcional)</small></span><textarea aria-label="Motivo de la puntuación" maxLength={500} onChange={(event) => setComment(event.target.value)} value={comment}/><em>{comment.length}/500</em></label>
        </section>
      </div>
      <footer className="anime-update-footer"><button onClick={onClose} type="button">Cancelar</button><button disabled={pending} onClick={async () => { setPending(true); const saved = await onSave(score); setPending(false); if (saved) onClose(); }} type="button"><Save size={15}/>{pending ? "Guardando..." : "Guardar puntuación"}</button></footer>
    </section>
  </div>;
}

export function LiveAbandonDialog({
  anime, onClose, onConfirm,
}: {
  anime: AnimeIdentity;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
}) {
  const [reason, setReason] = useState("No me gustó");
  const [pending, setPending] = useState(false);
  const progress = anime.total ? Math.round(anime.watched / anime.total * 100) : 0;
  return <div className="anime-confirm-overlay"><section aria-labelledby="live-abandon-title" aria-modal="true" className="anime-confirm-modal is-abandon" role="dialog">
    <header><h2 id="live-abandon-title">¿Abandonar este anime?</h2><button aria-label="Cerrar confirmación de abandono" onClick={onClose} type="button"><X size={18}/></button></header>
    <article className="anime-confirm-title"><Image alt={`Portada de ${anime.title}`} height={112} src={anime.coverUrl} width={82}/><div><h3>{anime.title}</h3><span>Viendo actualmente</span><p>Episodio actual: <strong>{anime.watched} de {anime.total || "?"}</strong></p></div><div><small>Progreso actual</small><strong>{progress}%</strong><i><span style={{ width: `${progress}%` }}/></i></div></article>
    <section className="anime-confirm-warning"><AlertTriangle size={24}/><div><h3>Este anime será marcado como <b>Abandonado</b></h3><p>Tu progreso, historial, puntuación y notas se conservarán para que puedas retomarlo en el futuro.</p></div></section>
    <fieldset><legend>¿Por qué decides abandonarlo? <small>(opcional)</small></legend><div>{[["No me gustó", Frown], ["Lo pausé demasiado", Clock3], ["Otro motivo", MoreHorizontal]].map(([value, Icon]) => <button aria-pressed={reason === value} className={reason === value ? "is-active" : undefined} key={String(value)} onClick={() => setReason(String(value))} type="button"><Icon size={18}/>{String(value)}</button>)}</div></fieldset>
    <label>Nota adicional <small>(opcional)</small><textarea maxLength={200} placeholder="Cuéntanos brevemente el motivo..."/></label>
    <p className="anime-confirm-note"><Info size={15}/>Podrás encontrar este anime en la sección <b>Abandonado</b> y retomarlo cuando quieras.</p>
    <footer><button onClick={onClose} type="button"><X size={15}/>Cancelar</button><button disabled={pending} onClick={async () => { setPending(true); const saved = await onConfirm(); setPending(false); if (saved) onClose(); }} type="button"><Trash2 size={15}/>{pending ? "Guardando..." : "Confirmar abandono"}</button></footer>
  </section></div>;
}

export function LiveDeleteDialog({
  anime, rating, favorite, onClose, onConfirm,
}: {
  anime: AnimeIdentity;
  rating: number | null;
  favorite: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
}) {
  const [keepWishlist, setKeepWishlist] = useState(false);
  const [pending, setPending] = useState(false);
  return <div className="anime-confirm-overlay"><section aria-labelledby="live-delete-title" aria-modal="true" className="anime-confirm-modal is-delete" role="dialog">
    <button aria-label="Cerrar confirmación de eliminación" className="anime-confirm-close" onClick={onClose} type="button"><X size={18}/></button>
    <span className="anime-confirm-danger-icon"><Trash2 size={25}/></span><h2 id="live-delete-title">¿Eliminar de tu biblioteca?</h2>
    <p>Esta acción eliminará por completo “{anime.title}” de tu biblioteca personal y <b>no se puede deshacer.</b></p>
    <article className="anime-delete-title"><Image alt={`Portada de ${anime.title}`} height={100} src={anime.coverUrl} width={72}/><div><h3>{anime.title}</h3><span>{anime.alternativeTitle}</span><small>{anime.total || "?"} episodios</small></div></article>
    <section className="anime-delete-impact"><h3>Se eliminará lo siguiente:</h3><ul><li><Clock3 size={15}/>Tu progreso actual ({anime.watched} de {anime.total || "?"})</li><li><Star size={15}/>Tu puntuación ({rating?.toFixed(1) ?? "sin puntuar"}/10)</li><li><MessageCircle size={15}/>Tu reseña y calificación personal</li>{favorite && <li><Heart size={15}/>De tus favoritos</li>}<li><History size={15}/>De tu historial de actividad</li></ul></section>
    <label className="anime-delete-check"><input checked={keepWishlist} onChange={(event) => setKeepWishlist(event.target.checked)} type="checkbox"/><span>Mantenerlo en mi lista de deseos<small>Se eliminará de tu biblioteca, pero se conservará en tu lista de deseos.</small></span></label>
    <p className="anime-delete-alert"><AlertTriangle size={15}/>Esta acción es permanente y no podrás recuperar la información eliminada.</p>
    <footer><button onClick={onClose} type="button"><X size={15}/>Cancelar</button><button disabled={pending} onClick={async () => { setPending(true); const removed = await onConfirm(); setPending(false); if (removed) onClose(); }} type="button"><Trash2 size={15}/>{pending ? "Eliminando..." : "Eliminar anime"}</button></footer>
  </section></div>;
}
