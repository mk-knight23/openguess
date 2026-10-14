import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { translate } from "../src/i18n.ts";

const base = process.env.QA_URL || "http://127.0.0.1:4178";
const output = process.env.QA_OUTPUT || "/tmp/openguess-experience-qa";
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
        "4178",
        "--strictPort",
      ],
      { stdio: "ignore" },
    );
const mac = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
let browser;
const checks = [],
  rounds = [],
  errors = [];
async function ready(page) {
  await page.locator('.game-content[aria-busy="false"]').waitFor();
}
async function accessibility(page, label) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
    [],
    label,
  );
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
  for (const [label, width, height, scale, motion] of [
    ["desktop", 1440, 1000, 1, "no-preference"],
    ["tablet", 768, 1024, 1, "no-preference"],
    ["mobile", 375, 812, 1, "no-preference"],
    ["landscape", 812, 375, 1, "no-preference"],
    ["zoom-equivalent", 720, 500, 2, "reduce"],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: scale,
      reducedMotion: motion,
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page
      .getByRole("button", { name: "Start guessing", exact: true })
      .click();
    await ready(page);
    const first = await page.getByTestId("question-text").textContent();
    assert.equal(await page.locator(".question-help p").isVisible(), false);
    await page.locator(".question-help summary").click();
    assert.equal(await page.locator(".question-help p").isVisible(), true);
    await page.locator(".question-help summary").click();
    if (motion === "reduce")
      assert.equal(
        await page
          .locator(".question-transition")
          .evaluate((e) => getComputedStyle(e).animationName),
        "none",
      );
    await page.keyboard.press("3");
    await ready(page);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await ready(page);
    assert.equal(await page.getByTestId("question-text").textContent(), first);
    assert.equal(
      await page.evaluate(() =>
        document.activeElement?.getAttribute("data-testid"),
      ),
      "question-text",
    );
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      label + " horizontal overflow",
    );
    for (const button of await page.locator(".answer-card button").all())
      assert(
        (await button.boundingBox()).height >= 44,
        label + " answer target height",
      );
    await accessibility(page, label);
    await page.getByTestId("question-text").focus();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${output}/${label}.png`, fullPage: true });
    checks.push(
      label + " guidance/keyboard/undo/focus/targets/reflow/accessibility",
    );
    await context.close();
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base, { waitUntil: "domcontentloaded" });
  for (const [theme, label, name] of [
    ["people", "People", "Ada Lovelace"],
    ["fictional", "Characters", "Harry Potter"],
    ["animals", "Animals", "Giraffe"],
    ["objects", "Objects", "Guitar"],
    ["movies", "Films", "Titanic"],
  ]) {
    await page.getByRole("button", { name: new RegExp("^" + label) }).click();
    await page
      .getByRole("button", { name: "Start guessing", exact: true })
      .click();
    const pack = JSON.parse(
      await readFile(
        new URL(`../src/data/packs/${theme}.json`, import.meta.url),
        "utf8",
      ),
    );
    const target = pack.characters.find((c) => c.featured && c.name === name);
    assert(target);
    const transcript = [];
    for (let i = 0; i < 40; i++) {
      await ready(page);
      if (
        await page
          .getByRole("button", { name: "That’s correct", exact: true })
          .count()
      )
        break;
      const text = await page.getByTestId("question-text").textContent();
      const q = pack.questions.find((q) => q.text === text);
      assert(q && q.answerability !== "specialist");
      const fact = target.traits[q.id];
      const answer = fact === true ? "yes" : fact === false ? "no" : "unknown";
      transcript.push({ question: text, answer, tier: q.tier });
      await page
        .getByRole("button", {
          name: translate("en", answer === "unknown" ? "dontKnow" : answer),
          exact: true,
        })
        .click();
    }
    await ready(page);
    assert.equal(await page.locator(".result-bubble h2").textContent(), name);
    assert(
      transcript.some((q) => q.tier === "signature" && q.answer === "yes"),
    );
    assert.equal(await page.locator(".genie-confident").count(), 1);
    if (theme === "fictional") {
      await page
        .getByRole("button", { name: "No — keep going", exact: true })
        .click();
      await ready(page);
      assert.equal(await page.locator(".genie-recovering").count(), 1);
      checks.push("rejected guess visibly resumes discovery");
    } else {
      await page
        .getByRole("button", { name: "That’s correct", exact: true })
        .click();
      assert.equal(await page.locator(".genie-celebrate").count(), 1);
    }
    rounds.push({ theme, target: name, transcript });
    await page
      .getByRole("button", { name: "Change universe", exact: true })
      .click();
  }
  checks.push(
    "five themes reach supported signature guesses with real companion states",
  );
  assert.deepEqual(errors, []);
  await writeFile(
    `${output}/report.json`,
    JSON.stringify(
      {
        testedAt: new Date().toISOString(),
        passed: true,
        zoomMethod:
          "720 CSS pixels at DPR2 represents a 1440-pixel desktop at 200% full-page zoom; native browser zoom UI was not manipulated.",
        checks,
        rounds,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      passed: true,
      checks,
      rounds: rounds.map((r) => ({
        target: r.target,
        questions: r.transcript.length,
      })),
    }),
  );
} finally {
  await browser?.close();
  if (server) {
    server.kill("SIGTERM");
    if (server.exitCode === null) await once(server, "exit");
  }
}
