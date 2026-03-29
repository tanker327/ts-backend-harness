/**
 * Reads vitest coverage and biome lint output, then writes per-layer
 * quality scores to docs/quality/scores.json.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const LAYERS = ["types", "config", "repos", "services", "providers", "routes"] as const;

type LayerScore = { coverage: number; lint_violations: number; notes: string };
type Scores = {
  last_scanned: string;
  layers: Record<(typeof LAYERS)[number], LayerScore>;
};

/** Map a file path to its architectural layer. */
function fileToLayer(filePath: string): (typeof LAYERS)[number] | null {
  for (const layer of LAYERS) {
    if (filePath.includes(`src/${layer}/`)) return layer;
  }
  return null;
}

/** Run vitest coverage and parse per-layer percentages. */
function getCoverage(): Record<string, { covered: number; total: number }> {
  execSync("bunx vitest run --coverage", { stdio: "pipe" });

  const raw = readFileSync("coverage/coverage-summary.json", "utf-8");
  const summary = JSON.parse(raw) as Record<
    string,
    { statements: { pct: number; covered: number; total: number } }
  >;

  const acc: Record<string, { covered: number; total: number }> = {};
  for (const layer of LAYERS) {
    acc[layer] = { covered: 0, total: 0 };
  }

  for (const [filePath, data] of Object.entries(summary)) {
    if (filePath === "total") continue;
    const layer = fileToLayer(filePath);
    if (!layer) continue;
    const entry = acc[layer];
    if (!entry) continue;
    entry.covered += data.statements.covered;
    entry.total += data.statements.total;
  }

  return acc;
}

/** Run biome check and count violations per layer. */
function getLintViolations(): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const layer of LAYERS) {
    acc[layer] = 0;
  }

  try {
    execSync("bunx biome check . --reporter=json 2>/dev/null", { stdio: "pipe" });
  } catch (err: unknown) {
    const e = err as { stdout?: Buffer };
    if (e.stdout) {
      const output = JSON.parse(e.stdout.toString()) as {
        diagnostics?: Array<{ location?: { path?: { file?: string } } }>;
      };
      for (const d of output.diagnostics ?? []) {
        const file = d.location?.path?.file;
        if (!file) continue;
        const layer = fileToLayer(file);
        if (layer && acc[layer] !== undefined) acc[layer]++;
      }
    }
  }

  return acc;
}

// --- Main ---
console.log("Running coverage...");
const coverage = getCoverage();

console.log("Running lint check...");
const violations = getLintViolations();

const scores: Scores = {
  last_scanned: new Date().toISOString().split("T")[0] as string,
  layers: {} as Scores["layers"],
};

for (const layer of LAYERS) {
  const cov = coverage[layer];
  const pct = cov && cov.total > 0 ? Math.round((cov.covered / cov.total) * 100) : 0;
  scores.layers[layer] = {
    coverage: pct,
    lint_violations: violations[layer] ?? 0,
    notes: "",
  };
}

writeFileSync("docs/quality/scores.json", `${JSON.stringify(scores, null, 2)}\n`);
console.log("Updated docs/quality/scores.json");
console.log(JSON.stringify(scores, null, 2));
