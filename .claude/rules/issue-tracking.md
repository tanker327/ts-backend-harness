# Issue Tracking Policy

## When to log an issue
- Only log issues that are **unrelated to the current task** and **do not block it**
- If an issue **blocks the current task**, fix it immediately to keep the task moving — do not log it separately
- If you fix a blocking issue inline, document it in the task's `notes` field instead

## How to log
1. Create a detailed file in `progress/issues/ISSUE-XXX-<slug>.md` with error messages, stack traces, affected files, root cause analysis, and potential fixes
2. Add a reference in `known_issues` in `progress/current.json`: `"<summary> — see progress/issues/ISSUE-XXX-<slug>.md"`
3. Do this **immediately** when the issue is discovered — do not wait until end of session

## Issue file format
```markdown
# ISSUE-XXX: <title>

## Status: open | investigating | fixed
## Severity: non-blocker
## First seen: <date>

## Summary
<1-2 sentences>

## Affected tests/files
<list>

## Error evidence
<exact error messages, stack traces, test output>

## Root cause analysis
<why it happens>

## Potential fixes
<numbered list of options>
```

## When to fix logged issues
- Address logged issues after all pending tasks in the current loop are done
- If a logged issue later starts blocking a task, fix it immediately
