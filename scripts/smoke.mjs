import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { translate } from "../src/i18n.ts";
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { once } from "node:events";
const output = process.env.QA_OUTPUT || "/tmp/openguess-v2-qa";
const base = process.env.QA_URL || "http://127.0.0.1:4175";
const server = process.env.QA_URL
  ? null
  : spawn(
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
      { stdio: "ignore" },
    );
const mac = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
let browser;
const checks = [],
  errors = [];
async function axe(page, label) {
  const r = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  if (r.violations.length)
    await page.screenshot({
      path: output + "/failure-" + label + ".png",
      fullPage: true,
    });
  assert.equal(
    r.violations.length,
    0,
    label +
      ": " +
      JSON.stringify(
        r.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      ),
  );
  checks.push("accessibility " + label);
}
async function ready(page) {
  await page.locator('.game-content[aria-busy="false"]').waitFor();
  await page.getByTestId("question-text").waitFor();
  await page.getByRole("button", { name: "Yes", exact: true }).waitFor();
}
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  await mkdir(output, { recursive: true });
  browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.BROWSER_EXECUTABLE ||
      (existsSync(mac) ? mac : chromium.executablePath()),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await page
    .getByRole("button", { name: "Start guessing", exact: true })
    .waitFor();
  await axe(page, "home");
  await page.screenshot({ path: output + "/desktop.png", fullPage: true });
  for (const theme of ["People", "Characters", "Animals", "Objects", "Films"]) {
    await page.getByRole("button", { name: new RegExp("^" + theme) }).click();
    await page
      .getByRole("button", { name: "Start guessing", exact: true })
      .click();
    await ready(page);
    const first = await page.getByTestId("question-text").textContent();
    await page.keyboard.press("3");
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await ready(page);
    assert.equal(await page.getByTestId("question-text").textContent(), first);
    await page
      .getByRole("button", { name: "Change universe", exact: true })
      .click();
    checks.push(theme + " load/worker/answer/undo");
  }
  await page.getByRole("button", { name: /^Characters/ }).click();
  await page
    .getByRole("button", { name: "Start guessing", exact: true })
    .click();
  await ready(page);
  await axe(page, "question");
  const pack = JSON.parse(
    await readFile(
      new URL("../src/data/packs/fictional.json", import.meta.url),
      "utf8",
    ),
  );
  const target =
    pack.characters.find((c) => c.featured && c.name === "Harry Potter") ||
    pack.characters.find((c) => c.featured) ||
    pack.characters[0];
  let answered = 0;
  while (await page.getByTestId("question-text").count()) {
    assert(answered < 40, "40-answer budget");
    await ready(page);
    const text = await page.getByTestId("question-text").textContent();
    const q = pack.questions.find((q) => q.text === text);
    assert(q, "question sourced");
    assert(
      !/^name[_-]/i.test(q.id) && q.kind !== "spelling",
      "no spelling in normal gameplay",
    );
    await page
      .getByRole("button", {
        name:
          target.traits[q.id] === true
            ? "Yes"
            : target.traits[q.id] === false
              ? "No"
              : translate("en", "dontKnow"),
        exact: true,
      })
      .click();
    answered++;
    await page.waitForFunction(
      () => !document.body.textContent.includes("Connecting the clues…"),
    );
  }
  await page
    .getByRole("button", { name: "That’s correct", exact: true })
    .waitFor();
  await axe(page, "guess");
  await page.screenshot({ path: output + "/guess.png", fullPage: true });
  const guess = await page.locator(".result-bubble h2").textContent();
  assert.equal(guess, target.name, "oracle answers identify sourced target");
  await page.getByRole("button", { name: "Undo last answer" }).click();
  await ready(page);
  const undoText = await page.getByTestId("question-text").textContent();
  const undoQ = pack.questions.find((q) => q.text === undoText);
  await page
    .getByRole("button", {
      name:
        target.traits[undoQ.id] === true
          ? "Yes"
          : target.traits[undoQ.id] === false
            ? "No"
            : translate("en", "dontKnow"),
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "That’s correct", exact: true })
    .click();
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("openguess.progress.v2")).wins,
    ),
    1,
  );
  checks.push("guess, result undo and confirmed collection award");
  await page
    .getByRole("button", { name: "Change universe", exact: true })
    .click();
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await axe(page, "library");
  await page.getByRole("searchbox").fill(target.name);
  await page.getByRole("heading", { name: target.name, exact: true }).waitFor();
  checks.push("library search");
  await page
    .getByRole("button", { name: "Daily challenge", exact: true })
    .click();
  await page.getByText(/Five mysteries/).waitFor();
  assert.equal(await page.locator(".daily-grid > article").count(), 5);
  await axe(page, "daily");
  checks.push("five daily challenges");
  await page.getByRole("button", { name: "Collection", exact: true }).click();
  await axe(page, "collection");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("heading", { name: "Optional cloud account", exact: true })
    .waitFor();
  await axe(page, "settings");
  const cloudRefresh = page.getByRole("button", {
    name: "Refresh community scores",
    exact: true,
  });
  if (await cloudRefresh.count()) {
    await cloudRefresh.click();
    await page
      .getByText("Community scores refreshed.", { exact: true })
      .first()
      .waitFor();
    checks.push("live anonymous community score projection");
  }
  await page
    .getByRole("textbox", { name: "Nickname", exact: true })
    .fill("QA Explorer");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  assert.equal(
    await page
      .getByRole("textbox", { name: "Nickname", exact: true })
      .inputValue(),
    "QA Explorer",
  );
  await page
    .getByRole("combobox", { name: "Interface language" })
    .selectOption("ar");
  assert.equal(await page.getByTestId("app-shell").getAttribute("dir"), "rtl");
  await page
    .getByRole("combobox", { name: "Interface language" })
    .selectOption("en");
  checks.push("profile persistence and RTL");
  const backupPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export progress", exact: true })
    .click();
  const backup = await backupPromise;
  await backup.saveAs(output + "/progress.json");
  const saved = JSON.parse(await readFile(output + "/progress.json", "utf8"));
  assert.equal(saved.wins, 1);
  saved.profile.nickname = "Imported Explorer";
  await page.locator("input[type=file]").setInputFiles({
    name: "progress.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(saved)),
  });
  await page
    .getByText("Progress imported. This replaces the progress on this browser.")
    .waitFor();
  assert.equal(
    await page
      .getByRole("textbox", { name: "Nickname", exact: true })
      .inputValue(),
    "Imported Explorer",
  );
  await page.locator("input[type=file]").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from("{}"),
  });
  await page.getByText(/That file is not a valid/).waitFor();
  assert.equal(
    await page
      .getByRole("textbox", { name: "Nickname", exact: true })
      .inputValue(),
    "Imported Explorer",
  );
  checks.push(
    "backup download, validated restore and invalid backup rejection",
  );
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await page.getByRole("button", { name: /Suggest an entry/ }).click();
  await page
    .getByRole("textbox", { name: "Entry name", exact: true })
    .fill("Example Public Scientist");
  await page
    .getByRole("textbox", { name: "Description, source facts and evidence" })
    .fill("A proposal for manual review with a public source.");
  const proposalPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export proposal", exact: true })
    .click();
  const proposal = await proposalPromise;
  await proposal.saveAs(output + "/proposal.json");
  const suggestion = JSON.parse(
    await readFile(output + "/proposal.json", "utf8"),
  );
  assert.equal(suggestion.schema, "openguess.proposal/v2");
  assert.equal(suggestion.name, "Example Public Scientist");
  assert.equal(suggestion.category, "people");
  await axe(page, "contribution");
  checks.push("reviewable contribution download");
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    reducedMotion: "reduce",
  });
  const mobile = await mobileContext.newPage();
  mobile.on("pageerror", (e) => errors.push(e.message));
  await mobile.goto(base);
  await mobile
    .getByRole("button", { name: "Start guessing", exact: true })
    .waitFor();
  await axe(mobile, "mobile-home");
  assert(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "no horizontal overflow",
  );
  await mobile.screenshot({ path: output + "/mobile.png", fullPage: true });
  await mobile
    .getByRole("button", { name: "Start guessing", exact: true })
    .click();
  await ready(mobile);
  await mobile.getByRole("button", { name: "Yes", exact: true }).click();
  await mobile.getByRole("button", { name: "Undo", exact: true }).click();
  await ready(mobile);
  await axe(mobile, "mobile-question");
  await mobile.screenshot({
    path: output + "/mobile-game.png",
    fullPage: true,
  });
  checks.push("mobile answer/undo");
  for (let i = 0; i < 40; i++) {
    await ready(mobile);
    await mobile
      .getByRole("button", { name: translate("en", "dontKnow"), exact: true })
      .click();
  }
  await mobile
    .getByRole("heading", { name: "You stumped me!", exact: true })
    .waitFor();
  assert.equal(
    await mobile
      .getByRole("button", { name: "That’s correct", exact: true })
      .count(),
    0,
  );
  checks.push("unknown answers stop honestly without a forced guess");
  assert.deepEqual(errors, [], "no browser errors");
  const report = {
    testedAt: new Date().toISOString(),
    passed: true,
    checks,
    target: target.name,
    questions: answered,
  };
  await writeFile(output + "/report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  if (server) {
    server.kill("SIGTERM");
    if (server.exitCode === null) await once(server, "exit");
  }
}
