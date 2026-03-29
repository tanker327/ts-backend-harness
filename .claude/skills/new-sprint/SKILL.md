---
name: new-sprint
description: Archive completed tasks from the current sprint and start a new one. Use when the user says "start a new sprint" or "archive sprint".
disable-model-invocation: true
---

Start a new sprint by archiving completed tasks and bumping the version. Use `$ARGUMENTS` as the new sprint version (e.g., `/new-sprint v0.2.0`).

Steps:

1. Read `progress/current.json` to get the current sprint name and tasks.
2. Extract all tasks with `"status": "completed"` into an archive file at `progress/archive/<current-sprint>.json` with this structure:
   ```json
   {
     "sprint": "<current sprint>",
     "archived_at": "<ISO 8601 timestamp>",
     "tasks": [<completed tasks>]
   }
   ```
3. Remove the completed tasks from `progress/current.json`, keeping only `pending`, `in_progress`, and `blocked` tasks.
4. Update `current_sprint` in `progress/current.json` to the new version from `$ARGUMENTS`.
5. Update `last_updated` to the current timestamp.
6. Report: how many tasks were archived, how many remain, and the new sprint name.
