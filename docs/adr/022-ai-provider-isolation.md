# ADR-022: AI Provider Isolation in the Providers Layer

- **Status**: Accepted (backfilled 2026-04-17)
- **Date**: 2026-04-17
- **Enforced by**: `src/providers/` layer boundary (ADR-005), `src/services/ai.ts`, code review

## Context

The project uses the Anthropic SDK (`@anthropic-ai/sdk`) for AI features. AI vendors are in flux: pricing, rate limits, and API shapes shift. Binding the application to a specific vendor at every call site creates lock-in that is painful to reverse.

The six-layer architecture (ADR-005) already has a `providers/` layer whose purpose is exactly this: wrap third-party SDKs so the rest of the app depends on *our* interface, not the vendor's.

## Decision

All AI SDK calls are made from the **providers layer** (`src/providers/`). Services (`src/services/ai.ts`) call a thin provider wrapper, not the Anthropic SDK directly.

- `src/providers/` contains a module that wraps `@anthropic-ai/sdk` and exports domain-shaped functions (e.g., `generateReply(input) → output`)
- `src/services/ai.ts` orchestrates business logic using the provider's domain interface
- Route handlers never import the Anthropic SDK

Swapping providers (Anthropic → OpenAI → a local model) means replacing the one wrapper module, not combing through the codebase.

## Consequences

### Positive
- Provider swaps are surgical, not systemic
- Mocking the provider for tests is trivial — services depend on an interface, not an SDK
- API key handling stays in one place (via ADR-008 env config)
- Matches the existing layering pattern (ADR-005) — no new convention

### Negative
- Extra layer of indirection for simple AI calls
- The provider wrapper becomes the lowest-common-denominator of supported models' APIs — advanced vendor-specific features may be harder to expose

### Enforcement
- Import of `@anthropic-ai/sdk` allowed only from `src/providers/`
- `src/services/` imports the provider wrapper, never the SDK
- Adding a second AI vendor (OpenAI, Gemini, local) is an ADR trigger (ADR-002)
