import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";
import { characters, questions } from "./data/catalog";
afterEach(() => {
  cleanup();
  localStorage.clear();
});
describe("OpenGuess player journey", () => {
  it("lets players choose another universe after a round has started", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Start guessing" }));
    await user.click(screen.getByRole("button", { name: "Change universe" }));
    expect(screen.getByRole("button", { name: "Real people" })).toBeVisible();
  });
  it("starts the whole advertised library even after a narrower scope was chosen", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Real people" }));
    await user.click(screen.getByRole("button", { name: "Library" }));
    await user.click(screen.getByRole("button", { name: "Let’s play" }));
    expect(screen.getByTestId("question-text")).toHaveTextContent(
      "Is your character a real person?",
    );
  });
  it("allows explicit category selection for a missing real person", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Library" }));
    await user.click(
      screen.getByRole("button", { name: "Help grow the library" }),
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Character type" }),
      "real",
    );
    expect(
      screen.getByRole("combobox", { name: "Character type" }),
    ).toHaveValue("real");
  });
  it("can undo the answer that triggered a guess", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Start guessing" }));
    const character = characters.find((c) => c.name === "Harry Potter")!;
    let lastQuestion = "";
    for (let i = 0; i < 25 && screen.queryByTestId("question-text"); i++) {
      lastQuestion = screen.getByTestId("question-text").textContent!;
      const q = questions.find((q) => q.text === lastQuestion)!;
      await user.click(
        screen.getByRole("button", {
          name:
            character.traits[q.id] === true
              ? "Yes"
              : character.traits[q.id] === false
                ? "No"
                : "Don't know",
        }),
      );
    }
    expect(
      screen.getByRole("button", { name: "That’s my character" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Undo last answer" }));
    expect(screen.getByTestId("question-text")).toHaveTextContent(lastQuestion);
  });
  it("starts a playable round with five answers and supports undo", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Start guessing" }));
    const firstQuestion = screen.getByTestId("question-text").textContent;
    expect(screen.getByRole("button", { name: /^Undo/ })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /^Yes/ }));
    expect(screen.getByTestId("question-text").textContent).not.toBe(
      firstQuestion,
    );
    await user.click(screen.getByRole("button", { name: /^Undo/ }));
    expect(screen.getByTestId("question-text").textContent).toBe(firstQuestion);
    for (const name of [
      /^Yes/,
      /^Probably$/,
      /^Don't know/,
      /^Probably not$/,
      /^No/,
    ])
      expect(screen.getByRole("button", { name })).toBeVisible();
  });
  it("lets players inspect and search the supported catalog", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Library" }));
    await user.type(
      screen.getByRole("searchbox", { name: "Search characters" }),
      "Harry Potter",
    );
    expect(screen.getByRole("heading", { name: "Harry Potter" })).toBeVisible();
  });
  it("explains the engine and distinguishes local play from shared learning", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "How it works" }));
    expect(
      screen.getByRole("heading", { name: "A little mystery. A little math." }),
    ).toBeVisible();
    expect(screen.getByText(/No answers leave your browser/)).toBeVisible();
  });
});
