#!/usr/bin/env bash
# Pre-commit gate: block dependency additions in package.json that lack a paired ADR.
# See docs/adr/002-adr-trigger-checklist.md

set -euo pipefail

if [ "${ADR_SKIP:-0}" = "1" ]; then
  echo "[adr-check] ADR_SKIP=1 set — bypassing ADR gate. Log this in progress/adr-debt.md."
  exit 0
fi

if ! git diff --cached --name-only | grep -qx "package.json"; then
  exit 0
fi

diff_output=$(git diff --cached -- package.json || true)

# Look for added dependency lines: `+  "name": "version"`
# A line starting with `+` (but not `+++`) matching `"x": "y"` is a reasonable
# proxy for "dependency added." Version bumps show as one `-` line and one `+`
# line for the same key — we still flag those because a major bump can be
# architecturally breaking (ADR-002).
added_deps=$(printf '%s\n' "$diff_output" \
  | grep -E '^\+[[:space:]]+"[^"]+":[[:space:]]*"[^"]+"' \
  | grep -v '^\+\+\+' \
  || true)

if [ -z "$added_deps" ]; then
  exit 0
fi

# Net-new ADR file staged?
staged_new_adrs=$(git diff --cached --name-only --diff-filter=A \
  | grep -E '^docs/adr/[0-9]+-.+\.md$' \
  || true)

if [ -n "$staged_new_adrs" ]; then
  echo "[adr-check] new/changed dependency detected + ADR staged — OK."
  echo "  ADR(s): $staged_new_adrs"
  exit 0
fi

cat >&2 <<EOF
[adr-check] BLOCKED: package.json adds or changes dependencies but no new ADR is staged.

Added/changed dependency lines:
$added_deps

See docs/adr/002-adr-trigger-checklist.md for the policy.

Options:
  1. Write an ADR (docs/adr/NNN-<slug>.md using docs/adr/template.md) and
     include it in this commit.
  2. Bypass for a genuinely trivial change (e.g., a patch version bump):
        ADR_SKIP=1 git commit ...
     Then add a line to progress/adr-debt.md describing what was skipped.
EOF
exit 1
