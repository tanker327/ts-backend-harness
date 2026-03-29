# Context Management Rules

## Prevent context flooding
- Do not dump entire files unless you need the full content — read specific line ranges
- Cap search results: use head_limit in Grep, refine queries before expanding scope
- Do not paste large logs into the conversation — write them to a file and summarize

## Offload large outputs
- Write test output >50 lines to a temporary file, then summarize key results
- Write debug logs to files, not inline
- Keep summaries in context, raw data in files

## Long session hygiene
- If a session runs beyond ~5 task completions, summarize completed work before continuing
- When switching between unrelated tasks, note what you were doing and why

## Progressive disclosure
- Read CLAUDE.md first, then .claude/rules/ only when relevant to the current file context
- Read feature plans only when working on that specific task
- Do not preload all docs at session start — load on demand
