# Phase 3: Business Features Migration

## Overview

This document outlines the migration of business features to Clean Architecture. Phase 3 focuses on implementing the core business functionality of the application in a clean, maintainable, and testable manner.

## Status

| Feature | Domain Layer | Application Layer | Infrastructure Layer | Presentation Layer | Integration | Documentation |
|---------|--------------|-------------------|---------------------|-------------------|-------------|----------------|
| Analytics | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete |
| Workflows | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete |
| Integrations | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete |
| Reports | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending |

## Overall Progress

- ✅ **3 of 4 features completed** (75%)
- 🔄 **1 feature remaining** (Reports)
- ✅ **All completed features fully integrated and documented**

## Migration Strategy

### Priority Order

1. **Analytics** - Core analytics for business intelligence
2. **Workflows** - Business process automation
3. **Integrations** - Third-party service connections
4. **Reports** - Business reporting and dashboards

### Migration Approach

For each business feature, we will:
1. Create a dedicated slice following the auth slice structure
2. Implement domain layer (value objects, entities, repository interfaces, service interfaces)
3. Implement application layer (commands, queries, DTOs)
4. Implement infrastructure layer (repositories, services)
5. Implement presentation layer (API routes, controllers)
6. Create use cases for orchestrating business logic
7. Integrate with existing systems where applicable

### Slice Structure Template

```
src/slices/{feature-name}/
├── domain/
│   ├── value-objects/
│   ├── entities/
│   ├── repositories/
│   └── services/
├── application/
│   ├── commands/
│   ├── queries/
│   ├── dtos/
│   ├── handlers/
│   ├── use-cases/
│   └── index.ts
├── infrastructure/
│   ├── repositories/
│   └── services/
├── presentation/
│   ├── api/
│   └── controllers/
└── index.ts
```

## Analytics Slice

### Status: ✅ Complete

### Domain Layer

**Value Objects:**
- `DashboardId` - Unique identifier for dashboards

**Entities:**
- `Dashboard` - Analytics dashboard entity with status management

**Repository Interfaces:**
- `IDashboardRepository` - Dashboard repository interface

**Application Layer:**

**Commands:**
- `CreateDashboardCommand` - Create a new dashboard
- `UpdateDashboardCommand` - Update an existing dashboard
- `DeleteDashboardCommand` - Delete a dashboard

**Queries:**
- `GetDashboardQuery` - Get a single dashboard
- `GetDashboardsQuery` - Get multiple dashboards with filtering and pagination

**DTOs:**
- `DashboardDto` - Data transfer object for dashboards

**Handlers:**
- `CreateDashboardHandler` - Handle dashboard creation
- `UpdateDashboardHandler` - Handle dashboard updates
- `DeleteDashboardHandler` - Handle dashboard deletion
- `GetDashboardHandler` - Handle dashboard retrieval
- `GetDashboardsHandler` - Handle multiple dashboard retrieval

**Use Cases:**
- `CreateDashboardUseCase` - Orchestrate dashboard creation
- `UpdateDashboardUseCase` - Orchestrate dashboard updates
- `DeleteDashboardUseCase` - Orchestrate dashboard deletion
- `GetDashboardUseCase` - Orchestrate dashboard retrieval
- `GetDashboardsUseCase` - Orchestrate multiple dashboard retrieval

**Infrastructure Layer:**

**Repositories:**
- `PrismaDashboardRepository` - Prisma implementation of dashboard repository

**Presentation Layer:**

**API Routes:**
- `POST /api/dashboards` - Create a dashboard
- `PUT /api/dashboards/[id]` - Update a dashboard
- `DELETE /api/dashboards/[id]` - Delete a dashboard
- `GET /api/dashboards/[id]` - Get a dashboard
- `GET /api/dashboards` - Get multiple dashboards

**Documentation:**
- [Analytics Slice Integration Guide](./phase3-analytics-integration.md)

## Workflows Slice

### Status: ✅ Complete

### Domain Layer

**Value Objects:**
- `WorkflowId` - Unique identifier for workflows

**Entities:**
- `Workflow` - Main workflow entity with status management

**Repository Interfaces:**
- `IWorkflowRepository` - Workflow repository interface

**Application Layer:**

**Commands:**
- `CreateWorkflowCommand` - Create a new workflow
- `UpdateWorkflowCommand` - Update an existing workflow
- `DeleteWorkflowCommand` - Delete a workflow

**Queries:**
- `GetWorkflowQuery` - Get a single workflow
- `GetWorkflowsQuery` - Get multiple workflows with filtering and pagination

**DTOs:**
- `WorkflowDto` - Data transfer object for workflows

**Handlers:**
- `CreateWorkflowHandler` - Handle workflow creation
- `UpdateWorkflowHandler` - Handle workflow updates
- `DeleteWorkflowHandler` - Handle workflow deletion
- `GetWorkflowHandler` - Handle workflow retrieval
- `GetWorkflowsHandler` - Handle multiple workflow retrieval

**Use Cases:**
- `CreateWorkflowUseCase` - Orchestrate workflow creation
- `UpdateWorkflowUseCase` - Orchestrate workflow updates
- `DeleteWorkflowUseCase` - Orchestrate workflow deletion
- `GetWorkflowUseCase` - Orchestrate workflow retrieval
- `GetWorkflowsUseCase` - Orchestrate multiple workflow retrieval

**Infrastructure Layer:**

**Repositories:**
- `PrismaWorkflowRepository` - Prisma implementation of workflow repository

**Presentation Layer:**

**API Routes:**
- `POST /api/workflows` - Create a workflow
- `PUT /api/workflows/[id]` - Update a workflow
- `DELETE /api/workflows/[id]` - Delete a workflow
- `GET /api/workflows/[id]` - Get a workflow
- `GET /api/workflows` - Get multiple workflows

**Documentation:**
- [Workflows Slice Integration Guide](./phase3-workflows-integration.md)

## Integrations Slice

### Status: ✅ Complete

### Domain Layer

**Value Objects:**
- `IntegrationId` - Unique identifier for integrations

**Entities:**
- `Integration` - Third-party integration entity with status management

**Repository Interfaces:**
- `IIntegrationRepository` - Integration repository interface

**Application Layer:**

**Commands:**
- `CreateIntegrationCommand` - Create a new integration
- `UpdateIntegrationCommand` - Update an existing integration
- `DeleteIntegrationCommand` - Delete an integration

**Queries:**
- `GetIntegrationQuery` - Get a single integration
- `GetIntegrationsQuery` - Get multiple integrations with filtering and pagination

**DTOs:**
- `IntegrationDto` - Data transfer object for integrations

**Handlers:**
- `CreateIntegrationHandler` - Handle integration creation
- `UpdateIntegrationHandler` - Handle integration updates
- `DeleteIntegrationHandler` - Handle integration deletion
- `GetIntegrationHandler` - Handle integration retrieval
- `GetIntegrationsHandler` - Handle multiple integration retrieval

**Use Cases:**
- `CreateIntegrationUseCase` - Orchestrate integration creation
- `UpdateIntegrationUseCase` - Orchestrate integration updates
- `DeleteIntegrationUseCase` - Orchestrate integration deletion
- `GetIntegrationUseCase` - Orchestrate integration retrieval
- `GetIntegrationsUseCase` - Orchestrate multiple integration retrieval

**Infrastructure Layer:**

**Repositories:**
- `PrismaIntegrationRepository` - Prisma implementation of integration repository

**Presentation Layer:**

**API Routes:**
- `POST /api/integrations` - Create an integration
- `PUT /api/integrations/[id]` - Update an integration
- `DELETE /api/integrations/[id]` - Delete an integration
- `GET /api/integrations/[id]` - Get an integration
- `GET /api/integrations` - Get multiple integrations

**Documentation:**
- [Integrations Slice Integration Guide](./phase3-integrations-integration.md)

## Reports Slice

### Status: ⏳ Pending

### Domain Layer

**Value Objects:**
- `ReportId` - Unique identifier for reports
- `ReportConfig` - Report configuration

**Entities:**
- `Report` - Report entity
- `ReportSchedule` - Report schedule configuration
- `ReportTemplate` - Report template entity

**Repository Interfaces:**
- `IReportRepository` - Report repository interface
- `IReportTemplateRepository` - Template repository interface

**Service Interfaces:**
- `IReportGenerationService` - Report generation service
- `IReportOrchestrationService` - Report orchestration service
- `IReportSchedulerService` - Report scheduling service

**Note:** The reporting slice is partially implemented in `src/slices/reporting/` and needs to be migrated to Clean Architecture following the same pattern as the other slices.

## Implementation Notes

### Existing Codebase

The project has existing implementations in:
- `src/slices/reporting/` - Reporting functionality
- `src/slices/analytics/` - Analytics features (partial)
- `src/slices/workflows/` - Workflow management (partial)
- `src/slices/integrations/` - Third-party integrations (partial)

### Integration Points

The new business features will integrate with:
- **Existing Services**: `lib/services/analytics-service.ts`, `lib/services/workflow-templates-service.ts`, `lib/services/report-templates-service.ts`
- **Existing Repositories**: Prisma repositories for reporting
- **Existing API Routes**: Next.js API routes for reports

### Migration Timeline

| Phase | Feature | Status | Priority | Est. Effort | Actual Effort |
|------|------|--------|-------|------------|---------------|
| 1 | Analytics | ✅ Complete | High | 2 weeks | 2 weeks |
| 2 | Workflows | ✅ Complete | High | 2 weeks | 2 weeks |
| 3 | Integrations | ✅ Complete | Medium | 1 week | 1 week |
| 4 | Reports | ⏳ Pending | Medium | 1 week | TBD |

## Next Steps

### Reports Slice (Remaining)

1. Create reports slice domain layer
2. Create reports slice application layer
3. Create reports slice infrastructure layer
4. Create reports slice presentation layer
5. Integrate with existing report generation
6. Create reports slice integration documentation
7. Update DI container with reports types
8. Update Phase 3 documentation

### Phase 4: Integration and Testing

After completing the Reports slice, proceed with:
1. Comprehensive testing across all slices
2. Performance optimization
3. Security audit
4. Documentation finalization
5. Deployment preparation

## Success Criteria

Each business feature slice will be considered complete when:
- ✅ Domain layer with all value objects, entities, repository interfaces, service interfaces
- ✅ Application layer with commands, queries, DTOs, handlers, use cases
- ✅ Infrastructure layer with repositories and services
- ✅ Presentation layer with API routes and controllers
- ✅ Integration with existing systems
- ✅ Tests covering all use cases
- ✅ Documentation updated

## Dependencies

The business features migration depends on:
- Clean Architecture patterns established in auth slice
- Domain-driven design patterns from auth slice
- CQRS pattern for command/query separation
- Repository and service interfaces
- DTOs for data transfer between layers
- Use cases for business logic orchestration

## Risks

- **Complexity**: Business features involve complex domain logic and business rules
- **Integration**: Requires careful integration with existing systems
- **Data Migration**: May require data migration from legacy systems
- **Testing**: Comprehensive test coverage required for business logic

## Rollout Strategy

Given the complexity of business features, the migration was phased:
1. ✅ **Analytics** (highest priority, most isolated) - Completed
2. ✅ **Workflows** (high priority, moderate complexity) - Completed
3. ✅ **Integrations** (medium priority, external dependencies) - Completed
4. ⏳ **Reports** (medium priority, depends on analytics) - Pending

This ensures each feature is fully functional before moving to the next one.

## Lessons Learned

### Successful Patterns

1. **Consistent Layer Structure**: All slices follow the same layer structure (domain, application, infrastructure, presentation)
2. **CQRS Pattern**: Separation of commands and queries works well for business features
3. **Result Pattern**: Using `Result<T>` for consistent error handling across all slices
4. **Dependency Injection**: InversifyJS container provides clean dependency management
5. **Value Objects**: Using value objects for IDs and other domain concepts improves type safety

### Challenges Overcome

1. **Prisma Schema Compatibility**: Resolved by adding domain entity fields to match Prisma schema
2. **Date Handling**: Implemented proper Date conversion in repository `toDomain()` methods
3. **API Route Integration**: Used Next.js API routes instead of traditional controllers
4. **Type Safety**: Ensured all handlers return `Result<T>` with proper type annotations
5. **Domain Events**: Implemented domain events for all aggregate roots

### Best Practices Established

1. **Factory Methods**: Use `create()` for new entities and `reconstitute()` for existing entities
2. **Status Management**: Use enums for status types with business methods for state transitions
3. **Pagination**: Implement pagination with `limit` (default 50, max 100) and `offset` parameters
4. **Filtering**: Support filtering by multiple criteria in repository queries
5. **DTOs**: Extend `Dto` base class with proper `toDto()` methods for entity-to-DTO conversion

## Additional Resources

- [Clean Architecture Migration Plan](./clean-architecture-migration-plan.md)
- [Integration Guide](./phase3-integration-guide.md)
- [Analytics Slice Integration](./phase3-analytics-integration.md)
- [Workflows Slice Integration](./phase3-workflows-integration.md)
- [Integrations Slice Integration](./phase3-integrations-integration.md)
- [Current Architecture Documentation](../architecture/current-architecture.md)
- [Features Overview](../features/overview.md)
