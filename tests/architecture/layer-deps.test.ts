/**
 * Structural test that enforces the 6-layer architecture dependency rule.
 * Scans all src/ files and fails if any layer imports from a higher layer.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";

const LAYERS: Record<string, number> = {
  types: 1,
  config: 2,
  repos: 3,
  providers: 3,
  services: 4,
  routes: 5,
};

// Same-tier imports are forbidden unless listed here. See ADR-005.
const SAME_TIER_ALLOW: Record<string, string[]> = {
  providers: ["repos"],
};

function getImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  const imports: string[] = [];
  let match = importRegex.exec(content);
  while (match !== null) {
    imports.push(match[1] as string);
    match = importRegex.exec(content);
  }
  return imports;
}

function getSourceLayer(filePath: string): string | null {
  for (const layer of Object.keys(LAYERS)) {
    if (filePath.includes(`/src/${layer}/`)) return layer;
  }
  return null;
}

function getTargetLayer(importPath: string): string | null {
  for (const layer of Object.keys(LAYERS)) {
    if (importPath.includes(`/${layer}/`) || importPath.includes(`/${layer}`)) {
      return layer;
    }
  }
  return null;
}

function getAllTsFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      results.push(...getAllTsFiles(fullPath));
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !entry.name.includes(".test.")) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("Architecture Layer Dependencies", () => {
  const srcDir = path.resolve(__dirname, "../../src");
  const allFiles = getAllTsFiles(srcDir);

  it("should not have upward layer dependencies", () => {
    const violations: string[] = [];

    for (const file of allFiles) {
      const sourceLayer = getSourceLayer(file);
      if (!sourceLayer) continue;
      const sourceOrder = LAYERS[sourceLayer] ?? 0;

      for (const imp of getImports(file)) {
        const targetLayer = getTargetLayer(imp);
        if (!targetLayer) continue;
        if (targetLayer === sourceLayer) continue;
        const targetOrder = LAYERS[targetLayer] ?? 0;
        if (targetOrder > sourceOrder) {
          violations.push(
            `${path.relative(srcDir, file)} (${sourceLayer}) imports from ${targetLayer}`,
          );
          continue;
        }
        if (targetOrder === sourceOrder) {
          const allowed = SAME_TIER_ALLOW[sourceLayer] ?? [];
          if (!allowed.includes(targetLayer)) {
            violations.push(
              `${path.relative(srcDir, file)} (${sourceLayer}) imports from peer-tier ${targetLayer} (not on allowlist)`,
            );
          }
        }
      }
    }

    if (violations.length > 0) {
      expect.fail(
        [
          `Found ${violations.length} layer violation(s):`,
          ...violations.map((v) => `  - ${v}`),
          "",
          "WHY: Each layer may only import from lower tiers. See ADR-005.",
          "     types(1) -> config(2) -> (repos | providers)(3) -> services(4) -> routes(5)",
          "     Same-tier imports are forbidden except: providers -> repos.",
          "FIX: Move shared logic to a lower tier, or route cross-cutting concerns via providers.",
          "REF: docs/adr/005-six-layer-architecture.md",
        ].join("\n"),
      );
    }
  });

  it("should have source files to validate", () => {
    expect(allFiles.length).toBeGreaterThan(0);
  });
});
