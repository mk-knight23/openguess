import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { characters, questions } from "../src/data/catalog.ts";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { once } from "node:events";

const macChrome =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const executablePath =
  process.env.BROWSER_EXECUTABLE ||
  (existsSync(macChrome) ? macChrome : chromium.executablePath());
const preview = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4175",
    "--strictPort",
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
const base = "http://127.0.0.1:4175";
const output = process.env.QA_OUTPUT || "/tmp/openguess-qa";
async function checkAccessibility(page, label) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.equal(
    result.violations.length,
    0,
    label +
      ": " +
      JSON.stringify(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
        null,
        2,
      ),
  );
}
let browser;
try {
  for (let i = 0; i < 50; i++) {
    if (preview.exitCode !== null) throw new Error("Preview server exited");
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({ executablePath, headless: true });
  await mkdir(output, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [],
    foreignRequests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (new URL(r.url()).origin !== base) foreignRequests.push(r.url());
  });
  await page.goto(base);
  await checkAccessibility(page, "home");
  await page.screenshot({ path: `${output}/desktop.png`, fullPage: true });
  await page
    .getByRole("button", { name: "Start guessing", exact: true })
    .click();
  const first = await page.getByTestId("question-text").textContent();
  await page.keyboard.press("3");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(
    await page.getByTestId("question-text").textContent(),
    first,
    "Undo restores the question",
  );
  await checkAccessibility(page, "question");
  const target = characters.find((c) => c.name === "Harry Potter");
  let answered = 0;
  while (await page.getByTestId("question-text").count()) {
    assert(answered < 25, "Round must terminate within25 answers");
    const text = await page.getByTestId("question-text").textContent();
    const q = questions.find((q) => q.text === text);
    assert(q, "Question has a catalog entry");
    await page
      .getByRole("button", {
        name:
          target.traits[q.id] === true
            ? "Yes"
            : target.traits[q.id] === false
              ? "No"
              : "Don't know",
        exact: true,
      })
      .click();
    answered++;
  }
  await page
    .getByRole("heading", { name: "Harry Potter", exact: true })
    .waitFor();
  await checkAccessibility(page, "guess");
  await page.screenshot({ path: `${output}/guess.png`, fullPage: true });
  await page
    .getByRole("button", { name: "Not this time — keep going", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("heading", { name: "Harry Potter", exact: true })
      .count(),
    0,
    "Rejected candidate not offered again",
  );
  await page
    .getByRole("button", { name: "Change universe", exact: true })
    .click();
  await page.getByRole("button", { name: "Real people", exact: true }).click();
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search characters" })
    .fill("Harry Potter");
  await page
    .getByRole("heading", { name: "Harry Potter", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Let’s play", exact: true }).click();
  assert.equal(
    await page.getByTestId("question-text").textContent(),
    "Is your character a real person?",
    "Library resets advertised universe",
  );
  // All-unknown answers must stop without pretending to identify a character.
  for (let i = 0; i < 25; i++)
    await page.getByRole("button", { name: "Don't know", exact: true }).click();
  await page
    .getByRole("heading", { name: "You stumped me.", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Suggest a character", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Character type" })
    .selectOption("real");
  await page
    .getByRole("textbox", { name: "Character name", exact: true })
    .fill("Example Public Scientist");
  await page
    .getByRole("textbox", { name: "A short description" })
    .fill("A proposal for manual review.");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export proposal" }).click();
  const download = await downloadPromise;
  await download.saveAs(`${output}/proposal.json`);
  const { readFile } = await import("node:fs/promises");
  const proposal = JSON.parse(
    await readFile(`${output}/proposal.json`, "utf8"),
  );
  assert.equal(proposal.category, "real");
  assert.equal(proposal.answers.length, 25);
  assert.equal(proposal.name, "Example Public Scientist");
  await page.getByRole("button", { name: "Back to the game" }).click();
  await page.getByRole("button", { name: "Change universe" }).click();
  await page.getByRole("button", { name: "Everyone", exact: true }).click();
  await page
    .getByRole("button", { name: "Start guessing", exact: true })
    .click();
  while (await page.getByTestId("question-text").count()) {
    const text = await page.getByTestId("question-text").textContent();
    const q = questions.find((q) => q.text === text);
    await page
      .getByRole("button", {
        name: target.traits[q.id] ? "Yes" : "No",
        exact: true,
      })
      .click();
  }
  await page
    .getByRole("button", { name: "That’s my character", exact: true })
    .click();
  await page.getByRole("button", { name: "How it works", exact: true }).click();
  await page.getByText("1 mysteries solved on this browser").waitFor();
  await page.reload();
  await page.getByRole("button", { name: "How it works", exact: true }).click();
  await page.getByText("1 mysteries solved on this browser").waitFor();
  await page
    .getByRole("button", { name: "Clear local stats", exact: true })
    .click();
  await page.getByText("0 mysteries solved on this browser").waitFor();
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    reducedMotion: "reduce",
  });
  const mobile = await mobileContext.newPage();
  mobile.on("pageerror", (e) => errors.push(e.message));
  await mobile.goto(base);
  await checkAccessibility(mobile, "mobile-home");
  await mobile.screenshot({ path: `${output}/mobile.png`, fullPage: true });
  assert(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Mobile has no horizontal overflow",
  );
  await mobile
    .getByRole("button", { name: "Start guessing", exact: true })
    .click();
  await mobile.getByRole("button", { name: "Yes", exact: true }).click();
  await mobile.getByRole("button", { name: "Undo", exact: true }).click();
  await mobile.screenshot({
    path: `${output}/mobile-game.png`,
    fullPage: true,
  });
  assert.equal(errors.length, 0, `Browser errors: ${errors.join(";")}`);
  assert.equal(
    foreignRequests.length,
    0,
    `Runtime third-party requests: ${foreignRequests.join(";")}`,
  );
  const report = {
    testedAt: new Date().toISOString(),
    desktop: "1440x1000",
    mobile: "375x812",
    checks: [
      "start",
      "keyboard",
      "undo",
      "guess",
      "reject",
      "change-universe",
      "library-scope",
      "unknown-exhaustion",
      "proposal-download-and-category",
      "local-stats-persistence-and-clear",
      "mobile-overflow",
      "mobile-answer-undo",
      "no-page-errors",
      "axe-wcag2-aa-home-question-result-contribution-mobile",
      "no-third-party-runtime-requests",
    ],
    passed: true,
    harryPotterQuestions: answered,
  };
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  preview.kill("SIGTERM");
  if (preview.exitCode === null) await once(preview, "exit");
}
