#!/usr/bin/env bash
# Stop hook gate: fast-to-slow validation ladder with re-entry guard, diff gate,
# and truncated failure output. See TASK-016.
#
# Emits one JSON object on stdout: {"continue": true} or
# {"continue": false, "stopReason": "..."}.

set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || { echo '{"continue": true}'; exit 0; }

# --- Read hook JSON from stdin (transcript_id / session_id) -----------------
HOOK_INPUT="$(cat || true)"
TRANSCRIPT_ID=""
if [ -n "$HOOK_INPUT" ]; then
  # Try jq first, then fall back to grep/sed.
  if command -v jq >/dev/null 2>&1; then
    TRANSCRIPT_ID="$(printf '%s' "$HOOK_INPUT" | jq -r '.transcript_id // .session_id // empty' 2>/dev/null || true)"
  fi
  if [ -z "$TRANSCRIPT_ID" ]; then
    TRANSCRIPT_ID="$(printf '%s' "$HOOK_INPUT" | grep -oE '"(transcript_id|session_id)"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | sed -E 's/.*"([^"]+)"$/\1/' || true)"
  fi
fi
[ -z "$TRANSCRIPT_ID" ] && TRANSCRIPT_ID="${CLAUDE_SESSION_ID:-unknown}"

# --- Clean stale locks (>1h old) so /tmp doesn't grow -----------------------
find /tmp -maxdepth 1 -name 'claude-stop-gate-*.lock' -mmin +60 -delete 2>/dev/null || true

LOCK="/tmp/claude-stop-gate-${TRANSCRIPT_ID}.lock"

# --- 1. Re-entry guard: skip if same stop-chain ran in last 5 min -----------
if [ -f "$LOCK" ]; then
  # mtime in seconds since epoch; BSD/GNU compatible.
  if LOCK_AGE=$(( $(date +%s) - $(stat -f %m "$LOCK" 2>/dev/null || stat -c %Y "$LOCK" 2>/dev/null || echo 0) )); then
    if [ "$LOCK_AGE" -lt 300 ]; then
      echo '{"continue": true}'
      exit 0
    fi
  fi
fi
touch "$LOCK"

# --- 2. Diff gate: skip if no code changes ----------------------------------
if git diff HEAD --quiet -- src tests drizzle 2>/dev/null; then
  echo '{"continue": true}'
  exit 0
fi

# --- Helpers ----------------------------------------------------------------
# JSON-escape a string for safe inclusion as a JSON value.
# Uses jq if available; otherwise a minimal sed fallback (handles \, ", newlines, tabs, CR).
json_escape() {
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$1" | jq -Rs '.'
  else
    # Fallback: escape backslash, dquote, newline, tab, cr. Not as robust as jq.
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\t'/\\t}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\n'/\\n}"
    printf '"%s"' "$s"
  fi
}

truncate_str() {
  # $1 = text, $2 = max chars
  local text="$1" max="$2"
  if [ "${#text}" -gt "$max" ]; then
    printf '%s… (truncated)' "${text:0:$max}"
  else
    printf '%s' "$text"
  fi
}

emit_failure() {
  local step="$1" body="$2"
  local reason
  reason="$(printf 'Stop gate blocked: %s failed.\n\n%s' "$step" "$body")"
  reason="$(truncate_str "$reason" 2000)"
  printf '{"continue": false, "stopReason": %s}\n' "$(json_escape "$reason")"
  exit 0
}

# --- 3. Completion marker: run full suite if user explicitly requested ------
FULL_MARKER="$REPO_ROOT/.claude/.stop-full-suite"
if [ -f "$FULL_MARKER" ]; then
  rm -f "$FULL_MARKER"
  OUT="$(bun run test 2>&1)"
  if [ $? -ne 0 ]; then
    BODY="$(printf '%s' "$OUT" | tail -c 1800)"
    emit_failure "full test suite" "$BODY"
  fi
  echo '{"continue": true}'
  exit 0
fi

# --- 4. Fast-to-slow ladder (bail on first failure) -------------------------

# 4a. tsc
TSC_OUT="$(bunx tsc --noEmit 2>&1)"
if [ $? -ne 0 ]; then
  BODY="$(printf '%s' "$TSC_OUT" | head -20)"
  emit_failure "tsc" "$BODY"
fi

# 4b. biome
BIOME_OUT="$(bunx biome check . 2>&1)"
if [ $? -ne 0 ]; then
  BODY="$(printf '%s' "$BIOME_OUT" | head -20)"
  emit_failure "biome" "$BODY"
fi

# 4c. vitest --changed HEAD (bail on first failing test)
# If HEAD has no commits yet, --changed falls back gracefully (vitest handles it).
VITEST_OUT="$(bunx vitest run --bail=1 --changed HEAD 2>&1)"
if [ $? -ne 0 ]; then
  # Extract up to 5 failing test names.
  FAILS="$(printf '%s' "$VITEST_OUT" | grep -E ' FAIL |✖' | head -5)"
  # First error block: take first ~40 lines starting at first FAIL line, else head of output.
  FIRST_FAIL_LINE="$(printf '%s' "$VITEST_OUT" | grep -nE ' FAIL |✖' | head -1 | cut -d: -f1)"
  if [ -n "$FIRST_FAIL_LINE" ]; then
    BLOCK="$(printf '%s' "$VITEST_OUT" | tail -n +"$FIRST_FAIL_LINE" | head -40)"
  else
    BLOCK="$(printf '%s' "$VITEST_OUT" | head -40)"
  fi
  BODY="$(printf 'Failing tests:\n%s\n\nFirst error:\n%s' "$FAILS" "$BLOCK")"
  emit_failure "vitest" "$BODY"
fi

# --- 5. All green -----------------------------------------------------------
echo '{"continue": true}'
exit 0
