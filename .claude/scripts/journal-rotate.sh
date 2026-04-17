#!/usr/bin/env bash
# Rotate progress/journal.md when it exceeds ~150 lines.
# Keeps the newest ~80 lines intact; moves older entries to
# progress/archive/journal-YYYY-MM.md (where YYYY-MM is the earliest
# month in the rotated chunk). On-demand — not wired to any hook.
set -u

JOURNAL="progress/journal.md"
ARCHIVE_DIR="progress/archive"
THRESHOLD=150
KEEP_TAIL=80

if [ ! -f "$JOURNAL" ]; then
  echo "no journal found at $JOURNAL"
  exit 0
fi

TOTAL=$(wc -l <"$JOURNAL" | tr -d ' ')

if [ "$TOTAL" -le "$THRESHOLD" ]; then
  echo "no rotation needed ($TOTAL lines)"
  exit 0
fi

# Find the first "### YYYY-MM-DD" header at or after line (TOTAL - KEEP_TAIL).
MIN_SPLIT=$((TOTAL - KEEP_TAIL))
SPLIT_LINE=$(grep -nE '^### [0-9]{4}-[0-9]{2}-[0-9]{2}' "$JOURNAL" \
  | awk -F: -v min="$MIN_SPLIT" '$1 >= min { print $1; exit }')

if [ -z "${SPLIT_LINE:-}" ]; then
  echo "no safe split point found (no dated header after line $MIN_SPLIT); skipping"
  exit 0
fi

OLD_END=$((SPLIT_LINE - 1))
if [ "$OLD_END" -lt 1 ]; then
  echo "split would leave nothing to rotate; skipping"
  exit 0
fi

OLD_CHUNK=$(sed -n "1,${OLD_END}p" "$JOURNAL")
NEW_CHUNK=$(sed -n "${SPLIT_LINE},\$p" "$JOURNAL")

# Earliest YYYY-MM header in the rotated chunk.
EARLIEST=$(echo "$OLD_CHUNK" | grep -oE '### [0-9]{4}-[0-9]{2}-[0-9]{2}' \
  | awk '{print $2}' | sort | head -1)

if [ -z "${EARLIEST:-}" ]; then
  echo "no dated entries in rotated chunk; skipping"
  exit 0
fi

YYYY_MM="${EARLIEST%-*}"
ARCHIVE_FILE="$ARCHIVE_DIR/journal-${YYYY_MM}.md"
mkdir -p "$ARCHIVE_DIR"

TODAY=$(date +%Y-%m-%d)
NOTE="<!-- Rotated from progress/journal.md on ${TODAY} -->"
ROTATED_LINES=$(echo "$OLD_CHUNK" | wc -l | tr -d ' ')
ROTATED_ENTRIES=$(echo "$OLD_CHUNK" | grep -cE '^### [0-9]{4}-[0-9]{2}-[0-9]{2}' || true)

if [ -f "$ARCHIVE_FILE" ]; then
  EXISTING=$(cat "$ARCHIVE_FILE")
  printf '%s\n\n%s\n\n%s\n' "$NOTE" "$OLD_CHUNK" "$EXISTING" >"$ARCHIVE_FILE"
else
  printf '%s\n\n%s\n' "$NOTE" "$OLD_CHUNK" >"$ARCHIVE_FILE"
fi

printf '%s\n' "$NEW_CHUNK" >"$JOURNAL"

echo "rotated $ROTATED_ENTRIES entries ($ROTATED_LINES lines) to $ARCHIVE_FILE"
