# Harness Project Setup TODO Manual

_Execution checklist for setting up a new harness project from scratch or upgrading an existing repo toward harness-engineering best practices._

This manual is the operational companion to:

- `harness-engineering/harness-engineering-practical-handbook-en.md`

Use this document when you want a **step-by-step setup plan**, not a conceptual overview.

---

## 0. Goal

By the end of this checklist, your project should have:

- a small, reliable `AGENTS.md` or `CLAUDE.md`
- deterministic local quality checks
- CI-backed validation
- architecture constraints
- state handoff files for long-running agent work
- application-level verification, not just code-level verification
- safety boundaries that stop the agent from weakening the harness

If you skip any of those layers, you do not have a complete harness project yet.

---

## 1. Decide the Operating Model First

### 1.1 Choose the project mode

- [ ] Decide whether this is a **greenfield** or **brownfield** harness setup
- [ ] Decide whether agents will be **attended** at first or expected to run **unattended**
- [ ] Decide whether the main workflow is:
  - coding in a local repo
  - coding in remote dev environments
  - coding in isolated worktrees
  - coding in cloud containers/devboxes

### 1.2 Define the human role

- [ ] Decide who owns architecture decisions
- [ ] Decide who reviews merges
- [ ] Decide what quality bar applies to agent-written code
- [ ] Write down the rule: agent output must meet the same quality bar as human output

### 1.3 Define the first success condition

- [ ] Choose one narrow task that the harness must support end-to-end
- [ ] Make the task small enough to finish in one session
- [ ] Make the task important enough that success means something

**Definition of done for Step 1**

- [ ] The team knows what kind of project this is
- [ ] The team knows how much autonomy the agent is allowed
- [ ] The team knows what first milestone the harness must support

---

## 2. Create the Minimum Repository Scaffolding

### 2.1 Create the required top-level artifacts

- [ ] Create `AGENTS.md` or `CLAUDE.md` at the repo root
- [ ] Create `docs/`
- [ ] Create `docs/adr/`
- [ ] Create `docs/ARCHITECTURE.md`
- [ ] Create a basic test directory if one does not exist
- [ ] Create a startup script if the project needs environment bootstrapping

### 2.2 Keep the root instruction file short

Your root instruction file should include:

- [ ] install command
- [ ] run/dev command
- [ ] test command
- [ ] lint/format command
- [ ] architecture pointers
- [ ] explicit prohibitions
- [ ] completion criteria

Your root instruction file should **not** include:

- [ ] long architectural essays
- [ ] a giant style guide
- [ ] every possible repo detail
- [ ] repeated documentation that already exists elsewhere

**Rule**

- [ ] Keep the file pointer-style and small enough to stay stable

### 2.3 Write the first ADR

- [ ] Create `docs/adr/ADR-001-adopt-harness-engineering.md`
- [ ] Record:
  - context
  - decision
  - consequences
  - enforcement

Suggested first ADR topics:

- [ ] layered architecture
- [ ] chosen lint/typecheck stack
- [ ] startup / state-tracking conventions
- [ ] worktree or environment isolation model

**Definition of done for Step 2**

- [ ] The repo has a visible system-of-record layer
- [ ] A new session can find build/test/docs/architecture starting points without asking a human

---

## 3. Set Up the Local Quality Loop

### 3.1 Choose the deterministic quality stack

At minimum, choose one tool in each category:

- [ ] formatter
- [ ] linter
- [ ] type checker if applicable
- [ ] unit test runner
- [ ] E2E or smoke-test runner

### 3.2 Make the commands explicit

- [ ] Add exact commands to `AGENTS.md` / `CLAUDE.md`
- [ ] Verify the commands work on a clean checkout
- [ ] Ensure the commands use the project’s actual tooling, not examples copied from another repo

### 3.3 Add pre-commit checks

- [ ] Add pre-commit or equivalent hook tooling
- [ ] Run formatter
- [ ] Run linter
- [ ] Run type check if fast enough
- [ ] Run lightweight architecture checks if available

### 3.4 Add post-edit checks if the agent environment supports them

- [ ] Auto-run formatter after edits
- [ ] Auto-run lint after edits
- [ ] Return residual errors back into the agent loop

**Rule**

- [ ] Catch issues locally before CI whenever possible

**Definition of done for Step 3**

- [ ] The repo can reject obvious bad code before push
- [ ] The agent does not have to “remember” to run the important local checks

---

## 4. Build the Architecture Guardrails

### 4.1 Decide the layer model

- [ ] Write the intended dependency direction in `docs/ARCHITECTURE.md`
- [ ] Define the stable layers or module boundaries
- [ ] Decide what imports or cross-layer calls are forbidden

### 4.2 Encode the invariants

- [ ] Add custom lint or structural rules for forbidden imports
- [ ] Add checks for dependency direction
- [ ] Add schema/interface validation at important boundaries
- [ ] Add naming or placement rules only if they materially reduce failure

### 4.3 Make error messages repair-oriented

For every important rule:

- [ ] explain what broke
- [ ] explain why the rule exists
- [ ] tell the agent how to fix it
- [ ] point to the ADR if useful

### 4.4 Protect the harness itself

Block the agent from editing:

- [ ] lint config
- [ ] formatter config
- [ ] CI config
- [ ] environment or secret files
- [ ] deployment-sensitive files, if needed

**Definition of done for Step 4**

- [ ] The project has machine-enforced boundaries
- [ ] The agent cannot cheaply “solve” failures by weakening the rules

---

## 5. Build the Verification Layer

### 5.1 Create the minimum test pyramid

- [ ] Unit tests for core logic
- [ ] Smoke test for startup / basic health
- [ ] At least one end-to-end path for the project’s most important workflow

### 5.2 Add completion-time verification

- [ ] Add a stop/completion gate if the agent environment supports one
- [ ] Require the agent to run tests before claiming completion
- [ ] Make “done” mean “verified,” not “looks correct”

### 5.3 Verify in the domain that matters

Use the right validation surface:

- [ ] Web app -> browser automation / accessibility tree / DOM snapshots
- [ ] API -> integration tests / request-response validation
- [ ] CLI/TUI -> terminal automation
- [ ] Infra -> plan/apply validation and environment checks
- [ ] ML/LLM -> eval suite, benchmark, safety tests

### 5.4 Add an anti-premature-stop rule

- [ ] State explicitly that the agent must compare output against the original task/spec
- [ ] State explicitly that unit tests alone do not prove full feature completion

**Definition of done for Step 5**

- [ ] The project can prove at least one real workflow works end-to-end
- [ ] “Feature complete” is tied to validation, not agent self-confidence

---

## 6. Make the Application Legible to the Agent

### 6.1 Do not stop at code visibility

The agent should be able to inspect the running system where possible:

- [ ] browser-visible state
- [ ] logs
- [ ] metrics
- [ ] traces
- [ ] runtime health

### 6.2 Add environment bootstrapping

- [ ] Create `init.sh` or equivalent startup routine
- [ ] Ensure it can boot the app or service reliably
- [ ] Ensure the agent can run it without rediscovering setup steps every session

### 6.3 Prefer isolated environments

Choose one of:

- [ ] one task per git worktree
- [ ] one task per container
- [ ] one task per remote devbox

Do **not** rely on a single shared mutable environment for unrelated tasks.

### 6.4 Keep startup friction low

- [ ] Measure how long it takes to go from clean session to runnable app
- [ ] Reduce unnecessary manual setup
- [ ] Prewarm or cache expensive setup if your environment supports it

**Definition of done for Step 6**

- [ ] The agent can observe whether the application works, not just what the code says
- [ ] Each task has a predictable environment

---

## 7. Add State Handoffs for Multi-Session Work

### 7.1 Add progress tracking

Create one of:

- [ ] `progress.json`
- [ ] `feature_list.json`
- [ ] both, if the project needs both task-level and feature-level tracking

### 7.2 Choose the right state model

Use `progress.json` when:

- [ ] the project is ongoing and task-based
- [ ] you need flexible status and blockers

Use `feature_list.json` when:

- [ ] the project is a long-running build with explicit features
- [ ] you want completeness tracked outside the code

### 7.3 Add a startup routine for every new session

Every new session should:

- [ ] confirm the working directory
- [ ] read recent git history
- [ ] read the progress file
- [ ] read the feature list if applicable
- [ ] run the startup script
- [ ] run a smoke path before starting new work

### 7.4 Add the clean-state rule

Every session should end with:

- [ ] a working or intentionally reverted state
- [ ] a commit or explicit explanation for why no commit was made
- [ ] updated progress/state files
- [ ] a clear next step for the next session

**Definition of done for Step 7**

- [ ] The next agent session can resume work without archaeological digging
- [ ] Long-running work can survive context resets

---

## 8. Manage Context Like a Runtime Resource

### 8.1 Prevent context flooding

- [ ] Avoid full-file dumps unless necessary
- [ ] Cap search results and refine queries
- [ ] Do not paste large logs into the live conversation unless they are immediately relevant

### 8.2 Offload large outputs

- [ ] Write large test output to files
- [ ] Write large logs to files
- [ ] Keep summaries in context, not the entire raw output

### 8.3 Add compaction or note-taking if sessions run long

- [ ] Summarize stale conversation history
- [ ] Preserve unresolved bugs, decisions, and next steps
- [ ] Add memory/notes if the project regularly crosses context windows

### 8.4 Use progressive disclosure for tools and docs

- [ ] Load only the tools the task actually needs
- [ ] Scope rules to directories or file patterns when possible
- [ ] Keep global rules minimal

**Definition of done for Step 8**

- [ ] The agent can work longer without drowning in its own history
- [ ] The repo exposes the right information at the right time

---

## 9. Add Safety and Policy Controls

### 9.1 Define the allowed execution envelope

- [ ] Decide whether the agent can run with full shell access, sandboxed access, or approval-gated access
- [ ] Decide what destructive commands should always be blocked
- [ ] Decide what files are protected

### 9.2 Add safety hooks or policy enforcement

- [ ] Block destructive commands where appropriate
- [ ] Block edits to protected files
- [ ] Require approval for high-risk operations if the environment supports it

### 9.3 Bound retries

- [ ] Set a policy for CI retry count
- [ ] Set a policy for repeated self-repair loops
- [ ] Add “stop and report” behavior after repeated failures

**Definition of done for Step 9**

- [ ] The agent cannot silently escalate risk
- [ ] The system cannot burn infinite time and tokens on bad loops

---

## 10. Add Tooling and Capability Layers Carefully

### 10.1 Keep the default tool set small

- [ ] Only expose the tools the agent needs most often
- [ ] Avoid large overlapping tool sets
- [ ] Remove redundant tools that create ambiguous choice points

### 10.2 If using MCP, curate access

- [ ] Organize tools into logical groups
- [ ] Give each workflow the smallest reasonable subset
- [ ] Ensure tools do not expose destructive actions without separate controls

### 10.3 Reuse capability layers across agent surfaces

- [ ] Prefer shared capability layers over one-off integrations
- [ ] Reuse the same rules and docs for human-guided and unattended agents when possible

**Definition of done for Step 10**

- [ ] Tools expand useful capability without exploding context or risk

---

## 11. Measure the Harness

### 11.1 Pick a small metric set

Track at least:

- [ ] first-pass CI success rate
- [ ] rework rate
- [ ] agent task success rate
- [ ] time from task start to verified output

### 11.2 Add one qualitative review loop

- [ ] Review recent failures weekly
- [ ] For each repeated failure, decide whether to fix it with:
  - better docs
  - better tests
  - stronger lint rules
  - tighter environment design
  - better state handoff

### 11.3 Grow the harness from failures

- [ ] Adopt the rule: every recurring failure should produce a harness improvement

**Definition of done for Step 11**

- [ ] The harness is improving from real failure data, not taste alone

---

## 12. Sequence for New Projects

If you are starting from zero, do the setup in this exact order:

1. [ ] Define autonomy level and first success condition
2. [ ] Create `AGENTS.md` / `CLAUDE.md`
3. [ ] Add `docs/ARCHITECTURE.md` and first ADR
4. [ ] Add formatter, linter, tests, and explicit commands
5. [ ] Add pre-commit checks
6. [ ] Add one end-to-end verification path
7. [ ] Add protected-file rules
8. [ ] Add startup script
9. [ ] Add progress/state files
10. [ ] Add isolated worktree/devbox/container workflow
11. [ ] Add compaction / note-taking only when longer sessions require it
12. [ ] Add shared tool layers and scale-up features after the basics are stable

---

## 13. Sequence for Existing Projects

If you are upgrading an old repo, do **not** add everything at once.

Use this order:

1. [ ] Add explicit build/test/lint commands
2. [ ] Add pre-commit
3. [ ] Add one smoke test and one real workflow test
4. [ ] Add root pointer file (`AGENTS.md` / `CLAUDE.md`)
5. [ ] Add first ADR and architecture map
6. [ ] Add the most valuable architecture rule only
7. [ ] Add state handoff files if sessions are long-running
8. [ ] Add stronger isolation and application legibility
9. [ ] Add more rules only after the first ones are stable

---

## 14. Final Launch Checklist

Do not call the harness “ready” until all of these are true:

- [ ] The agent can find build/test/lint instructions immediately
- [ ] The repo has a small root map and deeper docs
- [ ] The project has deterministic local quality checks
- [ ] The project has at least one end-to-end validation path
- [ ] Architecture boundaries are enforced mechanically
- [ ] Protected files cannot be casually modified by the agent
- [ ] The app/service can be started in a predictable environment
- [ ] Long-running work has state handoff files
- [ ] Large outputs do not flood the active context
- [ ] Retry loops are bounded
- [ ] The team can explain how the harness will improve after the next failure

If any item above is still unchecked, the harness is still incomplete.

---

## 15. Recommended Artifacts to Have by the End

- [ ] `AGENTS.md` or `CLAUDE.md`
- [ ] `docs/ARCHITECTURE.md`
- [ ] `docs/adr/ADR-001-*.md`
- [ ] formatter config
- [ ] linter config
- [ ] typecheck config if applicable
- [ ] pre-commit config
- [ ] CI workflow
- [ ] startup script (`init.sh` or equivalent)
- [ ] `progress.json` and/or `feature_list.json`
- [ ] E2E or smoke test harness
- [ ] protected-file policy
- [ ] isolated task environment model

---

## 16. One-Sentence Rule

Every time the agent fails in a repeatable way, fix the **environment** so that this class of failure becomes harder or impossible next time.

