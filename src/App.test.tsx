import {
  act,
  configure,
  fireEvent,
  render,
  screen,
  cleanup,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { characters, questions } from "./data/catalog";
import App from "./App";
import { loadTheme } from "./data/loadTheme";
vi.mock("./data/loadTheme", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./data/loadTheme")>();
  return { loadTheme: vi.fn(actual.loadTheme) };
});
configure({ asyncUtilTimeout: 4000 });
vi.setConfig({ testTimeout: 120000 });
afterEach(() => {
  vi.useRealTimers();
  cleanup();
  localStorage.clear();
});
describe("OpenGuess v2", () => {
  it("uses reviewed familiar clues in the featured pool", async () => {
    const entries = Array.from({ length: 4 }, (_, n) => ({
      ...characters[0],
      id: `scope-${n}`,
      name: `Scope ${n}`,
      featured: true,
      traits: { raw: n < 2, reviewed: n === 0 },
    }));
    vi.mocked(loadTheme).mockResolvedValueOnce({
      theme: "people",
      version: "test",
      characters: entries,
      questions: [
        {
          id: "raw",
          text: "Does this person have an obscure imported classification?",
          hint: "Unreviewed source template.",
          tier: "broad",
          answerability: "specialist",
        },
        {
          id: "reviewed",
          text: "Does this person play a familiar instrument?",
          hint: "Reviewed familiar clue.",
          tier: "broad",
          answerability: "familiar",
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
    await u.click(
      await screen.findByRole("button", { name: "Start guessing" }),
    );
    expect(await screen.findByTestId("question-text")).toHaveTextContent(
      "Does this person play a familiar instrument?",
    );
  });
  it("keeps question guidance optional and reveals it on request", async () => {
    const pack = await loadTheme("people");
    const u = userEvent.setup();
    render(<App />);
    await u.click(
      await screen.findByRole("button", { name: "Start guessing" }),
    );
    const text = (await screen.findByTestId("question-text")).textContent;
    const question = pack.questions.find((q) => q.text === text)!;
    expect(screen.getByText(question.hint)).not.toBeVisible();
    await u.click(screen.getByText("Help with this clue"));
    expect(screen.getByText(question.hint)).toBeVisible();
  });
  it("does not confidently present an identity without familiar distinctive evidence", async () => {
    const broad = ["gender", "career", "origin"].map((id) => ({
      id,
      text: `Does this person have the ${id} trait?`,
      hint: "A broad clue.",
      tier: "broad" as const,
      family: id,
    }));
    const signature = {
      id: "obscure",
      text: "Did they publish this obscure technical result?",
      hint: "Specialist knowledge.",
      tier: "signature" as const,
      answerability: "specialist" as const,
    };
    const entries = Array.from({ length: 8 }, (_, n) => ({
      ...characters[0],
      id: `profile-${n}`,
      name: `Person ${n}`,
      featured: true,
      traits: {
        gender: Boolean(n & 1),
        career: Boolean(n & 2),
        origin: Boolean(n & 4),
        obscure: n === 7,
      },
    }));
    vi.mocked(loadTheme).mockResolvedValueOnce({
      theme: "people",
      version: "test",
      characters: entries,
      questions: [...broad, signature],
      source: {
        url: "https://www.wikidata.org",
        license: "CC0",
        retrievedAt: "2026-10-14",
      },
      quality: {},
    });
    const u = userEvent.setup();
    render(<App />);
    await u.click(
      await screen.findByRole("button", { name: "Start guessing" }),
    );
    for (let i = 0; i < 4 && screen.queryByTestId("question-text"); i++) {
      await u.click(await screen.findByRole("button", { name: "Yes" }));
      await waitFor(() =>
        expect(
          screen.queryByText("Connecting the clues…"),
        ).not.toBeInTheDocument(),
      );
    }
    expect(
      screen.queryByRole("button", { name: "That’s correct" }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "You stumped me!" }),
    ).toBeVisible();
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
    const pack = await loadTheme("fictional");
    const questions = pack.questions;
    const u = userEvent.setup();
    render(<App />);
    await u.click(screen.getByRole("button", { name: /^Characters/ }));
    await u.click(
      await screen.findByRole("button", { name: "Start guessing" }),
    );
    const target = pack.characters.find(
      (c) => c.featured && c.name === "Harry Potter",
    )!;
    let last = "";
    await waitFor(() =>
      expect(screen.getByTestId("question-text")).toBeVisible(),
    );
    for (let i = 0; i < 40 && screen.queryByTestId("question-text"); i++) {
      last = screen.getByTestId("question-text").textContent!;
      const q = questions.find((q) => q.text === last)!;
      await u.click(
        screen.getByRole("button", {
          name:
            target.traits[q.id] === true
              ? "Yes"
              : target.traits[q.id] === false
                ? "No"
                : "Don’t know",
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
      screen.getByRole("button", {
        name:
          target.traits[q.id] === true
            ? "Yes"
            : target.traits[q.id] === false
              ? "No"
              : "Don’t know",
      }),
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

describe("answer presentation pacing", () => {
  async function begin() {
    const u = userEvent.setup();
    render(<App />);
    await u.click(
      await screen.findByRole("button", { name: "Start guessing" }),
    );
    await screen.findByTestId("question-text");
    vi.useFakeTimers();
    return screen.getByTestId("question-text").textContent;
  }
  it("acknowledges one answer immediately and holds the clue for the complete deadline", async () => {
    const first = await begin();
    const yes = screen.getByRole("button", { name: "Yes" });
    act(() => {
      fireEvent.click(yes);
      fireEvent.keyDown(window, { key: "1" });
    });
    expect(yes).toHaveAttribute("aria-pressed", "true");
    expect(yes).toBeDisabled();
    expect(screen.getByTestId("question-text")).toHaveTextContent(first!);
    expect(screen.getByText("Connecting the clues…")).toBeVisible();
    expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Detective notes" }));
    expect(
      screen.getAllByRole("button", { name: "Correct from here" }),
    ).toHaveLength(1);
    act(() => vi.advanceTimersByTime(2199));
    expect(screen.getByTestId("question-text")).toHaveTextContent(first!);
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId("question-text").textContent).not.toBe(first);
    expect(screen.queryByText("Connecting the clues…")).not.toBeInTheDocument();
  });
  it.each([
    "Undo",
    "Restart",
    "Give up",
    "Library",
    "Settings",
    "Correct from here",
  ])("cancels a pending reveal through %s", async (action) => {
    const first = await begin();
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    if (action === "Correct from here")
      fireEvent.click(screen.getByRole("button", { name: "Detective notes" }));
    fireEvent.click(screen.getByRole("button", { name: action }));
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.queryByText("Connecting the clues…")).not.toBeInTheDocument();
    if (action === "Undo" || action === "Correct from here")
      expect(screen.getByTestId("question-text")).toHaveTextContent(first!);
    if (action === "Give up")
      expect(
        screen.getByRole("heading", { name: "You stumped me!" }),
      ).toBeVisible();
    if (action === "Library" || action === "Settings")
      expect(screen.queryByTestId("question-text")).not.toBeInTheDocument();
  });
});
