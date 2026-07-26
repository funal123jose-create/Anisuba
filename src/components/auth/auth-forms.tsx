"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  loginAction,
  newPasswordAction,
  recoveryAction,
  registerAction,
  resendVerificationAction,
  verifyAction,
  type AuthActionState,
} from "@/app/(auth)/actions";

const initialState: AuthActionState = {};

function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="auth-submit" type="submit">
      <span>{children}</span><ArrowRight size={17} />
    </button>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <small className="auth-field-error">{errors[0]}</small>;
}

function PasswordField({
  name,
  label,
  placeholder,
  errors,
  onChange,
}: {
  name: string;
  label: string;
  placeholder: string;
  errors?: string[];
  onChange?: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="auth-input-wrap">
        <LockKeyhole size={16} />
        <input
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={name === "password" ? "current-password" : "new-password"}
          onChange={(event) => onChange?.(event.target.value)}
          required
        />
        <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}>
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
      <FieldError errors={errors} />
    </label>
  );
}

function FormNotice({ state, banner }: { state: AuthActionState; banner?: string }) {
  if (!state.error && !state.success && !banner) return null;
  return <p className={`auth-notice ${state.error ? "is-error" : "is-success"}`}>{state.error ?? state.success ?? banner}</p>;
}

function GithubMark() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 0C3.58 0 0 3.64 0 8.13c0 3.59 2.29 6.64 5.47 7.71.4.08.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.23.49-2.7-1.09-2.7-1.09-.36-.93-.88-1.18-.88-1.18-.72-.5.05-.49.05-.49.8.06 1.22.83 1.22.83.71 1.23 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.21-3.64-.9-3.64-4.02 0-.89.31-1.62.82-2.19-.08-.21-.36-1.04.08-2.16 0 0 .67-.22 2.2.84A7.5 7.5 0 0 1 8 3.58c.68 0 1.36.09 2 .27 1.53-1.06 2.2-.84 2.2-.84.44 1.12.16 1.95.08 2.16.51.57.82 1.3.82 2.19 0 3.13-1.87 3.81-3.65 4.02.29.25.54.74.54 1.5 0 1.08-.01 1.95-.01 2.22 0 .21.15.46.55.38A8.02 8.02 0 0 0 16 8.13C16 3.64 12.42 0 8 0Z" />
    </svg>
  );
}

function SocialOptions({ includeGithub = false }: { includeGithub?: boolean }) {
  return (
    <>
      <div className="auth-divider"><span>o continúa con</span></div>
      <div className={`auth-socials ${includeGithub ? "is-three" : ""}`} aria-label="Proveedores sociales disponibles próximamente">
        <button type="button" disabled title="Google estará disponible en el siguiente bloque"><strong>G</strong> Google <small>Próximamente</small></button>
        <button type="button" disabled title="Discord estará disponible más adelante"><strong>◈</strong> Discord <small>Próximamente</small></button>
        {includeGithub && (
          <button type="button" disabled title="GitHub estará disponible más adelante">
            <strong className="social-icon-outline social-icon-github"><GithubMark /></strong> GitHub <small>Próximamente</small>
          </button>
        )}
      </div>
    </>
  );
}

export function LoginForm({ banner }: { banner?: string }) {
  const [state, action] = useActionState(loginAction, initialState);
  return (
    <div className="auth-card auth-card-login">
      <button className="auth-language-selector" type="button" aria-disabled="true" title="Selector de idioma disponible próximamente">
        <Globe2 size={15} /><span>ES</span>
      </button>
      <div className="auth-card-heading"><span>Bienvenido de vuelta a AniSuba</span><h2>Inicia sesión</h2><p>Continúa explorando tu universo anime.</p></div>
      <FormNotice state={state} banner={banner} />
      <form action={action} className="auth-form">
        <label className="auth-field">
          <span>Correo electrónico</span>
          <span className="auth-input-wrap"><Mail size={16} /><input name="email" type="email" placeholder="tu@correo.com" autoComplete="email" required /></span>
          <FieldError errors={state.fieldErrors?.email} />
        </label>
        <PasswordField name="password" label="Contraseña" placeholder="Tu contraseña" errors={state.fieldErrors?.password} />
        <div className="auth-form-meta">
          <label><input type="checkbox" name="remember" defaultChecked /> <span>Recordarme</span></label>
          <Link href="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
        </div>
        <SubmitButton>Iniciar sesión</SubmitButton>
      </form>
      <SocialOptions includeGithub />
      <p className="auth-switch">¿Aún no tienes cuenta? <Link href="/registro">Crea una gratis</Link></p>
    </div>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, initialState);
  const [password, setPassword] = useState("");
  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  return (
    <div className="auth-card auth-card-register">
      <div className="auth-card-heading"><span>Únete a AniSuba</span><h2>Crea tu cuenta</h2><p>Tu próxima gran historia comienza hoy.</p></div>
      <FormNotice state={state} />
      <form action={action} className="auth-form">
        <div className="auth-fields-grid">
          <label className="auth-field"><span>Nombre</span><span className="auth-input-wrap"><UserRound size={16} /><input name="firstName" placeholder="José" autoComplete="given-name" required /></span><FieldError errors={state.fieldErrors?.firstName} /></label>
          <label className="auth-field"><span>Apellido</span><span className="auth-input-wrap"><UserRound size={16} /><input name="lastName" placeholder="Luis" autoComplete="family-name" required /></span><FieldError errors={state.fieldErrors?.lastName} /></label>
        </div>
        <label className="auth-field"><span>Correo electrónico</span><span className="auth-input-wrap"><Mail size={16} /><input name="email" type="email" placeholder="tu@correo.com" autoComplete="email" required /></span><FieldError errors={state.fieldErrors?.email} /></label>
        <div className="auth-fields-grid">
          <label className="auth-field"><span>Nombre de usuario</span><span className="auth-input-wrap"><AtSign size={16} /><input name="username" placeholder="jose_anime" autoComplete="username" required /></span><FieldError errors={state.fieldErrors?.username} /></label>
          <label className="auth-field"><span>Fecha de nacimiento</span><span className="auth-input-wrap"><CalendarDays size={16} /><input name="birthDate" type="date" required /></span><FieldError errors={state.fieldErrors?.birthDate} /></label>
        </div>
        <PasswordField name="password" label="Contraseña" placeholder="Mínimo 8 caracteres" errors={state.fieldErrors?.password} onChange={setPassword} />
        <div className="password-strength" aria-label={`Seguridad de contraseña: ${strength} de 4`}>
          <span>{[1, 2, 3, 4].map((step) => <i className={step <= strength ? "is-active" : ""} key={step} />)}</span>
          <small>{strength < 2 ? "Usa mayúsculas, números y símbolos" : strength < 4 ? "Buena contraseña" : "Contraseña segura"}</small>
        </div>
        <PasswordField name="confirmPassword" label="Confirmar contraseña" placeholder="Repite tu contraseña" errors={state.fieldErrors?.confirmPassword} />
        <label className="auth-terms"><input name="terms" type="checkbox" /><span>Acepto los <Link href="#terminos">términos</Link> y la <Link href="#privacidad">política de privacidad</Link>.</span></label>
        <FieldError errors={state.fieldErrors?.terms} />
        <SubmitButton>Crear mi cuenta</SubmitButton>
      </form>
      <SocialOptions />
      <p className="auth-switch">¿Ya tienes una cuenta? <Link href="/login">Inicia sesión</Link></p>
    </div>
  );
}

export function RecoveryForm() {
  const [state, action] = useActionState(recoveryAction, initialState);
  return (
    <div className="auth-card auth-card-recovery">
      <Link className="auth-back" href="/login"><ArrowLeft size={15} /> Volver al inicio de sesión</Link>
      <span className="auth-icon"><KeyRound size={24} /></span>
      <div className="auth-card-heading"><span>Recupera tu acceso</span><h2>¿Olvidaste tu contraseña?</h2><p>Escribe el correo asociado a tu cuenta y te enviaremos un enlace seguro.</p></div>
      <FormNotice state={state} />
      <form action={action} className="auth-form">
        <label className="auth-field"><span>Correo electrónico</span><span className="auth-input-wrap"><Mail size={16} /><input name="email" type="email" placeholder="tu@correo.com" autoComplete="email" required /></span><FieldError errors={state.fieldErrors?.email} /></label>
        <p className="auth-info"><ShieldCheck size={17} /> El enlace será de un solo uso y tendrá una duración limitada.</p>
        <SubmitButton>Enviar enlace de recuperación</SubmitButton>
      </form>
      <SocialOptions />
      <p className="auth-switch">¿Recordaste tu contraseña? <Link href="/login">Inicia sesión</Link></p>
    </div>
  );
}

export function VerificationForm({ email, resent }: { email: string; resent?: boolean }) {
  const [state, action] = useActionState(verifyAction, initialState);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const token = digits.join("");

  function updateDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => current.map((item, position) => position === index ? digit : item));
    if (digit) document.getElementById(`otp-${index + 1}`)?.focus();
  }

  return (
    <div className="auth-card auth-card-verification">
      <span className="auth-icon"><Mail size={24} /></span>
      <div className="auth-card-heading">
        <span>Un paso más</span>
        <h2>Verifica tu cuenta</h2>
        <p>Enviamos un enlace de confirmación a<br /><strong>{email || "tu correo electrónico"}</strong></p>
      </div>
      <FormNotice state={state} banner={resent ? "Te enviamos un correo de verificación nuevo." : undefined} />
      <p className="verification-link-note"><ShieldCheck size={16} /> Abre el enlace del correo para continuar. Si el mensaje incluye un código, también puedes ingresarlo aquí.</p>
      <form action={action} className="auth-form">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="token" value={token} />
        <div className="otp-grid" aria-label="Código de verificación">
          {digits.map((digit, index) => (
            <input
              id={`otp-${index}`}
              key={index}
              value={digit}
              onChange={(event) => updateDigit(index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !digit) document.getElementById(`otp-${index - 1}`)?.focus();
              }}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              aria-label={`Dígito ${index + 1}`}
            />
          ))}
        </div>
        <FieldError errors={state.fieldErrors?.token} />
        <SubmitButton>Verificar y continuar</SubmitButton>
      </form>
      <div className="verification-help">
        <p>¿No recibiste el código?</p>
        <form action={resendVerificationAction}><input type="hidden" name="email" value={email} /><button type="submit">Reenviar código</button></form>
        <Link href="/registro">Cambiar correo electrónico</Link>
      </div>
    </div>
  );
}

export function NewPasswordForm() {
  const [state, action] = useActionState(newPasswordAction, initialState);
  const [password, setPassword] = useState("");
  const ready = password.length >= 8;
  return (
    <div className="auth-card auth-card-recovery">
      <span className="auth-icon"><LockKeyhole size={24} /></span>
      <div className="auth-card-heading"><span>Protege tu cuenta</span><h2>Crea una nueva contraseña</h2><p>Elige una contraseña distinta y difícil de adivinar.</p></div>
      <FormNotice state={state} />
      <form action={action} className="auth-form">
        <PasswordField name="password" label="Nueva contraseña" placeholder="Mínimo 8 caracteres" errors={state.fieldErrors?.password} onChange={setPassword} />
        <p className={`auth-password-tip ${ready ? "is-ready" : ""}`}><Check size={15} /> Al menos 8 caracteres</p>
        <PasswordField name="confirmPassword" label="Confirmar contraseña" placeholder="Repite la nueva contraseña" errors={state.fieldErrors?.confirmPassword} />
        <SubmitButton>Guardar nueva contraseña</SubmitButton>
      </form>
      <p className="auth-switch"><Link href="/login">Volver al inicio de sesión</Link></p>
    </div>
  );
}
