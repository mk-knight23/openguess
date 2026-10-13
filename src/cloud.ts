import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseProgress, exportProgress, type Progress } from "./progress";
export interface LeaderboardEntry {
  nickname: string;
  wins: number;
}
export function createCloudClient(
  url: string,
  key: string,
): SupabaseClient | null {
  if (!url || !key) return null;
  const origin = new URL(url);
  if (origin.protocol !== "https:" || origin.username || origin.password)
    throw new Error("Cloud service requires a secure URL.");
  if (key.startsWith("sb_secret_"))
    throw new Error("Private cloud keys must never be exposed to the browser.");
  if (!key.startsWith("sb_publishable_")) {
    try {
      const payload = JSON.parse(atob(key.split(".")[1]));
      if (payload.role !== "anon") throw new Error();
    } catch {
      throw new Error(
        "Only a Supabase publishable or anonymous key is allowed.",
      );
    }
  }
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
let singleton: SupabaseClient | null | undefined;
export function getCloudClient(): SupabaseClient | null {
  if (singleton === undefined)
    singleton = createCloudClient(
      import.meta.env.VITE_SUPABASE_URL ?? "",
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    );
  return singleton;
}
async function owner(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Sign in to use cloud progress.");
  return data.user.id;
}
function check(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}
export async function saveCloudProgress(
  client: SupabaseClient,
  p: Progress,
): Promise<void> {
  const user_id = await owner(client);
  const progress = parseProgress(exportProgress(p));
  if (JSON.stringify(progress).length > 2_000_000)
    throw new Error(
      "Cloud backups are limited to 2 MB. Export a local backup for larger collections.",
    );
  const { error } = await client
    .from("og_progress")
    .upsert(
      { user_id, progress, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  check(error);
}
export async function loadCloudProgress(
  client: SupabaseClient,
): Promise<Progress | null> {
  const user_id = await owner(client);
  const { data, error } = await client
    .from("og_progress")
    .select("progress")
    .eq("user_id", user_id)
    .maybeSingle();
  check(error);
  return data ? parseProgress(JSON.stringify(data.progress)) : null;
}
export async function publishScore(
  client: SupabaseClient,
  p: Progress,
): Promise<void> {
  const user_id = await owner(client);
  const valid = parseProgress(exportProgress(p));
  const { error } = await client
    .from("og_leaderboard")
    .upsert(
      { user_id, nickname: valid.profile.nickname, wins: valid.wins },
      { onConflict: "user_id" },
    );
  check(error);
}
export async function removePublishedScore(
  client: SupabaseClient,
): Promise<void> {
  const user_id = await owner(client);
  const { error } = await client
    .from("og_leaderboard")
    .delete()
    .eq("user_id", user_id);
  check(error);
}
export async function deleteCloudProgress(
  client: SupabaseClient,
): Promise<void> {
  const user_id = await owner(client);
  const { error } = await client
    .from("og_progress")
    .delete()
    .eq("user_id", user_id);
  check(error);
}
export async function listLeaderboard(
  client: SupabaseClient,
): Promise<LeaderboardEntry[]> {
  const { data, error } = await client.rpc("og_public_scores");
  check(error);
  return (data ?? [])
    .filter(
      (row: unknown): row is LeaderboardEntry =>
        !!row &&
        typeof row === "object" &&
        typeof (row as LeaderboardEntry).nickname === "string" &&
        (row as LeaderboardEntry).nickname.length <= 40 &&
        Number.isSafeInteger((row as LeaderboardEntry).wins) &&
        (row as LeaderboardEntry).wins >= 0,
    )
    .map(({ nickname, wins }: LeaderboardEntry) => ({ nickname, wins }));
}
