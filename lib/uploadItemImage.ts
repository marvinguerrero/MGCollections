import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "item-images";

/**
 * crypto.randomUUID() only exists in secure contexts (HTTPS or localhost) —
 * accessing the dev server over a LAN IP doesn't qualify, so this falls back
 * to a timestamp + random suffix, which is unique enough for a file path.
 */
function uniqueId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Uploads to <userId>/<uuid>.<ext> — storage RLS requires that folder prefix to match auth.uid(). */
export async function uploadItemImage(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<{ url: string | null; error: Error | null }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${uniqueId()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) return { url: null, error };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
