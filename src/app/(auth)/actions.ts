"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  newPasswordSchema,
  recoverySchema,
  registerSchema,
  verificationSchema,
} from "@/lib/auth/validation";
import { getAuthSiteOrigin } from "@/lib/auth/redirects";

export type AuthActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const initialState: AuthActionState = {};

function validationError(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }): AuthActionState {
  return { error: "Revisa los campos marcados.", fieldErrors: error.flatten().fieldErrors };
}

function authMessage(message: string) {
  if (/invalid login credentials/i.test(message)) return "El correo o la contraseña no son correctos.";
  if (/already registered|already exists/i.test(message)) return "Ya existe una cuenta con ese correo.";
  if (/rate limit|security purposes/i.test(message)) return "Espera un momento antes de intentarlo de nuevo.";
  if (/expired|invalid.*token|token.*invalid/i.test(message)) return "El código no es válido o ya venció.";
  if (/database error saving new user/i.test(message)) return "No pudimos crear el perfil. Revisa que el usuario sea único.";
  return "No pudimos completar la solicitud. Inténtalo nuevamente.";
}

export async function loginAction(previousState: AuthActionState = initialState, formData: FormData): Promise<AuthActionState> {
  void previousState;
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: authMessage(error.message) };

  redirect("/dashboard");
}

export async function registerAction(previousState: AuthActionState = initialState, formData: FormData): Promise<AuthActionState> {
  void previousState;
  const values = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    username: formData.get("username"),
    birthDate: formData.get("birthDate"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    terms: formData.get("terms"),
  };
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error);

  const { firstName, lastName, email, username, birthDate, password } = parsed.data;
  const origin = getAuthSiteOrigin((await headers()).get("origin"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      data: {
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`.trim(),
        username,
        birth_date: birthDate,
      },
    },
  });

  if (error) return { error: authMessage(error.message) };
  if (data.session) redirect("/dashboard");
  redirect(`/verificacion?email=${encodeURIComponent(email)}`);
}

export async function verifyAction(previousState: AuthActionState = initialState, formData: FormData): Promise<AuthActionState> {
  void previousState;
  const parsed = verificationSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ ...parsed.data, type: "signup" });
  if (error) return { error: authMessage(error.message) };
  redirect("/dashboard");
}

export async function resendVerificationAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const parsed = recoverySchema.safeParse({ email });
  if (!parsed.success) redirect("/registro");
  const supabase = await createClient();
  await supabase.auth.resend({ type: "signup", email: parsed.data.email });
  redirect(`/verificacion?email=${encodeURIComponent(parsed.data.email)}&resent=1`);
}

export async function recoveryAction(previousState: AuthActionState = initialState, formData: FormData): Promise<AuthActionState> {
  void previousState;
  const parsed = recoverySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return validationError(parsed.error);

  const origin = getAuthSiteOrigin((await headers()).get("origin"));
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/nueva-contrasena`,
  });
  if (error) return { error: authMessage(error.message) };
  return { success: "Te enviamos un enlace seguro. Revisa también tu carpeta de spam." };
}

export async function newPasswordAction(previousState: AuthActionState = initialState, formData: FormData): Promise<AuthActionState> {
  void previousState;
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: authMessage(error.message) };
  await supabase.auth.signOut();
  redirect("/login?password=updated");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function restartRecoveryAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/recuperar-contrasena");
}
