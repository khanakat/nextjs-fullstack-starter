# ADR-001: DI Container Standardization

**Status:** Accepted
**Date:** 2026-01-11
**Context:** Architecture Review

## Context

The project had two different DI container implementations:
1. Custom DI container in `src/shared/infrastructure/dependency-injection/container.ts`
2. Inversify-based container in `src/shared/infrastructure/di/container.ts`

This duplication caused:
- Confusion about which container to use
- Potential for inconsistent registration
- Maintenance overhead
- Unclear API for dependency injection

## Decision

**Standardize on Inversify-based DI container** and remove the custom implementation.

### Rationale

1. **Inversify is already used** by all slices in their DI configuration
2. **Type safety** - Inversify provides compile-time type checking
3. **Community support** - Well-established library with good documentation
4. **Feature completeness** - Supports scopes (singleton, transient, scoped), decorators, and auto-binding
5. **Consistency** - All slices already use Inversify patterns

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|-------|
| **Keep Custom Container** | Simpler code | Less features, no type safety, no community support |
| **Use Awilix** | Fast, small | Less popular, different API |
| **Use Tsyringe** | Decorator-based | Less mature than Inversify |

## Consequences

### Positive

- Single source of truth for DI
- Type-safe dependency injection
- Consistent patterns across all slices
- Better IDE support with decorators
- Built-in scoping support

### Negative

- Additional dependency (inversify package)
- Slightly more verbose API
- Requires `reflect-metadata` polyfill

## Implementation

1. Removed `src/shared/infrastructure/dependency-injection/container.ts`
2. Removed `src/shared/infrastructure/dependency-injection/index.ts`
3. Updated `src/shared/infrastructure/index.ts` to export from `di/` directory
4. Created `src/shared/infrastructure/di/index.ts` for clean exports

## References

- [Inversify Documentation](https://inversify.io/)
- [Architecture Review Report](../architecture-review.md)
- [Clean Architecture Migration Plan](./clean-architecture-migration-plan.md)
