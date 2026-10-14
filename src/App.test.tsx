import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { characters, questions } from "./data/catalog";
import App from "./App";
import { loadTheme } from "./data/loadTheme";
vi.mock("./data/loadTheme", () => ({
  loadTheme: vi.fn(async (theme: string) => ({
    theme,
    version: "test",
    characters: characters.filter((c) =>
      theme === "fictional"
        ? c.category === "fictional"
        : c.category === "real",
    ),
    questions,
    source: {
      url: "https://www.wikidata.org",
      license: "CC0",
      retrievedAt: "2026-10-14",
    },
    quality: {},
  })),
}));
afterEach(() => {
  cleanup();
  localStorage.clear();
});
describe("OpenGuess v2", () => {
  it("keeps question guidance optional and reveals it on request", async () => {
    const u = userEvent.setup();
    render(<App />);
    await u.click(await screen.findByRole("button", { name: "Start guessing" }));
    const text = (await screen.findByTestId("question-text")).textContent;
    const question = questions.find((q) => q.text === text)!;
    expect(screen.getByText(question.hint)).not.toBeVisible();
    await u.click(screen.getByText("Help with this clue"));
    expect(screen.getByText(question.hint)).toBeVisible();
  });
  it("offers five separate universes and starts an adaptive round", async () => {
    const u = userEvent.setup();
    render(<App />);
    for (const name of ["People", "Characters", "Animals", "Objects", "Films"])
      expect(
        screen.getByRole("button", { name: new RegExp("^" + name) }),
      ).toBeVisible();
    await u.click(
      await screen.findByRole("button", { name: "Start guessing" }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("question-text")).toBeVisible(),
    );
    const first = screen.getByTestId("question-text").textContent;
    await u.click(screen.getByRole("button", { name: "Yes" }));
    await waitFor(() =>
      expect(screen.getByTestId("question-text").textContent).not.toBe(first),
    );
    await u.click(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() =>
      expect(screen.getByTestId("question-text")).toHaveTextContent(first!),
    );
  });
  it("persists a local profile, language and animation settings", async () => {
    const u = userEvent.setup();
    render(<App />);
    await u.click(screen.getByRole("button", { name: "Settings" }));
    await u.clear(screen.getByRole("textbox", { name: "Nickname" }));
    await u.type(screen.getByRole("textbox", { name: "Nickname" }), "MK");
    await u.click(screen.getByRole("button", { name: "Save profile" }));
    await u.selectOptions(
      screen.getByRole("combobox", { name: "Interface language" }),
      "ar",
    );
    expect(screen.getByTestId("app-shell")).toHaveAttribute("dir", "rtl");
    expect(
      JSON.parse(localStorage.getItem("openguess.progress.v2")!).profile
        .nickname,
    ).toBe("MK");
  });
  it("shows daily mysteries and real local collections without fake global ranks", async () => {
    const u = userEvent.setup();
    render(<App />);
    await u.click(screen.getByRole("button", { name: "Daily challenge" }));
    await waitFor(() =>
      expect(screen.getByText(/Five mysteries/)).toBeVisible(),
    );
    await u.click(screen.getByRole("button", { name: "Collection" }));
    expect(screen.getByText(/Your collection is waiting/)).toBeVisible();
  });
  it("records a confirmed guess and allows correcting the result-triggering answer", async () => {
    const u = userEvent.setup();
    render(<App />);
    await u.click(screen.getByRole("button", { name: /^Characters/ }));
    await u.click(
      await screen.findByRole("button", { name: "Start guessing" }),
    );
    const target = characters.find((c) => c.name === "Harry Potter")!;
    let last = "";
    await waitFor(() =>
      expect(screen.getByTestId("question-text")).toBeVisible(),
    );
    for (let i = 0; i < 40 && screen.queryByTestId("question-text"); i++) {
      last = screen.getByTestId("question-text").textContent!;
      const q = questions.find((q) => q.text === last)!;
      await u.click(
        screen.getByRole("button", {
          name: target.traits[q.id] ? "Yes" : "No",
        }),
      );
      await waitFor(() =>
        expect(
          screen.queryByText("Connecting the clues…"),
        ).not.toBeInTheDocument(),
      );
    }
    expect(screen.getByRole("heading", { name: "Harry Potter" })).toBeVisible();
    await u.click(screen.getByRole("button", { name: "Undo last answer" }));
    await waitFor(() =>
      expect(screen.getByTestId("question-text")).toHaveTextContent(last),
    );
    const q = questions.find((q) => q.text === last)!;
    await u.click(
      screen.getByRole("button", { name: target.traits[q.id] ? "Yes" : "No" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "That’s correct" }),
      ).toBeVisible(),
    );
    await u.click(screen.getByRole("button", { name: "That’s correct" }));
    expect(
      JSON.parse(localStorage.getItem("openguess.progress.v2")!).wins,
    ).toBe(1);
  });
});

it("retries the selected universe after a catalog loading failure", async () => {
  vi.mocked(loadTheme).mockRejectedValueOnce(new Error("Network failed"));
  const u = userEvent.setup();
  render(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "could not be loaded",
  );
  await u.click(screen.getByRole("button", { name: "Retry universe" }));
  const start = await screen.findByRole("button", { name: "Start guessing" });
  expect(start).toBeEnabled();
  await u.click(start);
  expect(await screen.findByTestId("question-text")).toBeVisible();
});
it("filters explicit adult word forms while retaining ordinary entries", async () => {
  const ordinary = characters.find((c) => c.category === "real")!;
  vi.mocked(loadTheme).mockResolvedValueOnce({
    theme: "people",
    version: "test",
    characters: [
      ordinary,
      {
        ...ordinary,
        id: "adult-a",
        name: "Adult A",
        description: "pornographic film performer",
      },
      {
        ...ordinary,
        id: "adult-b",
        name: "Adult B",
        description: "sex toys designer",
      },
    ],
    questions,
    source: {
      url: "https://www.wikidata.org",
      license: "CC0",
      retrievedAt: "2026-10-14",
    },
    quality: {},
  });
  const u = userEvent.setup();
  render(<App />);
  await screen.findByRole("button", { name: "Start guessing" });
  await u.click(screen.getByRole("button", { name: "Library" }));
  expect(
    screen.queryByRole("heading", { name: "Adult A" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Adult B" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: ordinary.name })).toBeVisible();
});
it("preserves the warning when browser storage cannot save a profile", async () => {
  const u = userEvent.setup();
  render(<App />);
  await u.click(screen.getByRole("button", { name: "Settings" }));
  const fail = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Full", "QuotaExceededError");
  });
  try {
    await u.clear(screen.getByRole("textbox", { name: "Nickname" }));
    await u.type(
      screen.getByRole("textbox", { name: "Nickname" }),
      "Unsaved Explorer",
    );
    await u.click(screen.getByRole("button", { name: "Save profile" }));
    expect(
      screen.getByText(/Your browser could not save progress/),
    ).toBeVisible();
  } finally {
    fail.mockRestore();
  }
});
it("admits uncertainty when semantic facts cannot distinguish two candidates", async () => {
  const first = characters[0];
  vi.mocked(loadTheme).mockResolvedValueOnce({
    theme: "people",
    version: "test",
    characters: [
      { ...first, id: "semantic-a", traits: { shared: true } },
      {
        ...first,
        id: "semantic-b",
        name: "Second person",
        traits: { shared: true },
      },
      {
        ...first,
        id: "semantic-c",
        name: "Third person",
        traits: { shared: false },
      },
    ],
    questions: [
      {
        id: "shared",
        text: "Is your person a scientist?",
        hint: "A meaningful fact.",
        kind: "semantic",
        family: "occupation",
      },
    ],
    source: {
      url: "https://www.wikidata.org",
      license: "CC0",
      retrievedAt: "2026-10-14",
    },
    quality: {},
  });
  const u = userEvent.setup();
  render(<App />);
  await u.click(await screen.findByRole("button", { name: "Start guessing" }));
  await u.click(await screen.findByRole("button", { name: "Yes" }));
  expect(
    await screen.findByRole("heading", { name: "You stumped me!" }),
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "That’s correct" }),
  ).not.toBeInTheDocument();
});
it("defaults to featured facts while keeping the full catalog visible and opt-in", async () => {
  const first = characters[0];
  vi.mocked(loadTheme).mockResolvedValueOnce({
    theme: "people",
    version: "test",
    characters: [
      {
        ...first,
        id: "featured-a",
        name: "Featured A",
        featured: true,
        traits: { shared: true },
      },
      {
        ...first,
        id: "featured-b",
        name: "Featured B",
        featured: true,
        traits: { shared: false },
      },
      {
        ...first,
        id: "experimental-c",
        name: "Experimental C",
        featured: false,
        traits: { shared: null },
      },
    ],
    questions: [
      {
        id: "shared",
        text: "Is your person a scientist?",
        hint: "A meaningful fact.",
        kind: "semantic",
        family: "occupation",
      },
    ],
    source: {
      url: "https://www.wikidata.org",
      license: "CC0",
      retrievedAt: "2026-10-14",
    },
    quality: {},
  });
  const u = userEvent.setup();
  render(<App />);
  const featured = await screen.findByRole("button", {
    name: "Featured discoveries",
  });
  expect(featured).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByText(/2 featured choices/)).toBeVisible();
  await u.click(screen.getByRole("button", { name: "Library" }));
  expect(screen.getByRole("heading", { name: "Experimental C" })).toBeVisible();
  await u.click(screen.getByRole("button", { name: "Play" }));
  await u.click(
    screen.getByRole("button", {
      name: "Full catalog (experimental)",
    }),
  );
  await u.click(screen.getByRole("button", { name: "Start guessing" }));
  expect(await screen.findByTestId("question-text")).toBeVisible();
  expect(screen.getByText(/3 entries/)).toBeVisible();
});
it("allows retrying the same backup file after an invalid import", async () => {
  const u = userEvent.setup();
  render(<App />);
  await u.click(screen.getByRole("button", { name: "Settings" }));
  const input = screen.getByLabelText("Import progress") as HTMLInputElement;
  const file = new File(["{}"], "invalid.json", { type: "application/json" });
  const read = vi.fn(async () => "{}");
  Object.defineProperty(file, "text", { value: read });
  await u.upload(input, file);
  await screen.findByText(/That file is not a valid/);
  expect(input.value).toBe("");
  await u.upload(input, file);
  await waitFor(() => expect(read).toHaveBeenCalledTimes(2));
});
