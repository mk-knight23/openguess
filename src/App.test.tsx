import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";
afterEach(() => {
  cleanup();
  localStorage.clear();
});
describe("OpenGuess player journey", () => {
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
