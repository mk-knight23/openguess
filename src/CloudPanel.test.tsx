import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { CloudPanel } from "./CloudPanel";
import { createProgress } from "./progress";
const state = vi.hoisted(() => ({
  client: null as any,
  backup: null as any,
  load: vi.fn(),
}));
vi.mock("./cloud", () => ({
  getCloudClient: () => state.client,
  loadCloudProgress: state.load,
  saveCloudProgress: vi.fn(),
  publishScore: vi.fn(),
  removePublishedScore: vi.fn(),
  deleteCloudProgress: vi.fn(),
  listLeaderboard: vi.fn().mockResolvedValue([]),
}));
beforeEach(() => {
  state.client = null;
  state.load.mockReset();
});
afterEach(cleanup);
function signedIn() {
  state.client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "owner", email: "test@example.invalid" } },
      }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  };
  state.load.mockResolvedValue({ ...createProgress(), wins: 9 });
}
describe("optional cloud panel", () => {
  it("keeps offline mode honest when no service is configured", () => {
    render(
      <CloudPanel
        progress={createProgress()}
        onReplace={vi.fn()}
        onNotice={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/Cloud features are not configured/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save cloud backup" }),
    ).not.toBeInTheDocument();
  });
  it("requires reviewing and confirming before replacing local progress", async () => {
    signedIn();
    const replace = vi.fn();
    render(
      <CloudPanel
        progress={createProgress()}
        onReplace={replace}
        onNotice={vi.fn()}
      />,
    );
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Review cloud backup" }),
    );
    await screen.findByText(/Backup: Guest, 9 wins/);
    expect(replace).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Confirm replace local progress" }),
    );
    expect(replace).toHaveBeenCalledWith(expect.objectContaining({ wins: 9 }));
  });
  it("preserves the storage failure warning on restore", async () => {
    signedIn();
    render(
      <CloudPanel
        progress={createProgress()}
        onReplace={() => false}
        onNotice={vi.fn()}
      />,
    );
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Review cloud backup" }),
    );
    await user.click(
      await screen.findByRole("button", {
        name: "Confirm replace local progress",
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "browser storage could not save it",
    );
  });
});
