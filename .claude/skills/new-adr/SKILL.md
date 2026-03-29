---
name: new-adr
description: Create a new Architecture Decision Record (ADR) with the next sequential number from the template.
disable-model-invocation: true
---

Create a new ADR in `docs/adr/`. Use `$ARGUMENTS` as the ADR title (e.g., `/new-adr Use Redis for session storage`).

Steps:

1. List existing files in `docs/adr/` to determine the next ADR number (e.g., if 003 exists, next is 004).
2. Read `docs/adr/template.md` for the structure.
3. Create `docs/adr/NNN-<kebab-case-title>.md` with:
   - Replace `ADR-NNN` with the actual number
   - Replace `Title` with the title from `$ARGUMENTS`
   - Set **Status** to `Proposed`
   - Set **Date** to today's date
   - Leave **Enforced by**, **Context**, **Decision**, and **Consequences** sections as placeholders for the user to fill in
4. Report the file path and remind the user to fill in the Context, Decision, and Consequences sections.
