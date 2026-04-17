#!/usr/bin/env bash
# SessionStart hook wrapper. Runs scripts/init.sh and emits the
# Claude Code hook JSON envelope with stdout as additionalContext.
#
# Adds a 300s TTL cache keyed on cwd so SessionStart (and any future
# per-turn hook) does not rerun the smoke check on every fire.
set -u

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PWD_HASH=$(printf '%s' "$REPO_ROOT" | shasum | awk '{print $1}')
CACHE_FILE="/tmp/harness-healthy-${PWD_HASH}"
TTL_SECONDS=300

emit() {
  # $1 = context string for Claude
  if command -v jq >/dev/null 2>&1; then
    jq -nc --arg ctx "$1" \
      '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$ctx}}'
  else
    # Minimal fallback: JSON-escape newlines + quotes so the wrapper still
    # produces valid JSON if jq is ever missing.
    escaped=$(printf '%s' "$1" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))' 2>/dev/null)
    if [ -n "$escaped" ]; then
      printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":%s}}\n' "$escaped"
    else
      printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"harness check ran (jq unavailable)"}}\n'
    fi
  fi
}

# Serve from cache if the last success was recent enough.
if [ -f "$CACHE_FILE" ]; then
  now=$(date +%s)
  mtime=$(stat -f %m "$CACHE_FILE" 2>/dev/null || stat -c %Y "$CACHE_FILE" 2>/dev/null || echo 0)
  age=$(( now - mtime ))
  if [ "$age" -ge 0 ] && [ "$age" -lt "$TTL_SECONDS" ]; then
    emit "✓ harness healthy (cached, age ${age}s)"
    exit 0
  fi
fi

OUT=$(bash "$REPO_ROOT/scripts/init.sh" --quiet 2>&1)
STATUS=$?

if [ "$STATUS" -eq 0 ]; then
  # Touch the cache only on success; failures should keep prompting a rerun.
  : > "$CACHE_FILE"
fi

emit "$OUT"
exit 0
