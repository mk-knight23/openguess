import { it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
it("loads cohort logic from the requested evaluation tree", () => {
  const root = mkdtempSync(join(tmpdir(), "openguess-eval-root-"));
  try {
    mkdirSync(join(root, "src/data/packs"), { recursive: true });
    writeFileSync(join(root, "package.json"), ' {"type":"module"}');
    writeFileSync(join(root, "src/engine.ts"), "export {};");
    writeFileSync(
      join(root, "src/data/evaluationPool.ts"),
      'export function evaluationPool(){throw new Error("requested-tree-cohort-sentinel")}',
    );
    writeFileSync(join(root, "src/data/packs/people.json"), "{}");
    const result = spawnSync(
      process.execPath,
      ["scripts/evaluate-question-quality.mjs"],
      { env: { ...process.env, EVAL_ROOT: root }, encoding: "utf8" },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("requested-tree-cohort-sentinel");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
