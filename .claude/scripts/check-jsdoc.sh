#!/usr/bin/env bash
# PostToolUse hook: checks that .ts files have JSDoc comments on the file
# and on every exported function. Reports missing JSDoc as advisory context.

FILE="$CLAUDE_FILE_PATH"

# Only check TypeScript files
case "$FILE" in
  *.ts|*.tsx) ;;
  *) echo '{"decision":"allow"}'; exit 0 ;;
esac

MSGS=""

# 1. File-level JSDoc: expect /** within the first 20 lines
if ! head -20 "$FILE" | grep -q '/\*\*'; then
  MSGS="Missing file-level JSDoc."
fi

# 2. Exported function JSDoc: each 'export [async] function' should have
#    a JSDoc comment ending with */ on the line immediately above it.
while IFS=: read -r LN _REST; do
  PREV=$((LN - 1))
  [ "$PREV" -lt 1 ] && continue
  PREV_LINE=$(sed -n "${PREV}p" "$FILE")
  if ! echo "$PREV_LINE" | grep -qE '(\*/|/\*\*)'; then
    FNAME=$(sed -n "${LN}p" "$FILE" | sed 's/.*function \([a-zA-Z_][a-zA-Z0-9_]*\).*/\1/')
    MSGS="$MSGS Missing JSDoc for '${FNAME}' (line ${LN})."
  fi
done < <(grep -n '^export \(async \)\{0,1\}function ' "$FILE")

if [ -n "$MSGS" ]; then
  echo "{\"decision\":\"allow\",\"hookSpecificOutput\":{\"additionalContext\":\"JSDoc check:${MSGS}\"}}"
else
  echo '{"decision":"allow"}'
fi
