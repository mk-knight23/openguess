// Live ownership verification. Creates two disposable confirmed users without sending mail,
// exercises the public API, and always removes both users and cascaded rows.
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
const env = { ...parseEnv(readFileSync(".env.local", "utf8")), ...process.env };
const url = env.SUPABASE_URL;
const key = env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
if (!url || !key || !service)
  throw new Error("Private verification credentials are unavailable.");
const opts = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};
const admin = createClient(url, service, opts);
const users = [];
let checks = 0;
const ok = (condition, message) => {
  assert.ok(condition, message);
  checks++;
};
const progress = {
  schema: "openguess.progress/v2",
  profile: { nickname: "RLS verification" },
  settings: {
    language: "en",
    sound: false,
    reducedMotion: false,
    familyMode: true,
  },
  wins: 1,
  points: 100,
  streak: 1,
  lastWinDate: "2026-10-14",
  collection: [],
  recent: [],
  daily: {},
};
try {
  for (let i = 0; i < 2; i++) {
    const email = `og-verification-${randomUUID()}@example.invalid`;
    const password = `${randomUUID()}!Aa7`;
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    ok(!created.error && created.data.user, "Disposable user creation failed.");
    users.push({
      id: created.data.user.id,
      email,
      password,
      client: createClient(url, key, opts),
    });
    const login = await users[i].client.auth.signInWithPassword({
      email,
      password,
    });
    ok(!login.error, "Disposable user login failed.");
  }
  const [a, b] = users;
  const anon = createClient(url, key, opts);
  let result = await a.client
    .from("og_progress")
    .upsert({ user_id: a.id, progress });
  ok(!result.error, "Owner progress insert failed.");
  result = await a.client
    .from("og_progress")
    .select("progress")
    .eq("user_id", a.id);
  ok(!result.error && result.data.length === 1, "Owner read failed.");
  result = await b.client
    .from("og_progress")
    .select("progress")
    .eq("user_id", a.id);
  ok(
    !result.error && result.data.length === 0,
    "Another user can read private progress.",
  );
  result = await anon.from("og_progress").select("progress");
  ok(
    !!result.error || result.data.length === 0,
    "Signed-out user can read private progress.",
  );
  result = await b.client
    .from("og_progress")
    .upsert({ user_id: a.id, progress });
  ok(!!result.error, "Another user can overwrite progress.");
  result = await b.client
    .from("og_progress")
    .update({ progress: { ...progress, wins: 99 } })
    .eq("user_id", a.id)
    .select("progress");
  ok(
    !result.error && result.data.length === 0,
    "Another user can update private progress.",
  );
  result = await a.client
    .from("og_progress")
    .update({ user_id: b.id })
    .eq("user_id", a.id);
  ok(!!result.error, "Owner can transfer progress ownership.");
  result = await a.client
    .from("og_progress")
    .upsert({ user_id: a.id, progress: { ...progress, wins: 2 } });
  ok(!result.error, "Owner update failed.");
  result = await a.client
    .from("og_leaderboard")
    .upsert({ user_id: a.id, nickname: "RLS verification", wins: 2 });
  ok(!result.error, "Opt-in publication failed.");
  result = await anon.rpc("og_public_scores");
  ok(
    !result.error &&
      result.data.some(
        (row) => row.nickname === "RLS verification" && row.wins === 2,
      ),
    "Public score unavailable.",
  );
  result = await b.client
    .from("og_leaderboard")
    .select("user_id")
    .eq("user_id", a.id);
  ok(
    !result.error && result.data.length === 0,
    "Signed-in visitor can enumerate other account owner IDs.",
  );
  result = await anon.from("og_leaderboard").select("user_id");
  ok(!!result.error, "Signed-out visitor can read owner IDs.");
  result = await b.client.rpc("og_public_scores");
  ok(
    !result.error &&
      result.data.some(
        (row) =>
          row.nickname === "RLS verification" &&
          row.wins === 2 &&
          Object.keys(row).length === 2,
      ),
    "Signed-in public projection is unavailable or leaks fields.",
  );
  result = await b.client
    .from("og_leaderboard")
    .update({ wins: 999 })
    .eq("user_id", a.id)
    .select("nickname");
  ok(
    !result.error && result.data.length === 0,
    "Another user can change public score.",
  );
  result = await anon
    .from("og_leaderboard")
    .insert({ user_id: b.id, nickname: "Forbidden", wins: 999 });
  ok(!!result.error, "Signed-out user can publish scores.");
  result = await a.client.from("og_leaderboard").delete().eq("user_id", a.id);
  ok(!result.error, "Opt-out failed.");
  result = await anon.rpc("og_public_scores");
  ok(
    !result.error &&
      !result.data.some((row) => row.nickname === "RLS verification"),
    "Opted-out score remains public.",
  );
  result = await b.client.from("og_progress").delete().eq("user_id", a.id);
  ok(!result.error, "Denied delete request failed unexpectedly.");
  result = await a.client
    .from("og_progress")
    .select("progress")
    .eq("user_id", a.id);
  ok(
    !result.error && result.data.length === 1,
    "Another user deleted private progress.",
  );
  result = await a.client.from("og_progress").delete().eq("user_id", a.id);
  ok(!result.error, "Owner delete failed.");
  console.log(`Cloud API ownership verification passed: ${checks} checks.`);
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Cloud verification failed.",
  );
  process.exitCode = 1;
} finally {
  for (const user of users) {
    await user.client.auth.signOut();
    const deleted = await admin.auth.admin.deleteUser(user.id);
    if (deleted.error) {
      console.error("Disposable user cleanup failed.");
      process.exitCode = 1;
    }
  }
  console.log("Disposable verification accounts cleaned up.");
}
