import Image from "next/image";
import { BarChart3, BookOpenCheck, Compass, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const benefits = [
  { icon: BookOpenCheck, title: "Organiza tu biblioteca", text: "Todo tu anime, siempre en orden." },
  { icon: BarChart3, title: "Descubre tus estadísticas", text: "Convierte tu progreso en historias." },
  { icon: Compass, title: "Encuentra tu próxima obsesión", text: "Explora un universo hecho para ti." },
];

export function AuthShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="auth-shell">
      <section className="auth-hero" aria-label="Tu universo anime, organizado">
        <Image
          className="auth-hero-image"
          src="/auth/auth-city-night.png"
          alt=""
          fill
          priority
          sizes="(max-width: 900px) 100vw, 58vw"
        />
        <video
          aria-hidden="true"
          autoPlay
          className="auth-hero-video"
          loop
          muted
          playsInline
          poster="/auth/auth-city-night.png"
          preload="auto"
        >
          <source src="/auth/auth-city-night-loop.mp4" type="video/mp4" />
        </video>
        <div className="auth-hero-shade" />
        <div className="auth-hero-content">
          <Logo className="auth-logo" />
          <div className="auth-hero-copy">
            <span className="auth-kicker"><Sparkles size={14} /> Tu historia anime empieza aquí</span>
            <h1>Tu universo anime,<br /><span>perfectamente organizado.</span></h1>
            <p>Registra cada episodio, descubre tus patrones y conserva todos los mundos que te han acompañado.</p>
            <ul>
              {benefits.map(({ icon: Icon, title, text }) => (
                <li key={title}>
                  <span><Icon size={18} /></span>
                  <div><strong>{title}</strong><small>{text}</small></div>
                </li>
              ))}
            </ul>
          </div>
          <p className="auth-hero-quote">“Cada historia merece un lugar donde permanecer.”</p>
        </div>
      </section>
      <section className="auth-form-side">{children}</section>
    </main>
  );
}
