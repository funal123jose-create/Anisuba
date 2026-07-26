function requireEnvironmentValue(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Falta la variable ${name}.`);
  return value;
}

const supabaseUrl = requireEnvironmentValue(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
const supabasePublishableKey = requireEnvironmentValue(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
);

export { supabasePublishableKey, supabaseUrl };
