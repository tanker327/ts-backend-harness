#!/usr/bin/env bash
# SessionEnd hook: append a date-stamped stub entry to the top of
# progress/journal.md (under the "## Entry format" block) if today
# doesn't already have an entry. Idempotent — running twice in one
# day is a no-op on the second run.
set -u

JOURNAL="progress/journal.md"

if [ ! -f "$JOURNAL" ]; then
  exit 0
fi

TODAY=$(date +%Y-%m-%d)
NOW=$(date +%H:%M)

if grep -qE "^### ${TODAY} " "$JOURNAL"; then
  exit 0
fi

STUB=$(printf '### %s — session %s\n\n- TODO: fill in what happened this session\n\n---\n' "$TODAY" "$NOW")

# Insert the stub on the line immediately after the first "---" separator,
# which directly follows the "## Entry format" example block.
awk -v stub="$STUB" '
  BEGIN { inserted = 0 }
  {
    print
    if (!inserted && $0 ~ /^---$/) {
      print ""
      print stub
      inserted = 1
    }
  }
' "$JOURNAL" >"${JOURNAL}.tmp" && mv "${JOURNAL}.tmp" "$JOURNAL"

exit 0
