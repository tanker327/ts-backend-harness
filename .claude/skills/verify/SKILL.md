---
name: verify
description: Run full verification — lint, typecheck, and all tests — to confirm changes are correct before declaring a task complete.
---

Run these three checks in sequence. Stop immediately if any step fails and report the error.

1. **Lint**: `bunx biome check .`
2. **Typecheck**: `bunx tsc --noEmit`
3. **Test**: `bun run test`

If all three pass, report a short summary confirming everything is green.
If any step fails, report which step failed and the relevant error output. Do not proceed to the next step.
