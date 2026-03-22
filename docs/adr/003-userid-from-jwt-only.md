# ADR-003: userId Extracted from JWT Only

- **Status**: Accepted
- **Date**: 2026-03-22
- **Enforced by**: Code review, integration tests

## Context

Trusting client-provided identity (e.g., userId in request body or URL params)
is a common source of authorization bypass vulnerabilities.

## Decision

userId is always extracted from the JWT payload via the auth session.
It is never accepted from request body, query parameters, or URL params.
All database queries for user-owned resources must be scoped by the authenticated userId.

## Consequences

### Positive
- Eliminates a class of authorization bypass bugs
- Consistent identity source across all endpoints

### Negative
- Admin endpoints that operate on other users need explicit role checks

### Enforcement
- Code review
- Integration tests verify ownership scoping
