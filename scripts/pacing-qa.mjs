import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.QA_URL || "http://127.0.0.1:4190";
const output = process.env.QA_OUTPUT || "/tmp/openguess-scale-pacing";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.BROWSER_EXECUTABLE ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const measurements = [];
try {
  await mkdir(output, { recursive: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const ready = () =>
    page.locator('.game-content[aria-busy="false"]').waitFor();
  await page.goto(base);
  await page
    .getByRole("button", { name: "Start guessing", exact: true })
    .click();
  await ready();
  for (let i = 0; i < 3; i++) {
    const first = await page.getByTestId("question-text").textContent();
    const start = await page.evaluate(() => performance.now());
    await page.getByRole("button", { name: "Don’t know", exact: true }).click();
    assert.equal(
      await page
        .getByRole("button", { name: "Don’t know", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      await page.getByRole("button", { name: "Yes", exact: true }).isDisabled(),
      true,
    );
    await page.waitForTimeout(1700);
    assert.equal(await page.getByTestId("question-text").textContent(), first);
    await ready();
    const elapsed = (await page.evaluate(() => performance.now())) - start;
    assert(elapsed >= 2000 && elapsed < 3500, `normal reveal ${elapsed}ms`);
    assert.notEqual(
      await page.getByTestId("question-text").textContent(),
      first,
    );
    measurements.push({
      kind: "real-worker reveal",
      elapsedMs: Math.round(elapsed),
    });
  }
  await page.screenshot({
    path: output + "/thinking-ready.png",
    fullPage: true,
  });
  await page.close();
  const slow = await browser.newPage();
  await slow.addInitScript(() => {
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      postMessage(message, ...rest) {
        if (message.type === "compute" && message.history?.length) {
          setTimeout(() => super.postMessage(message, ...rest), 3500);
        } else super.postMessage(message, ...rest);
      }
    };
  });
  await slow.goto(base);
  await slow
    .getByRole("button", { name: "Start guessing", exact: true })
    .click();
  await slow.locator('.game-content[aria-busy="false"]').waitFor();
  await slow.getByRole("button", { name: "Yes", exact: true }).click();
  await slow.waitForTimeout(2300);
  assert.equal(
    await slow.locator(".game-content").getAttribute("aria-busy"),
    "true",
  );
  const cancelStart = await slow.evaluate(() => performance.now());
  await slow.getByRole("button", { name: "Give up", exact: true }).click();
  await slow
    .getByRole("heading", {
      name: /stumped|couldn.t|didn.t|don.t|not enough|found/i,
    })
    .waitFor({ timeout: 1000 });
  const cancelledText = await slow.locator(".game-content").textContent();
  measurements.push({
    kind: "slow-worker give-up",
    elapsedMs: Math.round(
      (await slow.evaluate(() => performance.now())) - cancelStart,
    ),
  });
  await slow.waitForTimeout(2200);
  assert.equal(
    await slow.locator(".game-content").textContent(),
    cancelledText,
  );
  assert.deepEqual(errors, []);
  await writeFile(
    output + "/report.json",
    JSON.stringify(
      {
        passed: true,
        testedAt: new Date().toISOString(),
        measurements,
        limits:
          "Timing measured on this local browser, not a hardware-independent latency guarantee. Slow worker compute is deliberately delayed 3500ms.",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(JSON.stringify({ passed: true, measurements }));
} finally {
  await browser.close();
}
