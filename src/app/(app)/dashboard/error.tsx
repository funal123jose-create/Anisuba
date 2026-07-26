"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="route-error" role="alert">
      <span><AlertTriangle size={28} /></span>
      <h1>No pudimos cargar tu universo anime</h1>
      <p>Algo salió mal mientras preparábamos tu Dashboard. Tus datos permanecen seguros.</p>
      <button type="button" onClick={reset}><RotateCcw size={16} />Intentar de nuevo</button>
    </section>
  );
}
