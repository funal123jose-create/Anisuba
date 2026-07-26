import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getCurrentUserProfile = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name,last_name,display_name,username,avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const metadata = user.user_metadata;
  const metadataName = [metadata.first_name, metadata.last_name].filter(Boolean).join(" ");
  const displayName = profile?.display_name
    ?? metadata.display_name
    ?? metadataName
    ?? user.email?.split("@")[0]
    ?? "Usuario";

  return {
    id: user.id,
    email: user.email ?? "",
    displayName,
    username: profile?.username ?? metadata.username ?? "",
    avatarUrl: profile?.avatar_url ?? null,
  };
});
