# Feature Plan: Quality Scores Automation (TASK-010)

## Goal
Auto-populate `docs/quality/scores.json` with real coverage and lint violation data per architectural layer.

## Implementation

### `scripts/update-quality.ts`

1. Run `bunx vitest run --coverage --reporter=json-summary` → parse `coverage/coverage-summary.json`
2. Map each file to its layer (types/config/repos/services/providers/routes) based on path
3. Aggregate coverage percentage per layer
4. Run `bunx biome check . --reporter=json` → count violations per file → map to layers
5. Write updated `docs/quality/scores.json` with current date

### Output format (unchanged)
```json
{
  "last_scanned": "2026-03-29",
  "layers": {
    "types": { "coverage": 100, "lint_violations": 0, "notes": "" },
    ...
  }
}
```

### Integration
- Add `"quality": "bun run scripts/update-quality.ts"` to package.json
- Optionally run in CI after tests pass and commit the updated scores.json

## Verification
- Run `bun run scripts/update-quality.ts`
- Confirm scores.json has non-zero coverage numbers and accurate violation counts
- Compare against manual `bunx vitest run --coverage` output
