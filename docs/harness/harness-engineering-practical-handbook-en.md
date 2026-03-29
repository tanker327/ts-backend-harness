# Harness Engineering Practical Handbook

_English edition, revised against the local source set in `harness-engineering/original` and refreshed with newer primary sources through **March 25, 2026**._

---

## How to Read This Handbook

This handbook is not a literal translation of the Chinese edition. It is a revised English edition optimized for:

- fidelity to the source set in `harness-engineering/original`
- clearer structure for English readers
- incorporation of newer primary-source material published after the earliest articles in the local corpus
- stronger separation between timeless principles and fast-moving implementation details

When something here reflects a dated source, the date is called out explicitly. When something reflects a current documentation page rather than a dated article, it is labeled as **current docs**.

---

## Chapter 1: What Harness Engineering Is

### 1.1 Core Definition

**Harness engineering** is the discipline of designing the environment around an AI coding agent so that the agent can produce work that is reliable, verifiable, and maintainable.

The harness is not:

- a single system prompt
- a wrapper around one API call
- a memory feature
- a benchmark harness in the narrow evaluation sense

It is the **full designed operating environment** around the model:

- tools
- constraints
- documentation
- startup routines
- feedback loops
- testing interfaces
- state handoff mechanisms
- runtime policy
- review boundaries

The best short formula remains:

```text
Agent = Model + Harness
```

The model supplies raw capability. The harness turns that capability into dependable engineering output.

### 1.2 Why It Matters

Across the source set, the most consistent conclusion is that **environment design now moves outcomes more than prompt polish**.

Representative evidence:

| Source | Date | Signal |
|---|---|---|
| OpenAI, _Harness engineering: leveraging Codex in an agent-first world_ | 2026 | ~1 million lines of code in five months, with zero hand-written code by design |
| LangChain, _Improving Deep Agents with harness engineering_ | 2026-02-17 | Same model, stronger harness, Terminal Bench 2.0 score improved from 52.8% to 66.5% |
| Stripe, _Minions_ Part 1 | 2026-02-09 | 1,000+ merged PRs per week written end-to-end by agents |
| Stripe, _Minions_ Part 2 | 2026-02-19 | Metric updated to 1,300+ merged PRs per week |
| SWE-agent / ACI lineage | 2024 onward | Interface and environment design materially changed benchmark performance without changing the model |

The modern penalty for weak engineering fundamentals has also changed. Poor documentation, weak tests, and vague architecture used to create slow-moving pain. In an agentic workflow, those same weaknesses get amplified at machine speed.

### 1.3 The Engineer’s Job Has Shifted

The local source set and the newer industry posts all converge on the same point:

- humans still define intent
- humans still own architecture and quality
- humans increasingly spend less time typing code directly
- the highest-leverage work moves into planning, calibration, and environment design

OpenAI framed this as moving from implementation toward environment design. Charlie Guo described it as the engineer’s job “splitting in two”: building the environment and managing the work. George framed it as a cybernetic shift: humans stop “turning the valve” and start designing the governor.

### 1.4 Cybernetics Is the Right Mental Model

George’s article remains one of the best conceptual frames:

- Watt’s governor closed the loop around engine speed
- Kubernetes closed the loop around desired runtime state
- harness engineering closes the loop around software change

The codebase used to have partial loops already:

- compilers closed syntax loops
- tests closed behavior loops
- linters closed style loops

What changed is that LLMs now act as both a new **sensor** and **actuator** at a higher abstraction layer:

- the agent can detect architectural or semantic issues
- the agent can also attempt the repair

That does not remove the need for calibration. It increases it.

### 1.5 Three Pillars

#### Pillar 1: Context Engineering

Agents only know what they can access. Anything outside the repository or outside the current tool-accessible environment is, in practice, missing context.

This usually breaks into two layers:

- **generic context**: tests, CI, lint rules, type information, schemas, contracts
- **calibration context**: ADRs, architecture docs, quality principles, remediation-oriented lint rules

#### Pillar 2: Architectural Constraints

The codebase needs mechanically enforced boundaries:

- dependency direction
- forbidden imports
- layer boundaries
- allowed runtime paths
- config and policy protection

The goal is not to dictate every implementation detail. The goal is to constrain the parts that must remain stable while leaving room for local autonomy inside the box.

#### Pillar 3: Entropy Management

AI-generated repositories accumulate entropy quickly:

- duplicated helpers
- inconsistent patterns
- stale comments
- drifting architecture
- “good enough” fixes that compound

The answer is not one big cleanup later. The answer is continuous garbage collection.

### 1.6 ACI: The Missing Concept in Most Summaries

One of the most important ideas from the source set is the **Agent-Computer Interface (ACI)**, inherited from the SWE-agent line of thought and emphasized strongly in Rohit’s synthesis.

The key point is that the harness is not merely “more context.” It is the design of an interface that fits LLM cognition.

Key ACI lessons:

- search must be capped and refinement-oriented
- file views should be windowed rather than dumped whole
- edits should produce immediate local validation
- stale context should be summarized or offloaded

This is why “the context window is not RAM” is such an important sentence. You are not filling memory. You are curating working consciousness.

### 1.7 Updated Industry Snapshot

The local corpus already captured the early 2026 convergence. Since then, several official sources have sharpened the picture:

- **OpenAI, 2026-01-23**: _Unrolling the Codex agent loop_ made the core loop, prompt assembly, prompt caching, compaction, and statelessness tradeoffs explicit.
- **OpenAI, 2026-02-04**: _Unlocking the Codex harness: how we built the App Server_ showed that the harness itself is becoming a reusable runtime surface exposed over a stable protocol.
- **Stripe, 2026-02-19**: _Minions Part 2_ moved the conversation from “agents can ship code” to “agents need standardized dev environments, deterministic blueprint nodes, curated MCP, and bounded CI iteration.”
- **Anthropic current docs**: context engineering and context-window docs now explicitly emphasize compaction, note-taking, just-in-time retrieval, and context awareness as first-class runtime concerns.

That means the current industry frontier is not just “how do I prompt a coding agent?” It is:

- how do I run the loop safely?
- how do I keep context coherent over long horizons?
- how do I expose the harness as a reusable runtime?
- how do I reuse human developer infrastructure instead of inventing agent-only infrastructure?

---

## Chapter 2: Core Mental Models

### 2.1 Repository as System of Record

This is the single most repeated rule in the local source set.

If the agent cannot read it from the repository or access it deterministically through tools, it is not reliably part of the system.

That pushes teams toward:

- repo-visible architecture docs
- ADRs
- state files
- structured testable interfaces
- generated references instead of hand-maintained descriptions

### 2.2 Map, Not Manual

The best `AGENTS.md` files are not giant rulebooks.

They are:

- short
- pointer-based
- stable
- cheap to load
- explicit about build/test paths and prohibitions

This aligns with both OpenAI’s “map, not a 1,000-page manual” framing and Stripe’s warning that unconditional global rules can fill the context window before useful work even begins.

### 2.3 Progressive Disclosure

Progressive disclosure shows up repeatedly:

- OpenAI’s docs-as-map pattern
- Anthropic’s startup sequence
- SWE-agent’s capped search
- Stripe’s directory-scoped rules
- selective tool loading in agent runtimes

The rule is simple: start with the minimum stable orientation layer, then let the agent retrieve more context on demand.

### 2.4 Narrow the Solution Space

One of the strongest cross-source conclusions is that higher reliability often comes from **reducing flexibility**, not maximizing it.

This can feel counterintuitive because LLM marketing usually emphasizes open-ended generation. But for maintainable systems, constraint is a force multiplier.

Constraint can take the form of:

- fixed project topologies
- strong layer boundaries
- curated tool sets
- startup scripts
- deterministic validation steps
- scoped worktree isolation

### 2.5 Build for Humans First, Reuse for Agents

Stripe’s Part 2 post is especially valuable here. Their strongest advantages for unattended agents came from infrastructure they already wanted for human developers:

- standardized remote devboxes
- strong isolation
- predictable startup
- shared tooling layers
- fast local feedback

The handbook should therefore reject a common anti-pattern:

> Do not build a low-quality parallel universe for agents. Build excellent developer infrastructure and let agents inherit it.

---

## Chapter 3: Context Engineering in Practice

### 3.1 Context Engineering Is Bigger Than Prompt Engineering

Anthropic’s recent context-engineering article makes a useful distinction:

- **prompt engineering** focuses on writing instructions
- **context engineering** focuses on curating the full token state during inference

In other words, prompts are a subset of context.

The full context surface includes:

- system or developer instructions
- tool schemas
- message history
- local files
- retrieved documents
- current runtime metadata
- model summaries, notes, and state artifacts

### 3.2 The Right Altitude for Instructions

System prompts fail in two opposite ways:

- too rigid and brittle
- too vague and aspirational

The right altitude is:

- concrete enough to steer
- abstract enough to generalize
- small enough to remain legible

### 3.3 Just-in-Time Retrieval Beats Premature Stuffing

A major update from current Anthropic writing is the emphasis on **just-in-time retrieval**.

Rather than loading everything upfront, agentic systems increasingly:

- keep references and identifiers lightweight
- retrieve data at runtime
- inspect only what appears relevant
- use note-taking or summaries for persistence

This pattern is especially strong in coding and research environments where:

- file paths
- directory names
- timestamps
- issue IDs
- stored queries

already act as compact routing metadata.

### 3.4 Treat Context as a Scarce Attention Budget

Context is finite in two ways:

- there is a hard or operational token ceiling
- there is also a softer quality ceiling where recall and precision degrade before the hard limit

This is the practical meaning of **context rot**. Anthropic’s current docs and the Chroma research cited in the source set both point in the same direction: more tokens are not automatically better.

### 3.5 What Should Be In Context by Default

Good default content:

- the task
- execution constraints
- the smallest stable environment description
- build/test commands
- high-signal repository-specific rules

Bad default content:

- giant global rulesets
- long low-signal style prose
- massive tool catalogs
- stale descriptive docs
- raw logs unless the current decision depends on them

### 3.6 Context Engineering Checklist

Ask these questions:

1. What must the model know before it can act safely?
2. What can be retrieved lazily?
3. What should be stored as external memory rather than kept live?
4. What should be enforced mechanically instead of explained in prose?
5. What tokens are crowding out useful reasoning?

---

## Chapter 4: The Harness Runtime

### 4.1 The Harness Is Becoming a Product Surface

The newer OpenAI engineering posts matter because they show a conceptual shift:

the harness is no longer just an internal implementation detail. It is increasingly a reusable runtime surface.

The clearest example is OpenAI’s **Codex App Server** article from **February 4, 2026**.

### 4.2 Threads, Turns, and Items

OpenAI’s App Server post gives a useful operational vocabulary:

- **thread**: the durable container for a session
- **turn**: one unit of agent work initiated by user input
- **item**: the atomic unit of input/output, such as a message, tool call, diff, or approval request

This matters because robust harnesses need stable primitives for:

- persistence
- streaming
- approvals
- reconnects
- UI rendering
- replay

### 4.3 Harnesses Need an API, Not Just a Terminal

The App Server case also shows that a serious harness often needs:

- a transport protocol
- backward-compatible semantics
- explicit lifecycle events
- thread persistence
- stable client bindings

This is a strong signal that “agent harness” is evolving into a runtime platform category, not just a local coding trick.

### 4.4 Tools, Skills, and MCP

The local source set emphasized tool quality. Recent OpenAI and Stripe material reinforces that this is still a frontier area.

Key rules:

- tools should be clear and non-overlapping
- tool outputs should be token-efficient
- tool contracts should be stable
- tool inventories should be curated, not maximal

Stripe’s **Toolshed** and OpenAI’s tool/runtime wiring both point to the same lesson: large organizations want a **shared capability layer** that many agent surfaces can reuse.

### 4.5 Blueprint Workflows vs Free Agent Loops

Stripe’s Part 2 post introduces a useful term: **blueprints**.

A blueprint is a workflow that can mix:

- deterministic steps
- agentic steps

This is one of the best industry explanations for when not to leave everything to an unconstrained tool-using loop.

Use deterministic nodes when:

- the step is cheap, repetitive, and predictable
- failure is expensive
- the LLM gains little by deciding

Examples:

- run configured linters
- push the branch
- apply known autofixes
- enforce a bounded CI retry policy

Use agentic nodes when:

- the task requires interpretation
- the search space is real
- recovery from novel failures matters

Examples:

- implement the feature
- interpret CI failures
- restructure a module
- debug a subtle interaction

### 4.6 Runtime Design Heuristics

Good harness runtimes usually make the following explicit:

- what state is durable
- what gets replayed
- what is cached
- what requires approval
- what can run unattended
- what the default compaction and memory strategy is

---

## Chapter 5: Repository Legibility

### 5.1 The Goal Is Legibility

OpenAI’s source material repeatedly emphasized that the goal is not just “documentation.” The goal is **legibility**.

A codebase is legible when the agent can determine:

- where it is
- how the system is organized
- what is canonical
- what is currently broken
- what the next step should be

### 5.2 What Belongs in the Repository

Good:

- architecture docs
- ADRs
- startup scripts
- tests
- schemas
- quality rules
- progress artifacts
- feature tracking artifacts

Use caution:

- high-level descriptive prose that duplicates executable truth
- design notes with no freshness mechanism
- long style guidelines that should be formatter/linter behavior

### 5.3 `AGENTS.md` / `CLAUDE.md`

Keep the root file small.

Recommended contents:

- install/build/test commands
- architecture map pointers
- forbidden actions
- required validation steps
- links to deeper docs

Do not try to encode the whole system in a single file.

### 5.4 ADRs Matter More in Agentic Repos

ADRs externalize human reasoning in a format the harness can reference.

The best ADRs for agent workflows are:

- short
- concrete
- connected to enforcement

Whenever possible, bind ADRs to executable rules.

### 5.5 Brownfield Adoption

Martin Fowler’s commentary and Charlie Guo’s “What’s Still Hard” section are important counterweights to overly optimistic guidance.

Retrofitting harnesses onto an old codebase is hard because:

- boundaries are already blurry
- tests may be weak
- docs may be stale
- standardization may be low
- adding strong checks all at once can produce alert floods

Recommended order in brownfield systems:

1. shortest local feedback loops
2. repository-visible state and docs
3. narrow architecture enforcement on the most important boundaries
4. stronger automation later

### 5.6 Harnesses as Service Templates

Another useful Martin Fowler extension is that harnesses may become the new **service templates** or **golden paths**.

A reusable harness template can include:

- `AGENTS.md`
- ADR directory
- pre-commit config
- default linting/formatting
- CI checks
- startup scripts
- state file conventions
- security defaults

This makes harness engineering organizational rather than purely per-repo.

---

## Chapter 6: Architecture and Deterministic Quality

### 6.1 Enforce Invariants, Not Taste by Review

Human review should not be the first line of defense for problems that are easy to check mechanically.

Put into executable systems:

- forbidden imports
- layer direction
- config protection
- required validation
- naming and shape constraints

Leave to human review:

- business correctness
- subtle product tradeoffs
- abstraction quality
- long-term design judgment

### 6.2 Recommended Constraint Types

Good candidate constraints:

- layer boundaries
- interface shape
- schema validation at boundaries
- dependency direction
- restricted config mutation
- required test presence for certain change classes

### 6.3 Error Messages Should Teach Repair

This is one of the most practical and underrated lessons in the entire source set.

A lint error should not merely say:

> invalid dependency

It should say:

- what boundary was crossed
- why the rule exists
- what legal fix patterns exist
- optionally which ADR governs the decision

### 6.4 Protect the Harness From the Agent

A frequent anti-pattern is the agent modifying rules to make failure disappear.

Protect:

- lint config
- CI config
- secret files
- environment files
- deployment manifests, depending on workflow

### 6.5 Deterministic Loops First, Prompting Second

This remains true across all sources:

- hook-enforced validation beats “please remember to run lint”
- deterministic local checks beat post-hoc human comments
- predictable fast feedback beats vague instruction layering

### 6.6 Fast Feedback Stack

Recommended stack:

1. post-edit local checks
2. pre-commit validation
3. CI
4. human review

Push every safe check downward.

---

## Chapter 7: Testing, Application Legibility, and Verification

### 7.1 Agents Need Eyes

A major recurring failure mode is that the agent thinks something is done because the code “looks right.”

That is why end-to-end verification is so important.

### 7.2 Application Legibility

The OpenAI “application legibility” idea deserves to be first-class in any serious handbook.

It is not enough for the agent to read source code. The agent should be able to observe the running system through structured interfaces:

- browser automation
- DOM snapshots
- accessibility trees
- screenshots when necessary
- logs
- metrics
- traces

Code visibility tells the agent what exists. Application legibility tells the agent whether the system behaves correctly.

### 7.3 Isolated Runtime Environments

Two concrete patterns recur here:

- **git worktree isolation**
- **standardized remote dev environments**

OpenAI emphasized bootable per-worktree application instances. Stripe emphasized standardized devboxes that are hot, parallelizable, isolated, and safe.

The shared lesson:

> agents perform better when each task has an isolated, predictable environment with low startup friction.

### 7.4 Shift Feedback Left

Stripe’s Part 2 piece sharpens an important operational principle:

If a check will fail later in CI, move it as far left as possible.

This saves:

- tokens
- CI time
- human review cycles
- debugging latency

### 7.5 E2E Strategy by Surface

Recommended hierarchy:

- **web apps**: browser automation and structured UI inspection
- **APIs**: HTTP/integration tests
- **CLI/TUI**: terminal automation
- **infra**: plan/apply validation and environment assertions
- **ML/LLM systems**: benchmark/eval loops, safety checks, drift checks

### 7.6 Verification Rules

Useful rules:

- no feature is “done” until validated in the domain that matters
- unit tests alone do not imply full feature completion
- the agent should compare outcomes against the original spec, not its own implementation

---

## Chapter 8: Long-Running Agents and State Handoffs

### 8.1 The Multi-Context-Window Problem

This is one of the biggest gaps in naive agent systems.

Even very capable models struggle when:

- the project exceeds one context window
- each session begins cold
- partial work accumulates
- no structured handoff exists

Anthropic’s long-running harness article remains one of the clearest treatments of this problem.

### 8.2 Initializer Agent -> Coding Agent

Anthropic’s two-role pattern should be treated as a core design pattern, not a side note:

- **initializer agent** creates the working environment and durable scaffolding
- **coding agent** makes incremental progress, one feature at a time

Initializer outputs often include:

- `init.sh`
- progress log
- feature list
- initial commit

### 8.3 Feature List as Ground Truth

One of the most practically useful ideas from Anthropic’s writeup is that project completeness should not be inferred from the code alone.

Instead, keep a structured feature list:

- each feature has explicit test steps
- each feature begins as failing
- completion is recorded explicitly

This prevents the agent from declaring victory just because “some code exists.”

### 8.4 Clean State Requirement

Every session should end in a handoff-ready condition.

That means:

- no unrelated brokenness left behind
- code committed or reverted to a good baseline
- progress updated
- next steps externalized

The moment clean state is abandoned, long-horizon runs degrade sharply.

### 8.5 Standard Startup Sequence

A good startup sequence usually includes:

1. confirm current directory
2. read recent git history
3. read progress artifacts
4. read feature list
5. run init script
6. run a basic end-to-end smoke path
7. only then start new work

This avoids building new work on top of an already broken base.

### 8.6 Git as the Session Bridge

Git is valuable not only for source control, but also as cognitive scaffolding:

- commit history explains recent change intent
- clean reverts recover working states
- descriptive commit messages help the next agent

### 8.7 Structured State Files

Use files for state the next session must know.

Good candidates:

- progress log
- feature list
- known issues
- next-step note
- task queue

JSON is often safer than Markdown for highly structured status.

---

## Chapter 9: Context Rot, Compaction, Memory, and Search

### 9.1 Context Rot Is Real

Current Anthropic writing and the earlier Chroma work both support the same practical warning:

- long context degrades retrieval and focus
- bloated context reduces precision
- more context is only helpful if the added context is relevant and legible

### 9.2 Compaction

Compaction is now a mainstream harness technique.

Its purpose is simple:

- summarize what still matters
- discard low-value residue
- restart with a smaller, coherent state

OpenAI’s January 2026 post and Anthropic’s current docs both show compaction as a first-class concern in mature agent runtimes.

### 9.3 Tool Result Clearing and Offloading

Not every tool result needs to live forever in context.

Safe and useful tactics:

- keep only summaries in context
- write large outputs to files
- let the agent reopen the file if needed

This is one of the most reliable ways to keep the context window usable over long sessions.

### 9.4 Structured Note-Taking

Anthropic’s newer context-engineering article is particularly strong on this point.

Structured note-taking or memory systems help agents:

- preserve long-horizon progress
- carry goals across context resets
- recover after compaction
- keep the main context focused

The key is not to store everything, but to store the parts that matter for future action.

### 9.5 Just-in-Time Search

Use search and retrieval as runtime navigation, not as an excuse to preload everything.

High-signal patterns:

- search directory first, then file
- use filenames and folder structure as routing clues
- retrieve slices, not full corpora

### 9.6 Context Awareness as a Runtime Feature

Anthropic’s current docs add a useful new idea to the discussion: **context awareness** in the model/runtime interaction.

The important operational takeaway is not the product-specific detail. It is that better harnesses increasingly expose the remaining token budget and context state to the agent so it can adapt its own behavior.

That suggests a design direction for harnesses broadly:

- make runtime limits visible
- do not force the model to guess how much budget is left

---

## Chapter 10: Orchestration, Autonomy, and Scale

### 10.1 Attended vs Unattended

The local source set distinguishes two modes clearly:

- **attended parallelization**: humans supervise several live agent runs
- **unattended execution**: the agent proceeds from task to PR with little or no supervision

The higher the autonomy, the stronger the harness must be.

### 10.2 Parallelism Needs Isolation

Rohit’s synthesis and Stripe’s practical experience both reinforce this:

- one agent per isolated worktree or environment
- no shared mutable workspace between unrelated runs
- predictable cleanup after the run

### 10.3 Merge Philosophy Changes With Throughput

OpenAI’s article made an uncomfortable but important point:

When agent throughput exceeds human attention, the process that worked for low-throughput human coding may become counterproductive.

That does **not** mean dropping quality bars. It means:

- tightening automation
- keeping changes small
- reducing unnecessary waiting
- handling flake and low-signal failure with better automation rather than endless blocking

### 10.4 Reasoning Budgets and Subtasks

LangChain’s work adds a practical lesson:

- use more reasoning where planning or verification benefit from it
- do not spend maximum reasoning everywhere by default

This is a harness concern, not just a model setting.

### 10.5 Sub-Agents

Recent Anthropic context-engineering guidance adds more confidence to an already-emerging pattern:

sub-agents are useful when they isolate:

- deep exploration
- specialized verification
- bounded research subtasks
- focused repair work

The lead agent should receive the distillation, not the entire exploratory trace.

---

## Chapter 11: Minimum Viable Harness, Revisited

### 11.1 Week 1

Ship the minimum box:

1. short `AGENTS.md`
2. build/test/lint commands
3. pre-commit
4. at least one smoke test
5. one ADR
6. protected config files

### 11.2 Week 2-4

Improve reliability:

1. E2E or browser automation for one core flow
2. stronger architecture boundaries
3. progress/state artifacts
4. feature tracking if the work is long horizon
5. stop/verification gate

### 11.3 Month 2+

Start scaling:

1. custom lint rules with remediation guidance
2. structured cleanup routines
3. worktree or remote-environment isolation
4. curated shared tool layer
5. basic telemetry and quality metrics

### 11.4 Organization Scale

When multiple teams adopt agentic coding, invest in:

- harness templates
- shared developer environments
- central tool discovery
- policy and security controls
- per-team customization on top of the standard base

---

## Chapter 12: Common Anti-Patterns

### 12.1 Giant Instruction Files

Symptoms:

- slow orientation
- conflicting rules
- low recall of the actual important parts

Better:

- map at the root
- scoped rules deeper in the tree

### 12.2 Human-Only Documentation

If the real decision logic lives in chat or meetings, the agent will repeatedly violate it.

### 12.3 Weak Startup Routines

Without a startup sequence, each session wastes tokens rediscovering the same state.

### 12.4 Letting the Agent Edit the Rules

If the agent can quietly weaken lint or CI config, the harness collapses.

### 12.5 Context Flooding

Common causes:

- huge search output
- full-file dumps
- entire logs pasted into context
- too many globally loaded tools

### 12.6 Trusting Self-Reported Completion

Agents frequently stop too early when verification is weak.

### 12.7 Infinite CI Retry Loops

Bound retries. Otherwise the system burns:

- tokens
- time
- CI minutes
- operator trust

### 12.8 Over-Building Agent-Only Systems

If the same outcome can be achieved by improving the main developer platform, prefer that path.

---

## Chapter 13: Open Questions

Some things are still unsettled.

### 13.1 How Much Structure Should Be Deterministic?

Too little structure creates slop.
Too much structure can overfit to today’s model weaknesses.

### 13.2 How Far Can Long-Horizon Agents Go With a Single Role?

Anthropic explicitly leaves open whether multi-agent specialization will outperform a single generalist coding agent across long contexts.

### 13.3 How Universal Are These Patterns Across Domains?

The strongest industrial examples are still in coding-heavy environments. Some lessons clearly transfer to research and analysis, but not all do so directly.

### 13.4 How Should Brownfield Adoption Be Sequenced?

This remains under-specified in most success stories because many public examples come from greenfield or strongly standardized environments.

---

## Chapter 14: Practical Reference

### 14.1 What to Put in `AGENTS.md`

- install/build/test commands
- architecture pointers
- key rules
- forbidden actions
- completion criteria

### 14.2 What to Externalize Into State Files

- progress
- known issues
- task queue
- feature completeness
- next session handoff

### 14.3 What to Enforce Mechanically

- lint
- formatting
- type checks
- dependency direction
- protected config
- mandatory validation paths

### 14.4 What Humans Should Still Own

- architecture direction
- product intent
- acceptance bar
- review of high-impact tradeoffs

---

## Sources and Freshness Notes

### Local Source Set Cross-Checked

The revised handbook was checked against these local files:

- `harness-engineering/original/01-harness-engineering-leveraging-codex-in-an-agent-first-world.md`
- `harness-engineering/original/02-harness-engineering.md`
- `harness-engineering/original/03-rohit-harness-is-everything.md`
- `harness-engineering/original/04-langchain-improving-deep-agents.md`
- `harness-engineering/original/04b-viv-anatomy-of-agent-harness.md`
- `harness-engineering/original/05-harness-engineering-the-complete-guide-to-building-systems-that-make-ai-agents-actually-work-2026.md`
- `harness-engineering/original/06-the-emerging-harness-engineering-playbook.md`
- `harness-engineering/original/07-claude-code-codex-harness-engineering-best-practices-for-everyone.md`
- `harness-engineering/original/08-george-harness-engineering-is-cybernetics.md`

### Newer Primary Sources Incorporated

These were used to refresh the handbook beyond the local source set:

1. OpenAI, **January 23, 2026**  
   _Unrolling the Codex agent loop_  
   https://openai.com/index/unrolling-the-codex-agent-loop/

2. OpenAI, **February 4, 2026**  
   _Unlocking the Codex harness: how we built the App Server_  
   https://openai.com/index/unlocking-the-codex-harness/

3. Stripe, **February 19, 2026**  
   _Minions: Stripe’s one-shot, end-to-end coding agents—Part 2_  
   https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2

4. Anthropic, **current docs/pages accessed March 25, 2026**  
   _Effective context engineering for AI agents_  
   https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

5. Anthropic, **current docs/pages accessed March 25, 2026**  
   _Context windows_  
   https://platform.claude.com/docs/en/build-with-claude/context-windows

### Recent Research Incorporated

1. Sapunov, **arXiv:2603.00601**, revised **March 18, 2026**  
   _Theory of Code Space: Do Code Agents Understand Software Architecture?_  
   https://arxiv.org/abs/2603.00601

This paper is especially relevant for the handbook’s claims about architectural understanding, partial observability, and the value of externalized belief/state artifacts.

### Guidance on Freshness

The dated articles above are safe historical anchors.  
The current docs above are more likely to evolve and should be treated as **current implementation guidance**, not timeless principles.

