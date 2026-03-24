# Commit Message Rules

## Format

```
<type>(<scope>): <short description>

[optional body]
[optional footer: refs ADR-XXX]
```

- Subject line: 72 characters max, lowercase, no trailing period
- Body: wrap at 100 characters; explain *why*, not *what*
- Footer: reference the ADR that motivated the change, if applicable

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
fix(repos): scope task queries by userId from JWT
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
- If the commit enforces or documents an architectural decision, add `refs ADR-XXX` in the footer
- Every `arch` commit should have a corresponding ADR or test that mechanically enforces it
