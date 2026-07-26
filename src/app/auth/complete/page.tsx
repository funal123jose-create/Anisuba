import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { restartRecoveryAction } from "@/app/(auth)/actions";
import { safeAuthDestination } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AuthCompletePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const code = firstValue(params.code);
  const destination = safeAuthDestination(firstValue(params.next));

  // Compatibilidad con enlaces ya emitidos que todavía apuntan a /auth/complete.
  if (code) {
    const callbackParams = new URLSearchParams({ code, next: destination });
    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="auth-complete-page">
      <div className="auth-complete-card">
        <span><ShieldCheck size={25} /></span>
        <h1>El enlace no pudo verificarse</h1>
        <p>
          {user
            ? "Hay una sesión activa, pero este enlace no se pudo completar. Reinicia el proceso para recibir un enlace nuevo."
            : "El enlace puede haber vencido, haber sido utilizado o no corresponder a este navegador."}
        </p>
        <div className="auth-complete-actions">
          {user ? (
            <>
              <form action={restartRecoveryAction}>
                <button type="submit">Reiniciar recuperación</button>
              </form>
              <Link className="is-secondary" href="/dashboard">Volver al dashboard</Link>
            </>
          ) : (
            <Link href="/recuperar-contrasena">Solicitar un enlace nuevo</Link>
          )}
        </div>
      </div>
    </main>
  );
}
