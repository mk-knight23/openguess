import { describe, it, expect, vi } from "vitest";
import { createProgress } from "./progress";
import {
  createCloudClient,
  saveCloudProgress,
  loadCloudProgress,
  publishScore,
  removePublishedScore,
  listLeaderboard,
} from "./cloud";
import type { SupabaseClient } from "@supabase/supabase-js";
function client(
  user: string | null = "user-one",
  result: { data: unknown; error: unknown } = { data: null, error: null },
) {
  const terminal = vi.fn().mockResolvedValue(result);
  const chain: any = {
    upsert: terminal,
    delete: () => chain,
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: terminal,
    maybeSingle: terminal,
  };
  const c = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: user ? { id: user } : null },
        error: null,
      }),
    },
    from: vi.fn(() => chain),
    rpc: terminal,
  };
  return { c: c as unknown as SupabaseClient, chain, terminal };
}
describe("optional cloud integration", () => {
  it("rejects private keys and insecure origins at client setup", () => {
    expect(createCloudClient("", "")).toBeNull();
    expect(() =>
      createCloudClient("https://test.supabase.co", "sb_secret_private"),
    ).toThrow();
    expect(() =>
      createCloudClient("http://bad.test", "sb_publishable_example"),
    ).toThrow();
  });
  it("requires authenticated ownership for cloud mutations", async () => {
    const { c } = client(null);
    await expect(saveCloudProgress(c, createProgress())).rejects.toThrow(
      "Sign in",
    );
    await expect(publishScore(c, createProgress())).rejects.toThrow("Sign in");
  });
  it("backs up only the authenticated owner and validates the document", async () => {
    const { c, terminal } = client();
    await saveCloudProgress(c, createProgress());
    expect(terminal.mock.calls[0][0]).toMatchObject({
      user_id: "user-one",
      progress: createProgress(),
    });
  });
  it("restores validated progress and rejects corrupt server payloads", async () => {
    const good = client("user-one", {
      data: { progress: createProgress() },
      error: null,
    });
    expect(await loadCloudProgress(good.c)).toEqual(createProgress());
    const bad = client("user-one", {
      data: { progress: { schema: "evil" } },
      error: null,
    });
    await expect(loadCloudProgress(bad.c)).rejects.toThrow();
  });
  it("publishes only nickname and self reported wins, never email/progress", async () => {
    const { c, terminal } = client();
    await publishScore(c, { ...createProgress(), wins: 3 });
    expect(terminal.mock.calls[0][0]).toEqual({
      user_id: "user-one",
      nickname: "Guest",
      wins: 3,
    });
  });
  it("propagates provider failures instead of pretending success", async () => {
    const { c } = client("user-one", {
      data: null,
      error: { message: "Network unavailable" },
    });
    await expect(saveCloudProgress(c, createProgress())).rejects.toThrow(
      "Network unavailable",
    );
  });
  it("limits public leaderboard reads and supports opt out", async () => {
    const { c, terminal } = client("user-one", {
      data: [{ nickname: "Player", wins: 2 }],
      error: null,
    });
    expect(await listLeaderboard(c)).toEqual([{ nickname: "Player", wins: 2 }]);
    expect(terminal).toHaveBeenCalledWith("og_public_scores");
    await removePublishedScore(c);
  });
});
