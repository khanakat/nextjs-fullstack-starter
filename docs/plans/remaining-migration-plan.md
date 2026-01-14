# Remaining Clean Architecture Migration Plan

**Document Version:** 1.0
**Last Updated:** 2026-01-14
**Current Overall Progress:** 93% Complete
**Phase 6 Progress:** 55% Complete

## Executive Summary

This document outlines the remaining work to complete the Clean Architecture migration for the Next.js Fullstack Starter project. The migration has successfully completed the foundation phases and most P0 API routes. The remaining work consists of:

1. **Complex sub-route migrations** (requires domain modeling)
2. **Service layer migrations** (refactor to Clean Architecture)
3. **Utility reorganization** (consolidate and standardize)

## Migration Status Overview

### Completed ✅

- **Phase 1-5:** 100% Complete (Foundation, Core Slices, Business Features, Supporting Features, Advanced Features)
- **P0 API Routes (9 routes):**
  - ✅ Reports API
  - ✅ Comments API
  - ✅ ReportTemplates API
  - ✅ Workflows main routes (route.ts, [id]/route.ts)
  - ✅ Audit API ([id]/route.ts)
  - ✅ Integrations main route
  - ✅ Organizations main route
  - ✅ Notifications main route
  - ✅ Analytics/Dashboards routes

### Remaining Work 🚧

- **Sub-route migrations:** 70+ API routes requiring varying levels of effort
- **Service layer:** 27 service files to refactor
- **Utilities:** Reorganization and standardization

---

## Part 1: API Route Migrations (70+ routes)

### Category A: High Complexity - Requires Full Domain Modeling

These routes need complete domain entities, repositories, handlers, and controllers created from scratch.

#### 1.1 Workflow Sub-Routes (6 routes)

**Location:** `app/api/workflows/`

**Domain Models Needed:**
- `WorkflowInstance` - Running workflow instances
- `WorkflowTask` - Individual tasks within instances
- `WorkflowTemplate` - Reusable workflow templates

**Routes to Migrate:**
1. `templates/route.ts` - Workflow templates CRUD
2. `tasks/route.ts` - Task list and management
3. `tasks/[id]/route.ts` - Individual task operations
4. `instances/route.ts` - Workflow instances CRUD
5. `instances/[id]/route.ts` - Instance management
6. `[id]/execute/route.ts` - Execute workflow

**Estimated Effort:** 16-24 hours

**Implementation Steps:**
1. Create domain entities:
   - `WorkflowInstance` (id, workflowId, status, startedAt, completedAt, context)
   - `WorkflowTask` (id, instanceId, name, status, result, error)
   - `WorkflowTemplate` (id, name, description, definition, category)

2. Create repository interfaces:
   - `IWorkflowInstanceRepository`
   - `IWorkflowTaskRepository`
   - `IWorkflowTemplateRepository`

3. Create Prisma repositories:
   - `PrismaWorkflowInstanceRepository`
   - `PrismaWorkflowTaskRepository`
   - `PrismaWorkflowTemplateRepository`

4. Create commands/queries:
   - `CreateInstanceCommand`, `GetInstanceQuery`, `ListInstancesQuery`
   - `CreateTaskCommand`, `UpdateTaskCommand`, `GetTaskQuery`, `ListTasksQuery`
   - `CreateTemplateCommand`, `UpdateTemplateCommand`, `DeleteTemplateCommand`
   - `ExecuteWorkflowCommand`

5. Create handlers (12-15 handlers)

6. Create controllers:
   - `WorkflowInstancesApiController`
   - `WorkflowTasksApiController`
   - `WorkflowTemplatesApiController`

7. Migrate API routes

8. Update DI container bindings

**Dependencies:**
- Existing Workflow entity
- Prisma schema must have instances, tasks, templates tables

**Business Logic:**
- Workflow execution engine
- Task lifecycle management
- Template versioning
- Instance state tracking
- Error handling and retry logic

---

#### 1.2 Integration Sub-Routes (3 routes)

**Location:** `app/api/integrations/`

**Domain Models Needed:**
- `IntegrationTemplate` - Reusable integration templates
- `Webhook` - Webhook configuration and management
- `WebhookEvent` - Webhook event logs

**Routes to Migrate:**
1. `templates/route.ts` - Integration templates
2. `webhooks/[id]/test/route.ts` - Test webhook
3. `webhooks/[id]/stats/route.ts` - Webhook statistics
4. `[id]/sync/route.ts` - Trigger integration sync

**Estimated Effort:** 12-16 hours

**Implementation Steps:**
1. Create domain entities:
   - `IntegrationTemplate` (id, name, provider, type, configSchema)
   - `Webhook` (id, integrationId, url, events, secret, isActive)
   - `WebhookEvent` (id, webhookId, payload, response, status)

2. Create repositories (3 repositories)

3. Create commands/queries:
   - Template CRUD commands/queries
   - Webhook CRUD commands/queries
   - TestWebhookCommand
   - SyncIntegrationCommand
   - GetWebhookStatsQuery

4. Create handlers (10-12 handlers)

5. Create controllers:
   - `IntegrationTemplatesApiController`
   - `WebhooksApiController`

6. Migrate API routes

7. Update DI container

**Dependencies:**
- Existing Integration entity
- Webhook delivery service
- External API sync logic

**Business Logic:**
- Template validation and instantiation
- Webhook signature verification
- Retry logic for failed webhooks
- Sync job orchestration
- Webhook event logging and analytics

---

#### 1.3 Analytics Sub-Routes (3 routes)

**Location:** `app/api/analytics/`

**Domain Models Needed:**
- `Metric` - Analytics metric definitions
- `Query` - Saved analytics queries
- `Widget` - Dashboard widgets

**Routes to Migrate:**
1. `metrics/route.ts` - Metrics API
2. `queries/route.ts` - Saved queries
3. `queries/[id]/execute/route.ts` - Execute saved query
4. `widgets/[id]/route.ts` - Widget operations

**Estimated Effort:** 12-16 hours

**Implementation Steps:**
1. Create domain entities:
   - `Metric` (id, name, type, dataSource, aggregation)
   - `AnalyticsQuery` (id, name, query, parameters, owner)
   - `Widget` (id, dashboardId, type, config, position)

2. Create repositories (3 repositories)

3. Create commands/queries:
   - Metric CRUD commands/queries
   - Query CRUD commands/queries
   - ExecuteQueryCommand
   - Widget CRUD commands/queries

4. Create handlers (10-12 handlers)

5. Create controllers:
   - `MetricsApiController`
   - `AnalyticsQueriesApiController`
   - `WidgetsApiController`

6. Migrate API routes

7. Update DI container

**Dependencies:**
- Existing Dashboard entity
- Query execution engine
- Data source connectors

**Business Logic:**
- Metric aggregation and calculation
- Query validation and sanitization
- Widget data caching
- Real-time data updates
- Time zone handling

---

### Category B: Medium Complexity - Existing Infrastructure

These routes can leverage existing Clean Architecture components but need new controllers/handlers.

#### 2.1 Organization Sub-Routes (4 routes)

**Location:** `app/api/organizations/`

**Existing Infrastructure:**
- ✅ Organization domain entity
- ✅ OrganizationRepository
- ✅ Organization handlers

**Routes to Migrate:**
1. `[id]/route.ts` - Get/update organization
2. `[id]/members/route.ts` - List members
3. `[id]/members/[memberId]/route.ts` - Member operations
4. `invites/[inviteId]/route.ts` - Invite operations

**Estimated Effort:** 6-8 hours

**Implementation Steps:**
1. Create commands/queries for members and invites:
   - `AddMemberCommand`, `RemoveMemberCommand`, `UpdateMemberRoleCommand`
   - `ListMembersQuery`, `GetMemberQuery`
   - `CreateInviteCommand`, `AcceptInviteCommand`, `DeclineInviteCommand`
   - `ListInvitesQuery`, `GetInviteQuery`

2. Create handlers (6-8 handlers)

3. Extend `OrganizationsApiController` or create new controllers:
   - `OrganizationMembersApiController`
   - `OrganizationInvitesApiController`

4. Migrate API routes

5. Update DI container

**Dependencies:**
- Existing Organization entity and repository
- Member management logic
- Invite token generation/validation

---

#### 2.2 Scheduled Reports Sub-Routes (7 routes)

**Location:** `app/api/scheduled-reports/`

**Existing Infrastructure:**
- ✅ Report domain entity
- ✅ ScheduledReport domain entity (may need verification)

**Routes to Migrate:**
1. `route.ts` - List/create scheduled reports
2. `[id]/route.ts` - Get/update/delete scheduled report
3. `[id]/execute/route.ts` - Execute scheduled report immediately
4. `[id]/cancel/route.ts` - Cancel scheduled execution
5. `[id]/activate/route.ts` - Activate scheduled report
6. `[id]/runs/route.ts` - List execution history
7. `stats/route.ts` - Get statistics

**Estimated Effort:** 8-10 hours

**Implementation Steps:**
1. Verify ScheduledReport domain entity exists

2. Create commands/queries:
   - `CreateScheduledReportCommand`, `UpdateScheduledReportCommand`
   - `DeleteScheduledReportCommand`, `ExecuteReportCommand`
   - `CancelExecutionCommand`, `ActivateReportCommand`
   - `GetExecutionHistoryQuery`, `GetStatsQuery`

3. Create handlers (8-10 handlers)

4. Create `ScheduledReportsApiController`

5. Migrate API routes

6. Update DI container

**Dependencies:**
- Scheduled report scheduler
- Report generation service
- Job queue integration

---

#### 2.3 Export Jobs Sub-Routes (6 routes)

**Location:** `app/api/export-jobs/`

**Existing Infrastructure:**
- ✅ Report export functionality

**Routes to Migrate:**
1. `route.ts` - List/create export jobs
2. `[id]/route.ts` - Get export job status
3. `[id]/download/route.ts` - Download exported file
4. `[id]/cancel/route.ts` - Cancel export job
5. `[id]/retry/route.ts` - Retry failed export
6. `bulk-delete/route.ts` - Bulk delete jobs

**Estimated Effort:** 6-8 hours

**Implementation Steps:**
1. Create ExportJob domain entity if not exists

2. Create repository if not exists

3. Create commands/queries:
   - `CreateExportJobCommand`, `GetExportJobQuery`, `ListExportJobsQuery`
   - `DownloadExportCommand`, `CancelExportCommand`, `RetryExportCommand`
   - `BulkDeleteExportsCommand`

4. Create handlers (6-8 handlers)

5. Create `ExportJobsApiController`

6. Migrate API routes

7. Update DI container

**Dependencies:**
- File storage service
- Export processing service
- Background job queue

---

#### 2.4 Notifications Sub-Routes (3 routes)

**Location:** `app/api/notifications/`

**Existing Infrastructure:**
- ✅ Notification domain entity
- ✅ Notification handlers

**Routes to Migrate:**
1. `from-template/route.ts` - Create notification from template
2. `bulk/route.ts` - Bulk notification operations
3. `schedule/route.ts` - Schedule notifications

**Estimated Effort:** 4-6 hours

**Implementation Steps:**
1. Create commands:
   - `CreateFromTemplateCommand`, `BulkCreateCommand`, `ScheduleNotificationCommand`

2. Create handlers (3-4 handlers)

3. Extend `NotificationsApiController`

4. Migrate API routes

5. Update DI container

**Dependencies:**
- Notification templates
- Bulk sending logic
- Scheduling service

---

#### 2.5 Audit Sub-Routes (5 routes)

**Location:** `app/api/audit/`

**Existing Infrastructure:**
- ✅ AuditLog domain entity
- ✅ AuditLog handlers

**Routes to Migrate:**
1. `route.ts` - List audit logs
2. `export/route.ts` - Export audit logs
3. `stats/route.ts` - Get audit statistics
4. `compliance/route.ts` - Get compliance report
5. `maintenance/route.ts` - Maintenance operations

**Estimated Effort:** 6-8 hours

**Implementation Steps:**
1. Create queries/commands:
   - `ListAuditLogsQuery`, `ExportAuditLogsCommand`
   - `GetAuditStatsQuery`, `GetComplianceReportQuery`
   - `RunMaintenanceCommand`

2. Create handlers (5-6 handlers)

3. Extend `AuditApiController` or create `AuditExtendedApiController`

4. Migrate API routes

5. Update DI container

**Dependencies:**
- Audit log aggregation service
- Export service
- Compliance checking logic

---

### Category C: Lower Priority Routes

These routes are lower priority or may not need migration depending on requirements.

#### 3.1 Security Routes (10 routes)

**Location:** `app/api/security/`, `app/api/security-extended/`

**Routes:**
- `security/metrics/route.ts`
- `security/audit/route.ts`
- `security/events/route.ts`
- `security-extended/mfa/*.ts` (5 routes)
- `security-extended/roles/*.ts` (3 routes)
- `security-extended/encryption/*.ts` (2 routes)
- `security-extended/audit/*.ts` (2 routes)
- `security-extended/monitoring/*.ts` (2 routes)

**Estimated Effort:** 20-24 hours

**Note:** These may be part of a separate security module. Evaluate if migration is needed.

---

#### 3.2 Billing/Subscription Routes (5 routes)

**Location:** `app/api/`

**Routes:**
- `subscription/route.ts`
- `subscription/billing-portal/route.ts`
- `usage/route.ts`
- `usage/update/route.ts`
- `webhooks/stripe/route.ts`

**Estimated Effort:** 8-12 hours

**Note:** These integrate with external billing providers (Stripe). May require special handling.

---

#### 3.3 Email Routes (3 routes)

**Location:** `app/api/email/`

**Routes:**
- `route.ts` - Send email
- `send/route.ts` - Send with template
- `test/route.ts` - Test email configuration

**Estimated Effort:** 4-6 hours

---

#### 3.4 Integration Routes (8 routes)

**Location:** `app/api/integrations/`

**Routes:**
- `[id]/test/route.ts` - Test integration
- `[id]/sync/route.ts` - Sync integration
- `[id]/connect/route.ts` - Connect OAuth
- `oauth/callback/route.ts` - OAuth callback
- `webhooks/[id]/test/route.ts` - Test webhook
- `webhooks/[id]/stats/route.ts` - Webhook stats
- `webhooks/[id]/process/route.ts` - Process webhook

**Estimated Effort:** 10-12 hours

---

#### 3.5 Monitoring Routes (2 routes)

**Location:** `app/api/monitoring/`

**Routes:**
- `health/route.ts` - Health check
- Additional monitoring endpoints

**Estimated Effort:** 2-4 hours

**Note:** Health checks may not need migration. Keep as-is.

---

## Part 2: Service Layer Migrations (27 files)

### High Priority Services (P1)

#### 2.1 Analytics Service
**File:** `lib/services/analytics-service.ts`

**Current Responsibilities:**
- Metrics calculation
- Query execution
- Dashboard data aggregation

**Migration Strategy:**
- Move business logic to domain entities
- Create use cases for complex operations
- Keep service as facade if needed

**Estimated Effort:** 6-8 hours

---

#### 2.2 Workflow Services (6 files)
**Files:**
- `lib/services/workflow/core.ts`
- `lib/services/workflow/execution.ts`
- `lib/services/workflow/processors.ts`
- `lib/services/workflow/tasks.ts`
- `lib/services/workflow/templates.ts`
- `lib/services/workflow/index.ts`

**Current Responsibilities:**
- Workflow execution engine
- Task processing
- Template management

**Migration Strategy:**
- Extract execution engine to application layer
- Create WorkflowExecutionService in infrastructure
- Move template logic to domain

**Estimated Effort:** 16-20 hours

---

#### 2.3 Report Services (3 files)
**Files:**
- `lib/services/report-service.ts`
- `lib/services/report-templates-service.ts`
- `lib/services/template-service.ts`

**Migration Strategy:**
- Refactor to use repositories
- Extract generation logic to use cases

**Estimated Effort:** 8-10 hours

---

#### 2.4 Notification Services
**Files:**
- `lib/services/notification-service.ts`
- `lib/services/email-service.ts`

**Migration Strategy:**
- Already partially migrated
- Complete migration of email service

**Estimated Effort:** 4-6 hours

---

#### 2.5 Export Services (2 files)
**Files:**
- `lib/services/export-service.ts`
- `lib/services/export-processor.ts`

**Migration Strategy:**
- Create ExportJob domain
- Move processing logic to background jobs

**Estimated Effort:** 6-8 hours

---

#### 2.6 Audit Services
**Files:**
- `lib/services/audit.ts`
- `lib/services/compliance.ts`

**Migration Strategy:**
- Refactor to use repositories
- Move compliance logic to domain

**Estimated Effort:** 4-6 hours

---

### Medium Priority Services (P2)

#### 2.7 Scheduled Reports Services (2 files)
**Files:**
- `lib/services/scheduled-reports.ts`
- `lib/services/scheduled-reports-service.ts`

**Estimated Effort:** 4-6 hours

---

#### 2.8 Usage Tracking Services (2 files)
**Files:**
- `lib/services/usage-tracking.ts`
- `lib/services/usage-tracking-service.ts`
- `lib/services/scheduled-usage-jobs.ts`

**Estimated Effort:** 4-6 hours

---

#### 2.9 Organization Service
**File:** `lib/services/organization-service.ts`

**Estimated Effort:** 2-4 hours

---

#### 2.10 File Storage Service
**File:** `lib/services/file-storage-service.ts`

**Estimated Effort:** 2-4 hours

---

#### 2.11 Queue Services (2 files)
**Files:**
- `lib/services/queue-service.ts`
- `lib/services/queue/index.ts`

**Note:** Already integrated with background jobs slice. May not need migration.

**Estimated Effort:** 2-4 hours

---

### Lower Priority Services (P3)

#### 2.12 Security Service
**File:** `lib/services/security-service.ts`

**Note:** May be part of security module. Evaluate separately.

**Estimated Effort:** 4-6 hours

---

## Part 3: Utility Reorganization (P2)

### Files to Reorganize

**Location:** `lib/`

**Files:**
- `api-utils.ts`
- `auth-helpers.ts`
- `error-utils.ts`
- `export-utils.ts`
- Other utility files

**Strategy:**
1. Move to appropriate slice infrastructure layers
2. Consolidate duplicate utilities
3. Create shared utilities in `src/shared/infrastructure/utils/`

**Estimated Effort:** 8-12 hours

---

## Implementation Priority

### Sprint 1: Critical Domain Modeling (40-56 hours)
1. ✅ Workflow Sub-Routes (16-24 hours)
2. ✅ Integration Sub-Routes (12-16 hours)
3. ✅ Analytics Sub-Routes (12-16 hours)

**Deliverables:**
- All complex sub-routes with full domain modeling
- New domain entities, repositories, handlers, controllers
- Complete test coverage for new domain models

---

### Sprint 2: Medium Complexity Routes (30-48 hours)
1. ✅ Organization Sub-Routes (6-8 hours)
2. ✅ Scheduled Reports Sub-Routes (8-10 hours)
3. ✅ Export Jobs Sub-Routes (6-8 hours)
4. ✅ Notifications Sub-Routes (4-6 hours)
5. ✅ Audit Sub-Routes (6-8 hours)

**Deliverables:**
- All medium complexity routes migrated
- Extended existing Clean Architecture components
- Updated documentation

---

### Sprint 3: Service Layer Refactoring (52-72 hours)
1. ✅ Workflow Services (16-20 hours)
2. ✅ Analytics Service (6-8 hours)
3. ✅ Report Services (8-10 hours)
4. ✅ Notification/Email Services (4-6 hours)
5. ✅ Export Services (6-8 hours)
6. ✅ Audit Services (4-6 hours)
7. ✅ Other Services (8-14 hours)

**Deliverables:**
- All service files refactored to Clean Architecture
- Business logic in domain/application layers
- Services reduced to facades or removed

---

### Sprint 4: Lower Priority & Cleanup (44-64 hours)
1. ✅ Security Routes (20-24 hours)
2. ✅ Billing/Subscription Routes (8-12 hours)
3. ✅ Email Routes (4-6 hours)
4. ✅ Integration Routes (10-12 hours)
5. ✅ Utility Reorganization (8-12 hours)

**Deliverables:**
- All remaining routes migrated
- Utilities reorganized
- Final cleanup and documentation

---

## Total Estimated Effort

**Total: 166-240 hours (4-6 weeks with 1 developer)**

**Breakdown:**
- Sprint 1: 40-56 hours
- Sprint 2: 30-48 hours
- Sprint 3: 52-72 hours
- Sprint 4: 44-64 hours

**With 2 developers:** 2-3 weeks
**With 3 developers:** 1.5-2 weeks

---

## Migration Checklist

### For Each Route Migration

- [ ] Identify existing domain entities
- [ ] Create new domain entities if needed
- [ ] Create repository interfaces
- [ ] Implement Prisma repositories
- [ ] Create commands and queries
- [ ] Create handlers
- [ ] Create/update controllers
- [ ] Migrate API routes
- [ ] Update DI container
- [ ] Write tests
- [ ] Update documentation
- [ ] Verify build
- [ ] Manual testing

### For Each Service Migration

- [ ] Identify business logic
- [ ] Extract to domain/application layer
- [ ] Create use cases if needed
- [ ] Update service to use repositories
- [ ] Update all callers
- [ ] Write tests
- [ ] Update documentation
- [ ] Remove/refactor service if possible

---

## Testing Strategy

### Unit Tests
- Domain entities (business rules)
- Repository implementations (data mapping)
- Handlers (command/query execution)
- Use cases (application logic)

### Integration Tests
- API endpoints (HTTP requests/responses)
- Database operations (Prisma)
- External service integrations

### E2E Tests
- Critical user flows
- Multi-step operations
- Error scenarios

---

## Risks and Mitigations

### Risk 1: Scope Creep
**Mitigation:** Strict adherence to plan, prioritize ruthlessly

### Risk 2: Breaking Changes
**Mitigation:** Comprehensive test coverage, feature flags

### Risk 3: Performance Degradation
**Mitigation:** Performance benchmarks, optimize after migration

### Risk 4: Domain Model Mismatch
**Mitigation:** Review Prisma schema carefully before modeling

### Risk 5: External Dependencies
**Mitigation:** Create integration abstractions, mock for testing

---

## Success Criteria

- [ ] All P0 API routes migrated to Clean Architecture
- [ ] All P1 service files refactored
- [ ] Zero direct Prisma calls in API routes
- [ ] Zero direct service calls in API routes
- [ ] All code follows Clean Architecture principles
- [ ] Test coverage > 80% for new code
- [ ] Documentation complete and up-to-date
- [ ] Build passes without errors
- [ ] No performance regression

---

## Next Steps

1. **Review and approve this plan** with stakeholders
2. **Set up sprint schedule** with developer(s)
3. **Create detailed task breakdown** for Sprint 1
4. **Set up CI/CD improvements** for faster feedback
5. **Begin Sprint 1: Workflow Sub-Routes**

---

## Appendix

### A. Migration Progress Tracking

Current status: 93% complete (Phase 6: 55%)

Updated after each sprint completion.

### B. Reference Documents

- [Clean Architecture Migration Plan](../architecture/clean-architecture-migration-plan.md)
- [Migration Progress Document](../migration/migration-progress.md)
- [Architecture Decision Records](../architecture/adr-001-di-container-standardization.md)

### C. Key Contacts

- Tech Lead: [Contact]
- Architect: [Contact]
- Project Manager: [Contact]

---

**Document Status:** Ready for Review
**Next Review Date:** After Sprint 1 Completion
**Change Log:**
- 2026-01-14: Initial document creation
