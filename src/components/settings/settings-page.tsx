"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import {
  Bell, Check, ChevronRight, Clock3, Download, Eye, Globe2, ImagePlus, Link2,
  LockKeyhole, MapPin, Monitor, Moon, Palette, Save, ShieldCheck, Sparkles, Sun,
  UserRound, Users, X,
} from "lucide-react";

type SettingsPageProps = {
  displayName: string;
  username: string;
  email: string;
  avatarUrl: string;
  isDemo: boolean;
};

const accentColors = ["#8b5cf6", "#3b82f6", "#22d3ee", "#ec4899", "#ff5c5c", "#f59e0b", "#34d399", "#facc15", "linear-gradient(135deg,#8b5cf6,#22d3ee,#ec4899)"];

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return <button aria-label={`${checked ? "Desactivar" : "Activar"} ${label}`} aria-pressed={checked} className={`settings-toggle ${checked ? "is-on" : ""}`} onClick={onChange} type="button"><span /></button>;
}

function SettingsHeading({ icon: Icon, title, description, tone = "#a855f7" }: { icon: typeof UserRound; title: string; description: string; tone?: string }) {
  return <header className="settings-panel-heading" style={{ "--settings-tone": tone } as CSSProperties}><span><Icon size={15} /></span><div><h2>{title}</h2><p>{description}</p></div></header>;
}

export function SettingsPage({ displayName, username, email, avatarUrl, isDemo }: SettingsPageProps) {
  const [theme, setTheme] = useState("dark");
  const [accent, setAccent] = useState(accentColors[0]);
  const [saved, setSaved] = useState(false);
  const [avatarNotice, setAvatarNotice] = useState(false);
  const [region, setRegion] = useState("CO");
  const [malImportOpen, setMalImportOpen] = useState(false);
  const [malImportReady, setMalImportReady] = useState(false);
  const [notifications, setNotifications] = useState({ episodes: true, recommendations: true, friends: false, news: true, reminders: true });
  const [privacy, setPrivacy] = useState({ publicProfile: true, viewing: true, friendsList: false, ranking: true });
  const [integrations, setIntegrations] = useState({ mal: "Conectado", anilist: "Conectado", discord: "Conectar" });

  const flipNotification = (key: keyof typeof notifications) => setNotifications((current) => ({ ...current, [key]: !current[key] }));
  const flipPrivacy = (key: keyof typeof privacy) => setPrivacy((current) => ({ ...current, [key]: !current[key] }));

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div><h1>Configuración</h1><p>Personaliza tu experiencia en AniSuba y controla tus preferencias.</p></div>
        {isDemo && <span><Sparkles size={13} />Los cambios son una vista previa local</span>}
      </header>

      <div className="settings-grid">
        <section className="panel settings-account-panel">
          <SettingsHeading description="Gestiona tu información personal y preferencias de cuenta." icon={UserRound} title="Cuenta" />
          <div className="settings-avatar-row">
            <Image alt={`Avatar de ${displayName}`} height={68} src={avatarUrl} width={68} />
            <div><strong>Foto de perfil</strong><small>JPG, PNG o GIF. Máx. 5 MB.</small><button onClick={() => setAvatarNotice(true)} type="button"><ImagePlus size={12} />Cambiar foto</button></div>
          </div>
          <div className="settings-form-grid">
            <label className="settings-field-wide"><span>Nombre</span><input defaultValue={displayName} /></label>
            <label className="settings-field-wide"><span>Nombre de usuario</span><input defaultValue={username || "joseluis12"} /></label>
            <label className="settings-field-wide settings-email-field"><span>Correo electrónico</span><input defaultValue={email} type="email" /><em>Verificado</em></label>
            <label><span>Idioma</span><select defaultValue="es-419"><option value="es-419">Español (Latinoamérica)</option><option value="en">English</option></select></label>
            <label><span>Zona horaria</span><select defaultValue="bogota"><option value="bogota">(GMT-5) Bogotá</option><option value="mexico">(GMT-6) Ciudad de México</option></select></label>
            <label className="settings-field-wide settings-region-field">
              <span><MapPin size={11} /> País o región</span>
              <select aria-describedby="settings-region-help" onChange={(event) => setRegion(event.target.value)} value={region}>
                <option value="CO">Colombia</option>
                <option value="MX">México</option>
                <option value="PE">Perú</option>
                <option value="AR">Argentina</option>
                <option value="CL">Chile</option>
                <option value="ES">España</option>
              </select>
              <small id="settings-region-help">Se usará para mostrar únicamente plataformas oficiales disponibles en tu región.</small>
            </label>
          </div>
          <button className="settings-save-button" onClick={() => setSaved(true)} type="button">{saved ? <Check size={14} /> : <Save size={14} />}{saved ? "Cambios guardados" : "Guardar cambios"}</button>
          {avatarNotice && <p className="settings-inline-notice" role="status">Selector visual preparado; la carga real se conectará a Supabase Storage.</p>}
        </section>

        <section className="panel settings-appearance-panel">
          <SettingsHeading description="Personaliza cómo se ve AniSuba en tu dispositivo." icon={Palette} title="Apariencia" tone="#22d3ee" />
          <fieldset className="settings-theme-options"><legend>Tema</legend>
            {[
              { id: "dark", label: "Oscuro", icon: Moon }, { id: "light", label: "Claro", icon: Sun },
              { id: "amoled", label: "Amoled", icon: Sparkles }, { id: "system", label: "Sistema", icon: Monitor },
            ].map((item) => {
              const Icon = item.icon;
              return <button aria-pressed={theme === item.id} className={theme === item.id ? "is-selected" : ""} data-theme-preview={item.id} key={item.id} onClick={() => setTheme(item.id)} type="button"><span><Icon size={16} />{theme === item.id && <Check size={12} />}</span><strong>{item.label}</strong></button>;
            })}
          </fieldset>
          <fieldset className="settings-accent-options"><legend>Color de acento</legend><div>{accentColors.map((color) => <button aria-label={`Seleccionar acento ${color}`} aria-pressed={accent === color} key={color} onClick={() => setAccent(color)} style={{ background: color }} type="button">{accent === color && <Check size={13} />}</button>)}</div></fieldset>
          <div className="settings-select-row">
            <label><span>Fuente</span><select defaultValue="inter"><option value="inter">Inter (Predeterminada)</option><option value="sora">Sora</option></select></label>
            <label><span>Tamaño de fuente</span><select defaultValue="medium"><option value="small">Pequeño</option><option value="medium">Mediano</option><option value="large">Grande</option></select></label>
          </div>
          <p className="settings-helper">Afecta la interfaz en todo el sitio.</p>
        </section>

        <section className="panel settings-notifications-panel">
          <SettingsHeading description="Elige qué notificaciones quieres recibir." icon={Bell} title="Notificaciones" tone="#ec4899" />
          <div className="settings-option-list">
            {[
              { key: "episodes", icon: Sparkles, title: "Nuevos episodios", text: "Recibe alertas cuando salgan nuevos episodios." },
              { key: "recommendations", icon: ShieldCheck, title: "Recomendaciones", text: "Sugerencias personalizadas basadas en tu actividad." },
              { key: "friends", icon: Users, title: "Actividad de amigos", text: "Cuando tus amigos vean o completen algo." },
              { key: "news", icon: Globe2, title: "Noticias y actualizaciones", text: "Novedades de AniSuba y del mundo anime." },
              { key: "reminders", icon: Bell, title: "Recordatorios", text: "Recordatorios de anime en emisión y pendientes." },
            ].map((item) => {
              const Icon = item.icon;
              const key = item.key as keyof typeof notifications;
              return <article key={item.key}><span><Icon size={15} /></span><div><strong>{item.title}</strong><small>{item.text}</small></div><Toggle checked={notifications[key]} label={item.title} onChange={() => flipNotification(key)} /></article>;
            })}
          </div>
          <button className="settings-panel-link" type="button">Administrar preferencias avanzadas <ChevronRight size={14} /></button>
        </section>

        <section className="panel settings-privacy-panel">
          <SettingsHeading description="Controla quién puede ver tu información y actividad." icon={Eye} title="Privacidad" tone="#3b82f6" />
          <div className="settings-option-list">
            {[
              { key: "publicProfile", title: "Perfil público", text: "Permitir que otros usuarios vean mi perfil." },
              { key: "viewing", title: "Actividad de visualización", text: "Mostrar lo que estoy viendo en mi perfil." },
              { key: "friendsList", title: "Lista de amigos", text: "Permitir que otros vean mi lista de amigos." },
              { key: "ranking", title: "Ranking global", text: "Mostrar mi posición en los rankings." },
            ].map((item) => {
              const key = item.key as keyof typeof privacy;
              return <article key={item.key}><div><strong>{item.title}</strong><small>{item.text}</small></div><Toggle checked={privacy[key]} label={item.title} onChange={() => flipPrivacy(key)} /></article>;
            })}
          </div>
          <button className="settings-panel-link" type="button">Ver mi perfil público <ChevronRight size={14} /></button>
        </section>

        <section className="panel settings-integrations-panel">
          <SettingsHeading description="Conecta servicios y sincroniza tu actividad." icon={Link2} title="Integraciones" tone="#34d399" />
          <div className="settings-integration-list">
            {[
              { key: "mal", initials: "MLE", name: "MyAnimeList", detail: "Última sincronización: hace 2 horas", tone: "#3b82f6" },
              { key: "anilist", initials: "AL", name: "AniList", detail: "Última sincronización: hace 1 hora", tone: "#22d3ee" },
              { key: "discord", initials: "DC", name: "Discord", detail: "Muestra lo que estás viendo en tu perfil.", tone: "#8b5cf6" },
            ].map((item) => {
              const key = item.key as keyof typeof integrations;
              const connected = integrations[key] === "Conectado";
              return (
                <article key={item.key} style={{ "--integration-tone": item.tone } as CSSProperties}>
                  <span>{item.initials}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.key === "mal" ? "Trae tu biblioteca y conserva estados, puntuaciones y progreso." : "Sincroniza tu lista y progreso automáticamente."}</small>
                    <em><Clock3 size={10} />{item.detail}</em>
                  </div>
                  <div>
                    <b>{integrations[key]}</b>
                    {item.key === "mal" ? (
                      <button className="settings-import-button" onClick={() => setMalImportOpen(true)} type="button"><Download size={12} />Importar biblioteca</button>
                    ) : (
                      <button onClick={() => setIntegrations((current) => ({ ...current, [key]: connected ? "Sincronizando..." : "Conectado" }))} type="button">{connected ? "Sincronizar ahora" : "Conectar"}</button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <button className="settings-panel-link" type="button">Gestionar integraciones <ChevronRight size={14} /></button>
        </section>

        <section className="panel settings-security-panel">
          <SettingsHeading description="Mantén tu cuenta protegida." icon={LockKeyhole} title="Seguridad" tone="#f59e0b" />
          <div className="settings-security-list">
            <article><div><strong>Contraseña</strong><small>••••••••••••••</small></div><button type="button">Cambiar</button></article>
            <article><div><strong>Autenticación en dos pasos</strong><small>Añade una capa extra de seguridad.</small></div><span>Activado</span><button aria-label="Administrar autenticación en dos pasos" type="button"><ChevronRight size={14} /></button></article>
            <article><div><strong>Sesiones activas</strong><small>Gestiona los dispositivos donde has iniciado sesión.</small></div><button aria-label="Gestionar sesiones activas" type="button"><ChevronRight size={14} /></button></article>
            <article><div><strong>Cierre de sesión automático</strong><small>Cierra tu sesión tras un período de inactividad.</small></div><select defaultValue="30"><option value="7">7 días</option><option value="30">30 días</option><option value="never">Nunca</option></select></article>
          </div>
          <button className="settings-panel-link" type="button">Ver historial de actividad <ChevronRight size={14} /></button>
        </section>
      </div>

      {malImportOpen && (
        <div className="settings-modal-backdrop" onMouseDown={() => setMalImportOpen(false)}>
          <section aria-labelledby="mal-import-title" aria-modal="true" className="settings-import-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <header>
              <span><Download size={18} /></span>
              <div><p>INTEGRACIÓN PERSONAL</p><h2 id="mal-import-title">Importar desde MyAnimeList</h2></div>
              <button aria-label="Cerrar importación" onClick={() => setMalImportOpen(false)} type="button"><X size={17} /></button>
            </header>
            <p>Revisa cómo AniSuba incorporará tu biblioteca sin sobrescribir actividad existente.</p>
            <div className="settings-import-summary">
              <article><strong>146</strong><span>Títulos detectados</span></article>
              <article><strong>18</strong><span>Coincidencias para revisar</span></article>
              <article><strong>128</strong><span>Listos para importar</span></article>
            </div>
            <ul>
              <li><Check size={13} />Importación unidireccional: MyAnimeList → AniSuba.</li>
              <li><ShieldCheck size={13} />Tus credenciales y tokens nunca se mostrarán en el navegador.</li>
              <li><MapPin size={13} />Región activa: {region === "CO" ? "Colombia" : region}.</li>
            </ul>
            <aside><Sparkles size={14} /><span><strong>Modo demo</strong> Esta vista valida el flujo. La conexión OAuth y la importación real se activarán en la etapa lógica.</span></aside>
            <footer>
              <button onClick={() => setMalImportOpen(false)} type="button">Cancelar</button>
              <button onClick={() => setMalImportReady(true)} type="button"><Download size={13} />{malImportReady ? "Vista previa preparada" : "Continuar a previsualización"}</button>
            </footer>
            {malImportReady && <p className="settings-import-status" role="status">La previsualización del Mockup 30 quedó preparada como siguiente paso del flujo.</p>}
          </section>
        </div>
      )}
    </div>
  );
}
