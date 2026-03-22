import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";

const LAYERS: Record<string, number> = {
  types: 1,
  config: 2,
  repos: 3,
  services: 4,
  providers: 5,
  routes: 6,
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
        const targetOrder = LAYERS[targetLayer] ?? 0;
        if (targetOrder > sourceOrder) {
          violations.push(
            `${path.relative(srcDir, file)} (${sourceLayer}) imports from ${targetLayer}`,
          );
        }
      }
    }

    if (violations.length > 0) {
      expect.fail(
        [
          `Found ${violations.length} layer violation(s):`,
          ...violations.map((v) => `  - ${v}`),
          "",
          "WHY: Each layer may only import from layers with a lower number.",
          "     Types(1) -> Config(2) -> Repos(3) -> Services(4) -> Providers(5) -> Routes(6)",
          "FIX: Move shared logic to a lower layer, or use Providers for cross-cutting concerns.",
          "REF: docs/architecture.md",
        ].join("\n"),
      );
    }
  });

  it("should have source files to validate", () => {
    expect(allFiles.length).toBeGreaterThan(0);
  });
});
