import { LoginForm } from "@/components/auth/auth-forms";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const banner = params.password === "updated"
    ? "Tu contraseña fue actualizada. Ya puedes iniciar sesión."
    : params.error === "callback"
      ? "El enlace no es válido o ya venció. Solicita uno nuevo."
      : undefined;
  return <LoginForm banner={banner} />;
}
