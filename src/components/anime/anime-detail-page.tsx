"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import {
  AlertTriangle, ArrowLeft, Bookmark, CalendarDays, Check, CheckCheck, CheckCircle2, ChevronRight, Circle, CirclePause, Clock3,
  Edit3, ExternalLink, Film, Flame, Frown, Globe2, Heart, History, Info, Layers3, LibraryBig, ListVideo,
  Lock, MapPin, MessageCircle, Minus, MoreHorizontal, Play, Plus, Save, Send,
  Share2, Sparkles, Star, Tag, Trash2, Tv, UserRound, UsersRound, X,
} from "lucide-react";

type AnimeDetailPageProps = { isDemo: boolean };
type AnimeTab = "Resumen" | "Episodios" | "Personajes" | "Reseñas" | "Recomendaciones" | "Similares" | "Datos";

const tabs: Array<{ label: AnimeTab; icon: typeof Film }> = [
  { label: "Resumen", icon: Film }, { label: "Episodios", icon: CalendarDays },
  { label: "Personajes", icon: UsersRound }, { label: "Reseñas", icon: MessageCircle },
  { label: "Recomendaciones", icon: Sparkles }, { label: "Similares", icon: LibraryBig },
  { label: "Datos", icon: Info },
];

const remoteCovers = [
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-hSNRJM03pvv1.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx146065-IjirxRK26O03.png",
];

const episodes = [
  { number: 1, title: "El comienzo del vacío", date: "Abr 6, 2023", image: "/images/anime-eclipse-cover-v2.png" },
  { number: 2, title: "Despertar de sombras", date: "Abr 13, 2023", image: remoteCovers[0] },
  { number: 3, title: "Alianza inesperada", date: "Abr 20, 2023", image: remoteCovers[1] },
  { number: 4, title: "Memorias fragmentadas", date: "Abr 27, 2023", image: remoteCovers[2] },
  { number: 5, title: "El poder de la oscuridad", date: "May 4, 2023", image: remoteCovers[3] },
  { number: 6, title: "Ecos del pasado", date: "May 11, 2023", image: "/images/anime-eclipse-cover-v2.png" },
  { number: 7, title: "La ciudad sin luz", date: "May 18, 2023", image: remoteCovers[0] },
  { number: 8, title: "Más allá del eclipse", date: "May 25, 2023", image: remoteCovers[1] },
];

const characters = [
  { name: "Rin Kurogane", role: "Protagonista", image: "/images/anime-eclipse-cover-v2.png" },
  { name: "Akari Hoshino", role: "Heroína", image: remoteCovers[1] },
  { name: "Yuto Asahi", role: "Antagonista", image: remoteCovers[2] },
  { name: "Mira Takatsuki", role: "Aliada", image: remoteCovers[3] },
  { name: "Kaede Amamiya", role: "Guardián", image: remoteCovers[0] },
  { name: "Sora Mizuhara", role: "Estratega", image: remoteCovers[1] },
  { name: "Ren Tsukishiro", role: "Rival", image: remoteCovers[2] },
  { name: "Noa Kisaragi", role: "Oráculo", image: remoteCovers[3] },
];

const providers = [
  { code: "CR", name: "Crunchyroll", access: "Suscripción", tone: "#f97316" },
  { code: "NF", name: "Netflix", access: "Suscripción", tone: "#ef4444" },
  { code: "PV", name: "Prime Video", access: "Suscripción", tone: "#38bdf8" },
];

const statusOptions = [
  { value: "Planeo ver", detail: "Guardarlo para verlo más adelante.", icon: Bookmark, tone: "#a855f7" },
  { value: "Viendo actualmente", detail: "Seguir registrando episodios en progreso.", icon: Play, tone: "#3b82f6" },
  { value: "Al día", detail: "Ya viste todo lo emitido hasta ahora.", icon: CheckCircle2, tone: "#22d3ee" },
  { value: "En pausa", detail: "Pausas temporalmente tu seguimiento.", icon: CirclePause, tone: "#facc15" },
  { value: "Completado", detail: "Terminaste todo el contenido disponible.", icon: CheckCheck, tone: "#22c55e" },
  { value: "Esperando nueva temporada", detail: "Completaste lo disponible y esperas continuación.", icon: Clock3, tone: "#f97316" },
  { value: "Abandonado", detail: "Decidiste no continuar viendo este anime.", icon: X, tone: "#f43f5e" },
];

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function AnimeDetailPage({ isDemo }: AnimeDetailPageProps) {
  const [activeTab, setActiveTab] = useState<AnimeTab>("Resumen");
  const [status, setStatus] = useState("Viendo actualmente");
  const [currentEpisode, setCurrentEpisode] = useState(9);
  const [score, setScore] = useState(9);
  const [favorite, setFavorite] = useState(true);
  const [inList, setInList] = useState(true);
  const [providerNotice, setProviderNotice] = useState("");
  const [progressSaved, setProgressSaved] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [scoreDrawerOpen, setScoreDrawerOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [statusDrawerOpen, setStatusDrawerOpen] = useState(false);
  const [draftEpisode, setDraftEpisode] = useState(9);
  const [draftScore, setDraftScore] = useState(9);
  const [draftStatus, setDraftStatus] = useState(status);
  const [statusNote, setStatusNote] = useState("");
  const [activeStreakDay, setActiveStreakDay] = useState(4);
  const [viewDate, setViewDate] = useState("2023-05-08");
  const [quickComment, setQuickComment] = useState("");
  const [ratingComment, setRatingComment] = useState("Una historia atrapante con giros increíbles, personajes memorables y una animación espectacular. El final fue perfecto.");
  const [impressions, setImpressions] = useState(["Historia", "Animación", "Personajes"]);
  const [reviewRating, setReviewRating] = useState(9);
  const [reviewText, setReviewText] = useState("Una historia increíblemente profunda y emocionante.\nLos personajes están muy bien desarrollados y el mundo que construyen es fascinante.\nLa banda sonora y la animación son simplemente espectaculares. ¡Totalmente recomendado! 🔥");
  const [reviewTags, setReviewTags] = useState(["Acción", "Fantasía", "Sci-Fi"]);
  const [reviewSpoiler, setReviewSpoiler] = useState(false);
  const [reviewPublished, setReviewPublished] = useState(false);
  const [reviewTagMenuOpen, setReviewTagMenuOpen] = useState(false);
  const [abandonModalOpen, setAbandonModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [abandonReason, setAbandonReason] = useState("No me gustó");
  const [keepWishlist, setKeepWishlist] = useState(false);
  const progress = Math.round((currentEpisode / 24) * 100);
  const draftProgress = Math.round((draftEpisode / 24) * 100);
  const remainingEpisodes = Math.max(0, 24 - draftEpisode);
  const tabDescription = ({
    Episodios: "Explora la temporada completa y registra tu avance episodio por episodio.",
    Personajes: "Conoce al elenco principal y su función dentro de la historia.",
    Reseñas: "Opiniones de la comunidad, con protección de spoilers.",
    Recomendaciones: "Historias elegidas a partir de tu actividad y preferencias.",
    Similares: "Títulos con temas, géneros y atmósferas relacionadas.",
    Datos: "Ficha técnica, emisión, estudio y referencias del catálogo.",
  } as Partial<Record<AnimeTab, string>>)[activeTab];

  function openProgressModal() {
    setDraftEpisode(currentEpisode);
    setProgressModalOpen(true);
  }

  function saveProgress() {
    setCurrentEpisode(draftEpisode);
    setProgressSaved(true);
    setProgressModalOpen(false);
  }

  function openScoreDrawer(value: number) {
    setDraftScore(value);
    setScoreDrawerOpen(true);
  }

  function toggleImpression(impression: string) {
    setImpressions((current) => current.includes(impression) ? current.filter((item) => item !== impression) : [...current, impression]);
  }

  function openStatusDrawer() {
    setDraftStatus(status);
    setProgressModalOpen(false);
    setStatusDrawerOpen(true);
  }

  return (
    <div className="anime-detail-page">
      {isDemo && <div className="anime-detail-demo"><Sparkles size={13} /><strong>Modo demo</strong><span>Ficha de muestra</span></div>}
      <div className="anime-detail-layout">
        <main className="anime-detail-main">
          <section className="anime-hero">
            <Image alt="" className="anime-hero-background" fill priority sizes="(max-width: 1100px) 100vw, 75vw" src="/images/anime-eclipse-hero-v1.png" />
            <div className="anime-hero-shade" />
            <Link className="anime-back-button" href="/dashboard"><ArrowLeft size={15} />Regresar</Link>
            <div className="anime-detail-cover">
              <Image alt="Portada de Eclipse del Vacío" fill priority sizes="(max-width: 700px) 130px, 190px" src="/images/anime-eclipse-cover-v2.png" />
              <button aria-label="Guardar Eclipse del Vacío" type="button"><Bookmark fill="currentColor" size={16} /></button>
            </div>
            <div className="anime-hero-copy">
              <div className="anime-title-row"><h1>Eclipse del Vacío</h1><button aria-label="Reproducir tráiler" type="button"><Play fill="currentColor" size={18} /></button></div>
              <p className="anime-native-title">虚空のエクリプス</p><p className="anime-romaji-title">Kokuu no Ekuripusu</p>
              <div className="anime-meta"><span><Tv size={12} />TV</span><span>2023</span><span>24 episodios</span><span>24 min</span><span className="anime-score"><Star fill="currentColor" size={13} />8.74 <small>(12,458)</small></span></div>
              <div className="anime-genres">{["Acción", "Fantasía", "Sci-Fi", "Aventura", "Seinen"].map((genre) => <span key={genre}><Circle size={7} />{genre}</span>)}</div>
            </div>
            <button aria-label="Más opciones" className="anime-hero-more" type="button"><MoreHorizontal size={21} /></button>
          </section>

          <nav aria-label="Secciones del anime" className="anime-tabs">
            {tabs.map(({ label, icon: Icon }) => <button aria-current={activeTab === label ? "page" : undefined} className={activeTab === label ? "is-active" : undefined} key={label} onClick={() => { setActiveTab(label); if (label === "Reseñas") setReviewModalOpen(true); }} type="button"><Icon size={15} />{label}</button>)}
          </nav>

          {activeTab === "Resumen" ? (
            <div className="anime-summary-grid">
              <div className="anime-summary-left">
                <section className="anime-panel anime-synopsis">
                  <h2>Sinopsis</h2>
                  <p>En un mundo donde el vacío amenaza con consumir todo a su paso, un joven que ha perdido sus recuerdos descubre un poder capaz de alterar el destino. Mientras busca respuestas sobre su origen, se verá envuelto en una guerra entre dimensiones y secretos que podrían cambiar el universo para siempre.</p>
                  <div className="anime-synopsis-footer">
                    <dl><div><dt>Estudio:</dt><dd>Void Studio</dd></div><div><dt>Fuente:</dt><dd>Novela ligera</dd></div><div><dt>Temporada:</dt><dd>Primavera 2023</dd></div><div><dt>Estado:</dt><dd>Finalizado</dd></div></dl>
                    <button type="button"><Image alt="" fill sizes="220px" src="/images/anime-eclipse-hero-v1.png" /><span><Play fill="currentColor" size={15} />Ver tráiler <ExternalLink size={11} /></span></button>
                  </div>
                </section>
                <section className="anime-panel anime-characters">
                  <header><h2><UserRound size={16} />Personajes principales</h2><button type="button">Ver todos <ChevronRight size={12} /></button></header>
                  <div>{characters.map((character) => <article className="anime-character-card" key={character.name}><div><Image alt={character.name} fill sizes="100px" src={character.image} /></div><strong>{character.name}</strong><span>{character.role}</span></article>)}</div>
                </section>
              </div>
              <section className="anime-panel anime-episodes">
                <header><h2><ListVideo size={16} />Episodios</h2><button type="button">Ver todos</button></header>
                <div>{episodes.map((episode) => <article key={episode.number}><b>{episode.number}</b><Image alt="" height={48} src={episode.image} width={78} /><span><strong>{episode.title}</strong><small>{episode.date}</small></span><Check size={18} /></article>)}</div>
                <button className="anime-all-episodes" onClick={() => setActiveTab("Episodios")} type="button">Ver todos los episodios <ChevronRight size={15} /></button>
              </section>
            </div>
          ) : (
            <section className="anime-panel anime-tab-placeholder"><span><Sparkles size={20} /></span><p>SECCIÓN INTERACTIVA</p><h2>{activeTab}</h2><div>{tabDescription}</div><button onClick={() => setActiveTab("Resumen")} type="button">Volver al resumen</button></section>
          )}
        </main>

        <aside className="anime-detail-sidebar">
          <section className="anime-side-card anime-status-card">
            <h2>Mi estado</h2>
            <label><span className="sr-only">Estado personal</span><select onChange={(event) => setStatus(event.target.value)} value={status}><option>Viendo actualmente</option><option>Planeo ver</option><option>Completado</option><option>En pausa</option><option>Abandonado</option></select></label>
            <div className="anime-current-episode"><span>Episodio actual</span><strong>{currentEpisode} <small>/ 24</small></strong></div>
            <div className="anime-detail-progress-track"><span style={{ width: `${Math.min(100, progress)}%` }} /></div><em>{progress}%</em>
            <div className="anime-episode-stepper"><button aria-label="Restar episodio" onClick={() => setCurrentEpisode((value) => Math.max(0, value - 1))} type="button">−</button><span>{currentEpisode}</span><button aria-label="Sumar episodio" onClick={() => setCurrentEpisode((value) => Math.min(24, value + 1))} type="button"><Plus size={13} /></button></div>
            <button className="anime-primary-button" onClick={openProgressModal} type="button">{progressSaved ? <Check size={15} /> : <Save size={15} />}{progressSaved ? "Progreso actualizado" : "Actualizar progreso"}</button>
          </section>
          <section className="anime-side-card anime-user-score">
            <h2>Mi puntuación</h2><div><Star fill="currentColor" size={24} /><strong>{score}.0 <small>/ 10</small></strong></div>
            <div className="anime-stars" aria-label={`Puntuación ${score} de 10`}>{Array.from({ length: 5 }, (_, index) => { const value = (index + 1) * 2; return <button aria-label={`Puntuar ${value} de 10`} aria-pressed={score === value} key={value} onClick={() => openScoreDrawer(value)} type="button"><Star fill={score >= value ? "currentColor" : "none"} size={25} /></button>; })}</div>
          </section>
          <section className="anime-side-card anime-info-card">
            <h2>Información general</h2><dl><div><dt>Tipo</dt><dd>TV</dd></div><div><dt>Episodios</dt><dd>24</dd></div><div><dt>Estado</dt><dd>Finalizado</dd></div><div><dt>Emisión</dt><dd>Abr 6, 2023 – Sep 21, 2023</dd></div><div><dt>Estudio</dt><dd>Void Studio</dd></div><div><dt>Origen</dt><dd>Japón</dd></div></dl>
          </section>
          <section className="anime-side-card anime-watch-card">
            <header><div><Globe2 size={16} /><h2>Dónde ver</h2></div><span><MapPin size={11} />Colombia</span></header><p>Disponibilidad oficial según tu región.</p>
            <div>{providers.map((provider) => <button key={provider.code} onClick={() => setProviderNotice(`${provider.name}: enlace oficial preparado en modo demo.`)} style={{ "--provider-tone": provider.tone } as CSSProperties} type="button"><span>{provider.code}</span><span><strong>{provider.name}</strong><small>{provider.access}</small></span><ExternalLink size={13} /></button>)}</div>
            <small><Clock3 size={10} />Verificado hace 2 horas</small>{providerNotice && <em role="status">{providerNotice}</em>}
          </section>
          <section className="anime-side-card anime-actions-card">
            <h2>Acciones</h2>
            <button aria-pressed={favorite} className={favorite ? "is-favorite" : undefined} onClick={() => setFavorite((value) => !value)} type="button"><Heart fill={favorite ? "currentColor" : "none"} size={17} />{favorite ? "En favoritos" : "Añadir a favoritos"}</button>
            <button aria-pressed={inList} className={inList ? "is-listed" : undefined} onClick={() => setInList((value) => !value)} type="button"><Bookmark fill={inList ? "currentColor" : "none"} size={17} />{inList ? "En mi lista" : "Añadir a mi lista"}</button>
            <button onClick={() => setProviderNotice("Enlace de la ficha preparado para compartir.")} type="button"><Share2 size={17} />Compartir</button>
            <Link href="/anime/eclipse-del-vacio/temporadas"><Layers3 size={17}/>Gestionar temporadas</Link>
            <Link href="/admin/animes/eclipse-del-vacio/editar"><Edit3 size={17}/>Editar anime</Link>
            <button className="is-danger" onClick={() => setDeleteModalOpen(true)} type="button"><Trash2 size={17}/>Eliminar de mi biblioteca</button>
          </section>
        </aside>
      </div>

      {progressModalOpen && (
        <div className="anime-update-overlay anime-progress-overlay" onMouseDown={(event) => { if (event.currentTarget === event.target) setProgressModalOpen(false); }}>
          <section aria-labelledby="progress-modal-title" aria-modal="true" className="anime-update-modal anime-progress-modal" role="dialog">
            <header className="anime-update-header">
              <div><span><ListVideo size={19} /></span><div><p>REGISTRO DE ACTIVIDAD</p><h2 id="progress-modal-title">Actualización de progreso</h2></div></div>
              <button aria-label="Cerrar actualización de progreso" onClick={() => setProgressModalOpen(false)} type="button"><X size={18} /></button>
            </header>
            <div className="anime-update-body">
              <div className="anime-update-form">
                <article className="anime-update-anime"><Image alt="Portada de Eclipse del Vacío" height={92} src="/images/anime-eclipse-cover-v2.png" width={68} /><div><span>VIENDO ACTUALMENTE</span><h3>Eclipse del Vacío</h3><p>Episodio {currentEpisode} de 24</p></div><Check size={18} /></article>
                <section className="anime-update-block anime-update-episode">
                  <header><div><ListVideo size={16} /><h3>Episodio actual</h3></div><strong>{draftProgress}%</strong></header>
                  <div className="anime-update-stepper"><button aria-label="Restar episodio en actualización" onClick={() => setDraftEpisode((value) => Math.max(0, value - 1))} type="button"><Minus size={16} /></button><strong>{draftEpisode}</strong><span>de 24</span><button aria-label="Sumar episodio en actualización" onClick={() => setDraftEpisode((value) => Math.min(24, value + 1))} type="button"><Plus size={16} /></button></div>
                  <div className="anime-update-progress"><span style={{ width: `${draftProgress}%` }} /></div>
                </section>
                <section className="anime-update-block anime-update-actions">
                  <header><div><Sparkles size={16} /><h3>Acciones rápidas</h3></div></header>
                  <div className="anime-update-quick-actions">
                    <button onClick={() => setDraftEpisode((value) => Math.min(24, value + 1))} type="button"><Plus size={15} /><span><strong>+1 episodio</strong><small>Registrar avance</small></span></button>
                    <button onClick={() => setDraftEpisode(24)} type="button"><Check size={15} /><span><strong>Completar temporada</strong><small>Marcar 24 de 24</small></span></button>
                    <button onClick={openStatusDrawer} type="button"><Bookmark size={15} /><span><strong>Cambiar estado</strong><small>{status}</small></span></button>
                  </div>
                </section>
                <section className="anime-update-fields">
                  <label><span><CalendarDays size={14} />Fecha de visualización</span><input aria-label="Fecha de visualización" onChange={(event) => setViewDate(event.target.value)} type="date" value={viewDate} /></label>
                  <label><span><MessageCircle size={14} />Comentario rápido <small>Opcional</small></span><textarea aria-label="Comentario rápido" maxLength={200} onChange={(event) => setQuickComment(event.target.value)} placeholder="¿Qué te pareció este episodio?" value={quickComment} /><em>{quickComment.length}/200</em></label>
                </section>
                <p className="anime-update-note"><Info size={14} />Este registro actualizará tu progreso, historial y estadísticas personales.</p>
              </div>
              <aside className="anime-update-insights">
                <article><span><Clock3 size={17} /></span><div><p>Tiempo estimado visto</p><strong>{formatDuration(draftEpisode * 24)}</strong><small>{draftEpisode} episodios registrados</small></div></article>
                <article><span><Film size={17} /></span><div><p>Contenido restante</p><strong>{remainingEpisodes} episodios</strong><small>{formatDuration(remainingEpisodes * 24)} aproximadamente</small></div></article>
                <article className="anime-update-next"><header><div><CalendarDays size={15} /><h3>Próximo episodio</h3></div><span>EN 3 DÍAS</span></header><div><Image alt="" height={66} src="/images/anime-eclipse-cover-v2.png" width={50} /><span><strong>Sombras del destino</strong><small>Episodio {Math.min(24, draftEpisode + 1)}</small><em>Jueves, 11 de mayo</em></span></div></article>
                <article className="anime-update-streak"><header><div><Flame size={16} /><h3>Racha actual</h3></div><strong>7 días</strong></header><p>¡Sigue así! Estás construyendo un gran hábito.</p><div>{["L", "M", "M", "J", "V", "S", "D"].map((day, index) => <button aria-label={`Ver actividad del ${day}, día ${index + 1}`} className={`${index < 5 ? "is-done" : index === 6 ? "is-today" : ""} ${activeStreakDay === index ? "is-active" : ""}`} key={`${day}-${index}`} onClick={() => setActiveStreakDay(index)} type="button">{day}</button>)}</div></article>
              </aside>
            </div>
            <footer className="anime-update-footer"><button onClick={() => setProgressModalOpen(false)} type="button">Cancelar</button><button onClick={saveProgress} type="button"><Save size={15} />Guardar progreso</button></footer>
          </section>
        </div>
      )}

      {statusDrawerOpen && (
        <div className="anime-update-overlay" onMouseDown={(event) => { if (event.currentTarget === event.target) setStatusDrawerOpen(false); }}>
          <section aria-labelledby="status-drawer-title" aria-modal="true" className="anime-update-modal anime-status-drawer" role="dialog">
            <header className="anime-update-header"><div><span><Bookmark size={19} /></span><div><p>ORGANIZACIÓN PERSONAL</p><h2 id="status-drawer-title">Cambio de estado</h2></div></div><button aria-label="Cerrar cambio de estado" onClick={() => setStatusDrawerOpen(false)} type="button"><X size={18} /></button></header>
            <div className="anime-status-body">
              <article className="anime-update-anime"><Image alt="Portada de Eclipse del Vacío" height={92} src="/images/anime-eclipse-cover-v2.png" width={68} /><div><span>{status.toUpperCase()}</span><h3>Eclipse del Vacío</h3><p>Episodio actual: <strong>{currentEpisode} de 24</strong></p></div><Check size={18} /></article>
              <section className="anime-status-options"><h3>Selecciona el nuevo estado</h3><div>{statusOptions.map(({ value, detail, icon: Icon, tone }) => <button aria-pressed={draftStatus === value} className={draftStatus === value ? "is-active" : undefined} key={value} onClick={() => setDraftStatus(value)} style={{ "--status-tone": tone } as CSSProperties} type="button"><span><Icon size={20} /></span><span><strong>{value}</strong><small>{detail}</small></span>{draftStatus === value && <Check size={14} />}</button>)}</div></section>
              <section className="anime-status-impact"><Clock3 size={18} /><div><h3>Qué ocurrirá con este cambio</h3><ul><li>Se conservará tu progreso actual.</li><li>El anime aparecerá en la categoría correspondiente.</li><li>Podrás recibir alertas relacionadas con su estado.</li></ul></div></section>
              <section className="anime-status-fields"><label><span>Fecha del cambio</span><input aria-label="Fecha del cambio" type="date" value={viewDate} onChange={(event) => setViewDate(event.target.value)} /></label><label><span>Nota rápida <small>(opcional)</small></span><textarea aria-label="Nota del cambio de estado" maxLength={200} onChange={(event) => setStatusNote(event.target.value)} placeholder="Escribe una nota breve..." value={statusNote} /><em>{statusNote.length}/200</em></label></section>
              <p className="anime-update-note"><Info size={14} />Este cambio actualizará tu biblioteca, historial y estadísticas.</p>
            </div>
            <footer className="anime-update-footer"><button onClick={() => setStatusDrawerOpen(false)} type="button">Cancelar</button><button onClick={() => { if(draftStatus==="Abandonado"){setStatusDrawerOpen(false);setAbandonModalOpen(true);}else{setStatus(draftStatus);setStatusDrawerOpen(false);} }} type="button"><Save size={15} />Guardar estado</button></footer>
          </section>
        </div>
      )}

      {scoreDrawerOpen && (
        <div className="anime-update-overlay" onMouseDown={(event) => { if (event.currentTarget === event.target) setScoreDrawerOpen(false); }}>
          <section aria-labelledby="score-drawer-title" aria-modal="true" className="anime-update-modal anime-rating-drawer" role="dialog">
            <header className="anime-update-header">
              <div><span><Star size={19} /></span><div><p>VALORACIÓN PERSONAL</p><h2 id="score-drawer-title">Registro de puntuación</h2></div></div>
              <button aria-label="Cerrar registro de puntuación" onClick={() => setScoreDrawerOpen(false)} type="button"><X size={18} /></button>
            </header>

            <div className="anime-rating-body">
              <div className="anime-rating-summary">
                <article className="anime-update-anime"><Image alt="Portada de Eclipse del Vacío" height={92} src="/images/anime-eclipse-cover-v2.png" width={68} /><div><span>COMPLETADO</span><h3>Eclipse del Vacío</h3><p>Episodio final: <strong>24 de 24</strong></p></div><Check size={18} /></article>
                <article className="anime-rating-stats"><p>Puntuación promedio</p><strong><Star fill="currentColor" size={16} />8.74 <small>/ 10</small></strong><p>Tu posición en favoritos</p><b>#2</b><p>Última actualización</p><span><CalendarDays size={12} />8 may, 2023</span></article>
              </div>

              <section className="anime-rating-panel">
                <header><div><h3>Tu puntuación personal</h3><p>¿Cómo calificarías este anime?</p></div><strong>{draftScore.toFixed(1)} <small>/ 10</small></strong></header>
                <div className="anime-rating-stars">{Array.from({ length: 10 }, (_, index) => {
                  const value = index + 1;
                  return <button aria-label={`Seleccionar puntuación ${value}`} aria-pressed={draftScore === value} key={value} onClick={() => setDraftScore(value)} type="button"><Star fill={draftScore >= value ? "currentColor" : "none"} size={31} /></button>;
                })}</div>
                <div className="anime-rating-track" style={{ "--rating-progress": `${((draftScore - 1) / 9) * 90}%` } as CSSProperties}>{Array.from({ length: 10 }, (_, index) => {
                  const value = index + 1;
                  return <button aria-label={`Seleccionar puntuación ${value} en escala`} aria-pressed={draftScore === value} className={draftScore === value ? "is-active" : draftScore > value ? "is-complete" : undefined} key={value} onClick={() => setDraftScore(value)} type="button"><i />{value}</button>;
                })}</div>

                <div className="anime-rating-impressions"><h4>Impresiones rápidas <small>(opcional)</small></h4><div>{["Historia", "Animación", "Personajes", "Banda sonora"].map((item) => <button aria-pressed={impressions.includes(item)} className={impressions.includes(item) ? "is-active" : undefined} key={item} onClick={() => toggleImpression(item)} type="button"><Check size={12} />{item}</button>)}</div></div>
                <label className="anime-rating-comment"><span>¿Por qué le das esta puntuación? <small>(opcional)</small></span><textarea aria-label="Motivo de la puntuación" maxLength={500} onChange={(event) => setRatingComment(event.target.value)} value={ratingComment} /><em>{ratingComment.length}/500</em></label>
              </section>
            </div>

            <footer className="anime-update-footer"><button onClick={() => setScoreDrawerOpen(false)} type="button">Cancelar</button><button onClick={() => { setScore(draftScore); setScoreDrawerOpen(false); }} type="button"><Save size={15} />Guardar puntuación</button></footer>
          </section>
        </div>
      )}

      {reviewModalOpen && (
        <div className="anime-review-overlay" onMouseDown={(event) => { if (event.currentTarget === event.target) setReviewModalOpen(false); }}>
          <section aria-labelledby="review-modal-title" aria-modal="true" className="anime-review-modal" role="dialog">
            <header><div><MessageCircle size={19} /><h2 id="review-modal-title">Escribe tu reseña</h2></div><button aria-label="Cerrar reseña" onClick={() => setReviewModalOpen(false)} type="button"><X size={18} /></button></header>

            <section className="anime-review-rating">
              <div><h3>Tu puntuación</h3><strong>{reviewRating.toFixed(1)} <small>/ 10</small></strong></div>
              <div>{Array.from({ length: 10 }, (_, index) => { const value = index + 1; return <button aria-label={`Calificar reseña con ${value}`} aria-pressed={reviewRating === value} key={value} onClick={() => setReviewRating(value)} type="button"><Star fill={reviewRating >= value ? "currentColor" : "none"} size={25} /></button>; })}</div>
              <p>{reviewRating >= 9 ? "¡Excelente!" : reviewRating >= 7 ? "¡Muy buena!" : reviewRating >= 5 ? "Interesante" : "Puede mejorar"}</p>
            </section>

            <label className="anime-review-text"><span>Tu reseña <small>(opcional)</small></span><textarea aria-label="Texto de la reseña" maxLength={1000} onChange={(event) => setReviewText(event.target.value)} value={reviewText} /><em>{reviewText.length}/1000</em></label>

            <section className="anime-review-tags"><h3><Tag size={14} />Etiquetas <small>(opcional)</small></h3><p>Agregar hasta 3 etiquetas</p><div>{reviewTags.map((tag) => <button aria-label={`Quitar etiqueta ${tag}`} key={tag} onClick={() => setReviewTags((current) => current.filter((item) => item !== tag))} type="button">{tag}<X size={12} /></button>)}<button aria-expanded={reviewTagMenuOpen} onClick={() => setReviewTagMenuOpen((value) => !value)} type="button"><Plus size={13} />Agregar etiqueta</button></div>{reviewTagMenuOpen && <div className="anime-review-tag-bank">{["Drama", "Misterio", "Emotivo"].map((tag) => <button disabled={reviewTags.length >= 3 || reviewTags.includes(tag)} key={tag} onClick={() => { setReviewTags((current) => [...current, tag]); setReviewTagMenuOpen(false); }} type="button">{tag}</button>)}{reviewTags.length >= 3 && <span>Quita una etiqueta para elegir otra.</span>}</div>}</section>

            <section className="anime-review-spoiler"><div><h3>¿Deseas marcar como spoiler?</h3><p>Los spoilers se ocultarán tras un aviso.</p></div><button aria-label="Marcar reseña como spoiler" aria-pressed={reviewSpoiler} className={reviewSpoiler ? "is-active" : undefined} onClick={() => setReviewSpoiler((value) => !value)} type="button"><span /></button></section>

            <footer><div><button onClick={() => setReviewModalOpen(false)} type="button">Cancelar</button><button onClick={() => { setReviewPublished(true); setReviewModalOpen(false); }} type="button"><Send size={15} />Publicar reseña</button></div><p><Lock size={12} />Tu reseña es privada y solo tú puedes verla.</p></footer>
          </section>
        </div>
      )}
      {reviewPublished && <div className="anime-review-toast" role="status"><Check size={14} />Reseña guardada en modo demo<button aria-label="Cerrar confirmación" onClick={() => setReviewPublished(false)} type="button"><X size={13} /></button></div>}
      {abandonModalOpen&&<div className="anime-confirm-overlay"><section aria-labelledby="abandon-title" aria-modal="true" className="anime-confirm-modal is-abandon" role="dialog"><header><h2 id="abandon-title">¿Abandonar este anime?</h2><button aria-label="Cerrar confirmación de abandono" onClick={()=>setAbandonModalOpen(false)} type="button"><X size={18}/></button></header><article className="anime-confirm-title"><Image alt="Eclipse del Vacío" height={112} src="/images/anime-eclipse-cover-v2.png" width={82}/><div><h3>Eclipse del Vacío</h3><span>Viendo actualmente</span><p>Episodio actual: <strong>{currentEpisode} de 24</strong></p></div><div><small>Progreso actual</small><strong>{progress}%</strong><i><span style={{width:`${progress}%`}}/></i></div></article><section className="anime-confirm-warning"><AlertTriangle size={24}/><div><h3>Este anime será marcado como <b>Abandonado</b></h3><p>Tu progreso, historial, puntuación y notas se conservarán para que puedas retomarlo en el futuro.</p></div></section><fieldset><legend>¿Por qué decides abandonarlo? <small>(opcional)</small></legend><div>{[["No me gustó",Frown],["Lo pausé demasiado",Clock3],["Otro motivo",MoreHorizontal]].map(([reason,Icon])=><button aria-pressed={abandonReason===reason} className={abandonReason===reason?"is-active":undefined} key={String(reason)} onClick={()=>setAbandonReason(String(reason))} type="button"><Icon size={18}/>{String(reason)}</button>)}</div></fieldset><label>Nota adicional <small>(opcional)</small><textarea maxLength={200} placeholder="Cuéntanos brevemente el motivo..."/></label><p className="anime-confirm-note"><Info size={15}/>Podrás encontrar este anime en la sección <b>Abandonado</b> y retomarlo cuando quieras.</p><footer><button onClick={()=>setAbandonModalOpen(false)} type="button"><X size={15}/>Cancelar</button><button onClick={()=>{setStatus("Abandonado");setAbandonModalOpen(false)}} type="button"><Trash2 size={15}/>Confirmar abandono</button></footer></section></div>}
      {deleteModalOpen&&<div className="anime-confirm-overlay"><section aria-labelledby="delete-title" aria-modal="true" className="anime-confirm-modal is-delete" role="dialog">
        <button aria-label="Cerrar confirmación de eliminación" className="anime-confirm-close" onClick={()=>setDeleteModalOpen(false)} type="button"><X size={18}/></button>
        <span className="anime-confirm-danger-icon"><Trash2 size={25}/></span>
        <h2 id="delete-title">¿Eliminar de tu biblioteca?</h2>
        <p>Esta acción eliminará por completo “Eclipse del Vacío” de tu biblioteca personal y <b>no se puede deshacer.</b></p>
        <article className="anime-delete-title"><Image alt="Eclipse del Vacío" height={100} src="/images/anime-eclipse-cover-v2.png" width={72}/><div><h3>Eclipse del Vacío</h3><span>Kokuu no Ekuripusu</span><small>TV · 2023 · 24 episodios</small></div></article>
        <section className="anime-delete-impact"><h3>Se eliminará lo siguiente:</h3><ul>
          <li><Clock3 size={15}/>Tu progreso actual (Episodio {currentEpisode} de 24)</li>
          <li><Star size={15}/>Tu puntuación ({score.toFixed(1)}/10)</li>
          <li><MessageCircle size={15}/>Tu reseña y calificación personal</li>
          <li><Heart size={15}/>De tus favoritos</li>
          <li><History size={15}/>De tu historial de actividad</li>
        </ul></section>
        <label className="anime-delete-check"><input checked={keepWishlist} onChange={(event)=>setKeepWishlist(event.target.checked)} type="checkbox"/><span>Mantenerlo en mi lista de deseos<small>Se eliminará de tu biblioteca, pero se conservará en tu lista de deseos.</small></span></label>
        <p className="anime-delete-alert"><AlertTriangle size={15}/>Esta acción es permanente y no podrás recuperar la información eliminada.</p>
        <footer><button onClick={()=>setDeleteModalOpen(false)} type="button"><X size={15}/>Cancelar</button><button onClick={()=>{setInList(false);setFavorite(false);setDeleteModalOpen(false)}} type="button"><Trash2 size={15}/>Eliminar anime</button></footer>
      </section></div>}
    </div>
  );
}
