import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import type { Progress } from "./progress";
import {
  getCloudClient,
  saveCloudProgress,
  loadCloudProgress,
  publishScore,
  removePublishedScore,
  deleteCloudProgress,
  listLeaderboard,
  type LeaderboardEntry,
} from "./cloud";
import "./CloudPanel.css";
export interface CloudPanelProps {
  progress: Progress;
  onReplace: (progress: Progress) => boolean | void;
  onNotice: (message: string) => void;
}
export function CloudPanel({ progress, onReplace, onNotice }: CloudPanelProps) {
  const [client] = useState(getCloudClient);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [pending, setPending] = useState<Progress | null>(null);
  const [authAction, setAuthAction] = useState<"login" | "signup">("login");
  useEffect(() => {
    if (!client) return;
    let active = true;
    client.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user);
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
        setPending(null);
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);
  async function run(action: () => Promise<string>) {
    setBusy(true);
    setMessage("");
    try {
      const result = await action();
      setMessage(result);
      onNotice(result);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Cloud request failed. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function authenticate(event: FormEvent) {
    event.preventDefault();
    if (!client) return;
    await run(async () => {
      if (authAction === "signup") {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + window.location.pathname,
          },
        });
        if (error) throw error;
        setPassword("");
        return data.session
          ? "Account created. You are signed in."
          : "Check your email to confirm your account. Email delivery depends on the project mail configuration.";
      }
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setPassword("");
      return "Signed in. Your local progress has not changed.";
    });
  }
  if (!client)
    return (
      <section className="cloud-panel">
        <h2>Optional cloud account</h2>
        <p>
          Cloud features are not configured for this deployment. Play and export
          progress locally for free.
        </p>
      </section>
    );
  return (
    <section className="cloud-panel" aria-labelledby="cloud-title">
      <h2 id="cloud-title">Optional cloud account</h2>
      <p>
        Play freely without an account. Sign in only if you want a private
        backup or an opt-in public score.
      </p>
      {user ? (
        <div className="cloud-account">
          <p>
            Signed in as <strong>{user.email ?? "your account"}</strong>
          </p>
          <div className="cloud-actions">
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await saveCloudProgress(client, progress);
                  return "Cloud backup saved. Local progress is unchanged.";
                })
              }
            >
              Save cloud backup
            </button>
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const saved = await loadCloudProgress(client);
                  setPending(saved);
                  return saved
                    ? "Cloud backup loaded for review. Confirm below to replace local progress."
                    : "No cloud backup has been saved yet.";
                })
              }
            >
              Review cloud backup
            </button>
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await publishScore(client, progress);
                  return "Your nickname and self-reported win count are now public.";
                })
              }
            >
              Publish nickname and wins
            </button>
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await removePublishedScore(client);
                  return "Public score removed.";
                })
              }
            >
              Remove public score
            </button>
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await deleteCloudProgress(client);
                  setPending(null);
                  return "Private cloud backup deleted. Local progress is unchanged.";
                })
              }
            >
              Delete cloud backup
            </button>
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const { error } = await client.auth.signOut();
                  if (error) throw error;
                  return "Signed out. Local progress is unchanged.";
                })
              }
            >
              Sign out
            </button>
          </div>
          {pending && (
            <div className="cloud-restore">
              <p>
                Backup: {pending.profile.nickname}, {pending.wins} wins,{" "}
                {pending.collection.length} collected entries. Restoring
                replaces this browser’s progress.
              </p>
              <button
                disabled={busy}
                onClick={() => {
                  const saved = onReplace(pending);
                  setPending(null);
                  setMessage(
                    saved === false
                      ? "Restored for this session, but browser storage could not save it. Export a backup."
                      : "Local progress replaced with your cloud backup.",
                  );
                }}
              >
                Confirm replace local progress
              </button>
              <button onClick={() => setPending(null)}>Cancel restore</button>
            </div>
          )}
        </div>
      ) : (
        <form
          onSubmit={(event) => void authenticate(event)}
          className="cloud-auth"
        >
          <div className="cloud-auth-mode">
            <button
              type="button"
              aria-pressed={authAction === "login"}
              onClick={() => setAuthAction("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              aria-pressed={authAction === "signup"}
              onClick={() => setAuthAction("signup")}
            >
              Create account
            </button>
          </div>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete={
                authAction === "login" ? "current-password" : "new-password"
              }
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button type="submit" disabled={busy}>
            {busy
              ? "Please wait…"
              : authAction === "login"
                ? "Sign in with email"
                : "Create free account"}
          </button>
          <p className="cloud-small">
            Email confirmation may be required. If confirmation mail is
            unavailable, keep playing locally; no progress is lost.
          </p>
        </form>
      )}
      <p role="status" className="cloud-message">
        {message}
      </p>
      <h3>Community scores</h3>
      <p className="cloud-small">
        Optional, self-reported wins. These are not verified competitive
        rankings. Only published nicknames and win counts appear.
      </p>
      <button
        disabled={busy}
        onClick={() =>
          void run(async () => {
            setBoard(await listLeaderboard(client));
            return "Community scores refreshed.";
          })
        }
      >
        Refresh community scores
      </button>
      {board.length > 0 ? (
        <ol className="cloud-leaderboard">
          {board.map((entry, index) => (
            <li key={`${index}:${entry.nickname}`}>
              <span>{entry.nickname}</span>
              <strong>{entry.wins.toLocaleString()} wins</strong>
            </li>
          ))}
        </ol>
      ) : (
        <p className="cloud-small">
          Refresh to load published scores. No example scores are shown.
        </p>
      )}
    </section>
  );
}
