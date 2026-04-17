# /adr-audit — Audit codebase against ADR set

Verify that every ADR in `docs/adr/` accurately reflects the current state of the codebase. Catches drift, gaps, overlaps, and mistakes.

## What to do

Spawn a single **Explore** agent with the prompt below. Do **not** perform the audit yourself — delegate to the agent so the report comes back clean and the main context stays uncluttered.

After the agent returns, summarize for the user in this shape:

1. **Critical mismatches** — ADR claims that the code violates (highest priority)
2. **Chronology violations** — any ADR body that forward-references a higher-numbered ADR (bodies may only reference ADRs that existed when written)
3. **Minor mismatches** — outdated references, stale examples, file paths that moved
4. **Gaps** — architectural decisions visible in code but with no ADR
5. **Overlaps / redundancy** — ADRs covering the same ground (recommend keep/merge/clarify)
6. **Clean items** — one-line confirmation of what matched (keep brief)

End with: "What do you want to do about each finding?" — do **not** auto-fix anything. The audit reports; the user decides.

## Agent prompt (pass verbatim to Explore agent)

```
You are auditing a TypeScript backend template project at /Users/ericwu/projects/work/ts-backend-harness to verify that every ADR in docs/adr/ accurately reflects the current code.

## Your task

Read every ADR in `docs/adr/*.md` (skip `template.md`). For each one, walk the codebase to verify its claims. Then check for gaps and overlaps.

### 1. Every ADR must match reality
For each ADR, extract its claims (what file / pattern / dependency it says exists) and verify against the code. Flag any mismatch.

Check common claims:
- package.json dependencies exist with the expected versions
- Files/directories referenced in ADRs exist
- Rules stated in ADRs are actually followed (e.g., "X lives only in src/Y/" — grep to confirm no imports outside src/Y/)
- Enforcement mechanisms named in each ADR actually exist (tests, hooks, lint rules)
- Cross-references between ADRs point to the correct number and title

### 2. Look for gaps
Architectural decisions visible in the codebase that have NO ADR. Examples to check:
- API error handling pattern / response shape
- Request ID / correlation ID
- CORS, rate limiting, security middleware
- Migration workflow (drizzle-kit generate vs push)
- Seed data strategy
- CI pipeline (if .github/ exists)
- Dockerfile (if present)
- Session storage
- Health check convention
- API versioning
- biome.json rules that imply a style decision
- Any pattern in src/routes, src/services, src/providers, scripts/ that isn't captured

### 3. Look for overlaps / redundancy
ADRs whose scopes blur. For each pair: describe the overlap and recommend keep-distinct / merge / clarify-boundary.

### 4. Look for mistakes
- Broken cross-refs (e.g., reference to ADR-003 that means ADR-013 post-renumbering)
- Claims that reference files that no longer exist
- Dates or status values that are wrong

### 5. Check chronology — ADRs never reference the future
An ADR is a historical record. When ADR-N was written, ADRs N+1, N+2, ... did not exist. Therefore:

**Rule**: an ADR's **body** (Context, Decision, Consequences, Enforcement, etc.) may only reference ADRs with a **lower or equal number** than itself.

**Allowed exceptions:**
- The **Status line** of an older ADR may be updated retroactively to note supersession (e.g., `Status: Superseded by ADR-N`). This is metadata, not body content.
- ADRs with **identical dates** (e.g., a batch of backfills written the same day) may cross-reference each other in any direction, because they were written simultaneously.
- An ADR whose body explicitly describes a **renumbering event** (e.g., ADR-002's mapping table) may mention affected ADR numbers as part of documenting the event itself.

**What to flag:**
- Any body text in ADR-N that references `ADR-M` where M > N and the two ADRs have different dates.
- Any "see ADR-M", "refs ADR-M", "per ADR-M" in an older ADR's body pointing to a newer ADR.
- Dates that go backward as ADR numbers go forward (ADR-N dated later than ADR-M where N < M) — a sign of chronological drift or bad renumbering.

For each violation: cite the file, line number, offending reference, and date delta. Suggest the fix (move the note to the newer ADR's Context, or convert to a retroactive Status line in the older ADR).

## Deliverable

Return a structured report with five sections (A Claims verified, B Gaps, C Overlaps, D Mistakes, E Chronology violations). Be concrete with file paths and line numbers. Be concise — no preamble. Under 1500 words.
```

## Cadence recommendation

Run this command:
- Before releases
- After any PR that touches `src/`, `docs/adr/`, or `package.json` without a clear ADR link
- Monthly on active projects, quarterly on slow ones
- Any time you suspect the docs have drifted from the code

If findings pile up and manual invocation keeps getting forgotten, consider promoting this to a scheduled GitHub Actions workflow (see the ADR about automation — not yet written).
