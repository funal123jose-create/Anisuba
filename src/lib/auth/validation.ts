import { z } from "zod";

const email = z.email("Ingresa un correo electrónico válido.");
const password = z.string().min(8, "La contraseña debe tener al menos 8 caracteres.");

export const loginSchema = z.object({ email, password });

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Ingresa tu nombre.").max(60),
  lastName: z.string().trim().min(1, "Ingresa tu apellido.").max(80),
  email,
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/, "Usa 3 a 30 letras, números o guiones bajos."),
  birthDate: z.iso.date("Selecciona una fecha válida."),
  password,
  confirmPassword: z.string(),
  terms: z.literal("on", "Debes aceptar los términos para continuar."),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Las contraseñas no coinciden.",
});

export const recoverySchema = z.object({ email });
export const verificationSchema = z.object({
  email,
  token: z.string().regex(/^\d{6}$/, "Ingresa el código de seis dígitos."),
});
export const newPasswordSchema = z.object({
  password,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Las contraseñas no coinciden.",
});
