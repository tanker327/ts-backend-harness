# Commit Message Rules

## Format

```
<type>(<scope>): <short description>

[optional body]
[optional footer: refs ADR-XXX, TASK-XXX]
```

- Subject line: 72 characters max, lowercase, no trailing period
- Body: wrap at 100 characters; explain *why*, not *what*
- Footer: reference the ADR and/or TASK that motivated the change, if applicable

## Types

| Type | When to use |
|---|---|
| `feat` | New feature or endpoint |
| `fix` | Bug fix |
| `test` | Adding or updating tests |
| `arch` | Harness changes: hooks, ADRs, structural tests, layer constraints |
| `chore` | Dependencies, tooling, config files |
| `docs` | Documentation only (no code change) |
| `refactor` | Code restructure with no behavior change |

## Scopes — map to the six architectural layers

`types` | `config` | `repos` | `services` | `providers` | `routes` | `harness` | `infra`

Use the layer the change primarily lives in. If a change spans multiple layers, prefer the highest layer touched (e.g. a feature touching `services` + `routes` → scope `routes`).

## Examples

```
feat(routes): add POST /tasks endpoint with OpenAPI spec

refs TASK-005

fix(repos): scope task queries by userId from JWT

refs ADR-003, TASK-008

test(architecture): add layer dependency structural test
arch(harness): add Stop Hook to gate agent completion on test failure
docs(adr): ADR-003 userId always extracted from JWT payload
chore(infra): add Redis service to docker-compose.yml
refactor(services): extract task validation into shared helper
```

## Rules (MUST follow)

- NEVER use `--no-verify` to bypass pre-commit hooks
- One logical change per commit — do not bundle unrelated changes
- Scope MUST be one of the six layer names or `harness`/`infra`
- If the commit relates to a tracked task, add `refs TASK-XXX` in the footer
- If the commit enforces or documents an architectural decision, add `refs ADR-XXX` in the footer
- Both can be combined: `refs ADR-003, TASK-008`
- Every `arch` commit should have a corresponding ADR or test that mechanically enforces it
