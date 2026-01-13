# ADR-002: Domain Location Standardization

**Status:** Accepted
**Date:** 2026-01-11
**Context:** Architecture Review

## Context

The project has domain code in two different locations:
1. **Shared domain** - `src/shared/domain/` (e.g., reporting, notifications)
2. **Slice-specific domain** - `src/slices/*/domain/` (e.g., user-management, auth)

This inconsistency causes:
- Confusion about where to place new domain code
- Inconsistent import paths
- Unclear ownership of domain concepts

## Decision

**Standardize domain location** based on the following principle:

- **Shared domain concepts** (used across multiple slices) → `src/shared/domain/`
- **Slice-specific domain concepts** (used only within one slice) → `src/slices/{slice-name}/domain/`

### Rationale

1. **Separation of concerns** - Shared domain should be truly shared
2. **Bounded context clarity** - Each slice owns its domain
3. **Reduced coupling** - Shared domain shouldn't depend on slices
4. **Clear ownership** - Each slice is responsible for its domain

### Domain Location Guidelines

| Domain Type | Location | Examples |
|-------------|---------|-----------|
| **Shared Value Objects** | `src/shared/domain/value-objects/` | `UniqueId`, `Email`, `DateRange` |
| **Shared Base Classes** | `src/shared/domain/base/` | `Entity`, `AggregateRoot`, `ValueObject` |
| **Shared Exceptions** | `src/shared/domain/exceptions/` | `ValidationError`, `NotFoundError` |
| **Shared Domain Services** | `src/shared/domain/{feature}/services/` | `NotificationRoutingService` |
| **Slice Entities** | `src/slices/{slice}/domain/entities/` | `User`, `Workflow`, `Integration` |
| **Slice Value Objects** | `src/slices/{slice}/domain/value-objects/` | `SettingKey`, `WorkflowStatus` |
| **Slice Events** | `src/slices/{slice}/domain/events/` | `UserCreatedEvent`, `WorkflowActivatedEvent` |
| **Slice Services** | `src/slices/{slice}/domain/services/` | `AuthService`, `WorkflowService` |

### Current State Analysis

| Domain Concept | Current Location | Recommended Location |
|----------------|------------------|---------------------|
| `Report` | `src/shared/domain/reporting/entities/` | ✅ Correct (shared across slices) |
| `ReportTemplate` | `src/shared/domain/reporting/entities/` | ✅ Correct (shared across slices) |
| `ScheduledReport` | `src/shared/domain/reporting/entities/` | ✅ Correct (shared across slices) |
| `Notification` | `src/shared/domain/notifications/entities/` | ✅ Correct (shared across slices) |
| `User` | `src/slices/user-management/domain/entities/` | ✅ Correct (slice-specific) |
| `Workflow` | `src/slices/workflows/domain/entities/` | ✅ Correct (slice-specific) |
| `Dashboard` | `src/slices/analytics/domain/entities/` | ✅ Correct (slice-specific) |
| `Integration` | `src/slices/integrations/domain/entities/` | ✅ Correct (slice-specific) |

**Conclusion:** The current domain location is already well-organized. No refactoring needed.

## Consequences

### Positive

- Clear ownership of domain concepts
- Reduced coupling between slices
- Consistent import patterns
- Easier to understand codebase structure

### Negative

- Some shared domain in `src/shared/domain/{feature}/` may need to be moved if it becomes slice-specific

## Migration Guide

When creating new domain code, follow these guidelines:

### Creating a New Slice

```
src/slices/new-slice/
├── domain/
│   ├── entities/          # Slice-specific entities
│   ├── value-objects/     # Slice-specific value objects
│   ├── events/            # Slice-specific domain events
│   ├── services/          # Slice-specific domain services
│   └── repositories/      # Repository interfaces
├── application/
├── infrastructure/
└── presentation/
```

### Creating Shared Domain Code

```
src/shared/domain/
├── base/                 # Base classes
├── exceptions/            # Shared exceptions
├── value-objects/        # Shared value objects
└── {feature}/            # Feature-specific shared domain
    ├── entities/
    ├── value-objects/
    └── services/
```

## References

- [Architecture Review Report](../architecture-review.md)
- [ADR-001: DI Container Standardization](./adr-001-di-container-standardization.md)
- [Domain-Driven Design](https://domainlanguage.com/ddd/)
