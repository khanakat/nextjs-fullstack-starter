# Phase 3 Business Features - Integration Guide

## Overview

This guide provides integration instructions for the Phase 3 business features slices implemented in Clean Architecture:

- **Analytics Slice** - Dashboard management
- **Workflows Slice** - Workflow automation (pending)
- **Integrations Slice** - Third-party integrations (pending)
- **Reports Slice** - Report generation and management (pending)

## Analytics Slice Integration

### Slice Structure

```
src/slices/analytics/
├── domain/
│   ├── value-objects/
│   │   └── dashboard-id.ts
│   ├── entities/
│   │   └── dashboard.ts
│   └── repositories/
│       └── dashboard-repository.ts
├── application/
│   ├── commands/
│   │   ├── create-dashboard-command.ts
│   │   ├── update-dashboard-command.ts
│   │   └── delete-dashboard-command.ts
│   ├── queries/
│   │   ├── get-dashboard-query.ts
│   │   └── get-dashboards-query.ts
│   ├── dtos/
│   │   └── dashboard-dto.ts
│   ├── handlers/
│   │   ├── create-dashboard-handler.ts
│   │   ├── update-dashboard-handler.ts
│   │   ├── delete-dashboard-handler.ts
│   │   ├── get-dashboard-handler.ts
│   │   └── get-dashboards-handler.ts
│   ├── use-cases/
│   │   ├── create-dashboard-use-case.ts
│   │   ├── update-dashboard-use-case.ts
│   │   ├── delete-dashboard-use-case.ts
│   │   ├── get-dashboard-use-case.ts
│   │   └── get-dashboards-use-case.ts
│   └── index.ts
├── infrastructure/
│   ├── repositories/
│   │   └── prisma-dashboard-repository.ts
│   ├── di/
│   │   └── analytics-container.ts
│   └── index.ts
├── presentation/
│   ├── api/
│   │   ├── create-dashboard-api-route.ts
│   │   ├── get-dashboard-api-route.ts
│   │   ├── get-dashboards-api-route.ts
│   │   ├── update-dashboard-api-route.ts
│   │   └── delete-dashboard-api-route.ts
│   └── index.ts
└── index.ts
```

### API Routes

| Route | Method | Handler | Description |
|-------|--------|----------|-------------|
| `/api/analytics/dashboards` | POST | CreateDashboardHandler | Create a new dashboard |
| `/api/analytics/dashboards/[id]` | GET | GetDashboardHandler | Get dashboard by ID |
| `/api/analytics/dashboards` | GET | GetDashboardsHandler | Get all dashboards with filters |
| `/api/analytics/dashboards/[id]` | PUT | UpdateDashboardHandler | Update dashboard |
| `/api/analytics/dashboards/[id]` | DELETE | DeleteDashboardHandler | Delete dashboard |

### Usage Example

#### Create Dashboard

```typescript
import { CreateDashboardCommand } from '@/slices/analytics/application/commands/create-dashboard-command';
import { CreateDashboardUseCase } from '@/slices/analytics/application/use-cases/create-dashboard-use-case';
import { container } from '@/shared/infrastructure/di/container';

const useCase = container.get<CreateDashboardUseCase>(TYPES.CreateDashboardUseCase);
const command = new CreateDashboardCommand(
  {
    name: 'My Dashboard',
    description: 'Analytics dashboard for sales data',
    layout: '{}',
    settings: '{}',
    isPublic: false,
    isTemplate: false,
    tags: 'sales,analytics',
    organizationId: 'org-123',
    createdBy: 'user-456',
  },
  'user-456'
);

const result = await useCase.execute(command);

if (result.isSuccess) {
  console.log('Dashboard created:', result.value);
} else {
  console.error('Error:', result.error);
}
```

#### Get Dashboards with Filters

```typescript
import { GetDashboardsQuery } from '@/slices/analytics/application/queries/get-dashboards-query';
import { GetDashboardsUseCase } from '@/slices/analytics/application/use-cases/get-dashboards-use-case';
import { DashboardStatus } from '@/slices/analytics/domain/entities/dashboard';
import { container } from '@/shared/infrastructure/di/container';

const useCase = container.get<GetDashboardsUseCase>(TYPES.GetDashboardsUseCase);
const query = new GetDashboardsQuery({
  organizationId: 'org-123',
  status: DashboardStatus.ACTIVE,
  isPublic: false,
  page: 1,
  limit: 20,
});

const result = await useCase.execute(query);

if (result.isSuccess) {
  console.log('Dashboards:', result.value);
}
```

### Prisma Schema Notes

The Analytics Dashboard entity uses the `AnalyticsDashboard` Prisma model with the following schema considerations:

- **Status Storage**: The `status` field is stored in the `settings` JSON field, not as a separate column
- **No Slug Field**: The model doesn't have a `slug` field for URL-friendly identifiers
- **Settings JSON**: All dashboard configuration is stored in the `settings` JSON field

### DI Container Configuration

Analytics slice dependencies are registered in `src/shared/infrastructure/di/types.ts`:

```typescript
// Analytics
DashboardRepository: Symbol.for('DashboardRepository'),
CreateDashboardHandler: Symbol.for('CreateDashboardHandler'),
UpdateDashboardHandler: Symbol.for('UpdateDashboardHandler'),
DeleteDashboardHandler: Symbol.for('DeleteDashboardHandler'),
GetDashboardHandler: Symbol.for('GetDashboardHandler'),
GetDashboardsHandler: Symbol.for('GetDashboardsHandler'),
CreateDashboardUseCase: Symbol.for('CreateDashboardUseCase'),
UpdateDashboardUseCase: Symbol.for('UpdateDashboardUseCase'),
DeleteDashboardUseCase: Symbol.for('DeleteDashboardUseCase'),
GetDashboardUseCase: Symbol.for('GetDashboardUseCase'),
GetDashboardsUseCase: Symbol.for('GetDashboardsUseCase'),
DashboardsController: Symbol.for('DashboardsController'),
```

The container is configured in `src/slices/analytics/infrastructure/di/analytics-container.ts` and registered in the main DI container.

## Organizations Slice Integration

### Slice Structure

```
src/slices/organizations/
├── domain/
│   ├── value-objects/
│   │   └── organization-id.ts
│   ├── entities/
│   │   └── organization.ts
│   └── repositories/
│       └── organization-repository.ts
├── application/
│   ├── commands/
│   │   ├── create-organization-command.ts
│   │   ├── update-organization-command.ts
│   │   └── delete-organization-command.ts
│   ├── queries/
│   │   ├── get-organization-query.ts
│   │   └── get-organizations-query.ts
│   ├── dtos/
│   │   └── organization-dto.ts
│   ├── handlers/
│   │   ├── create-organization-handler.ts
│   │   ├── update-organization-handler.ts
│   │   ├── delete-organization-handler.ts
│   │   ├── get-organization-handler.ts
│   │   └── get-organizations-handler.ts
│   ├── use-cases/
│   │   ├── create-organization-use-case.ts
│   │   ├── update-organization-use-case.ts
│   │   ├── delete-organization-use-case.ts
│   │   ├── get-organization-use-case.ts
│   │   └── get-organizations-use-case.ts
│   └── index.ts
├── infrastructure/
│   ├── repositories/
│   │   └── prisma-organization-repository.ts
│   └── index.ts
├── presentation/
│   ├── api/
│   │   └── create-organization-api-route.ts
│   └── index.ts
└── index.ts
```

### API Routes

| Route | Method | Handler | Description |
|-------|--------|----------|-------------|
| `/api/organizations` | POST | CreateOrganizationHandler | Create a new organization |
| `/api/organizations/[id]` | GET | GetOrganizationHandler | Get organization by ID |
| `/api/organizations` | GET | GetOrganizationsHandler | Get all organizations |
| `/api/organizations/[id]` | PUT | UpdateOrganizationHandler | Update organization |
| `/api/organizations/[id]` | DELETE | DeleteOrganizationHandler | Delete organization |

## Auth Slice Integration

### Slice Structure

```
src/slices/auth/
├── domain/
│   ├── value-objects/
│   │   ├── email.ts
│   │   ├── password-hash.ts
│   │   ├── token.ts
│   │   ├── auth-session-id.ts
│   │   └── mfa-code.ts
│   ├── entities/
│   │   ├── user.ts
│   │   ├── session.ts
│   │   ├── mfa-device.ts
│   │   └── auth-token.ts
│   ├── repositories/
│   │   ├── user-repository.ts
│   │   ├── session-repository.ts
│   │   ├── mfa-device-repository.ts
│   │   └── auth-token-repository.ts
│   └── services/
│       ├── auth-service.ts
│       ├── password-service.ts
│       ├── mfa-service.ts
│       └── session-service.ts
├── application/
│   ├── commands/
│   │   ├── register-user-command.ts
│   │   ├── login-command.ts
│   │   ├── logout-command.ts
│   │   ├── change-password-command.ts
│   │   ├── verify-email-command.ts
│   │   ├── request-password-reset-command.ts
│   │   ├── reset-password-command.ts
│   │   ├── enable-mfa-command.ts
│   │   ├── verify-mfa-command.ts
│   │   └── disable-mfa-command.ts
│   ├── queries/
│   │   ├── get-user-query.ts
│   │   ├── get-users-query.ts
│   │   ├── get-current-user-query.ts
│   │   ├── get-sessions-query.ts
│   │   └── get-mfa-devices-query.ts
│   ├── dtos/
│   │   ├── user-dto.ts
│   │   ├── session-dto.ts
│   │   ├── auth-response-dto.ts
│   │   └── mfa-device-dto.ts
│   ├── handlers/
│   │   ├── register-user-handler.ts
│   │   ├── login-user-handler.ts
│   │   ├── get-user-handler.ts
│   │   └── ...
│   ├── use-cases/
│   │   ├── register-user-use-case.ts
│   │   ├── login-user-use-case.ts
│   │   ├── get-user-use-case.ts
│   │   └── ...
│   └── index.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── prisma-user-repository.ts
│   │   ├── nextauth-session-repository.ts
│   │   ├── nextauth-auth-token-repository.ts
│   │   └── prisma-mfa-device-repository.ts
│   ├── services/
│   │   ├── bcrypt-password-service.ts
│   │   ├── totp-mfa-service.ts
│   │   ├── auth-service-impl.ts
│   │   └── nextauth-session-service.ts
│   └── index.ts
├── presentation/
│   ├── api/
│   │   └── register-api-route.ts
│   ├── controllers/
│   │   └── auth-controller.ts
│   └── index.ts
└── index.ts
```

## Testing Guidelines

### Unit Tests

Test each layer independently:

1. **Domain Layer Tests**: Test entities, value objects, and business rules
2. **Application Layer Tests**: Test handlers and use cases with mock repositories
3. **Infrastructure Layer Tests**: Test repositories with test database
4. **Integration Tests**: Test API routes end-to-end

### Example Handler Test

```typescript
import { CreateDashboardHandler } from '@/slices/analytics/application/handlers/create-dashboard-handler';
import { IDashboardRepository } from '@/slices/analytics/domain/repositories/dashboard-repository';
import { CreateDashboardCommand } from '@/slices/analytics/application/commands/create-dashboard-command';

describe('CreateDashboardHandler', () => {
  let handler: CreateDashboardHandler;
  let mockRepository: jest.Mocked<IDashboardRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    handler = new CreateDashboardHandler(mockRepository);
  });

  it('should create a dashboard successfully', async () => {
    const command = new CreateDashboardCommand({
      name: 'Test Dashboard',
      layout: '{}',
      organizationId: 'org-123',
      createdBy: 'user-456',
    });

    const result = await handler.handle(command);

    expect(result.isSuccess).toBe(true);
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

## Migration Checklist

- [x] Analytics slice domain layer
- [x] Analytics slice application layer
- [x] Analytics slice infrastructure layer
- [x] Analytics slice presentation layer
- [x] Analytics slice DI configuration
- [x] Organizations slice domain layer
- [x] Organizations slice application layer
- [x] Organizations slice infrastructure layer
- [x] Organizations slice presentation layer
- [x] Auth slice domain layer
- [x] Auth slice application layer
- [x] Auth slice infrastructure layer
- [x] Auth slice presentation layer
- [ ] Workflows slice
- [ ] Integrations slice
- [ ] Reports slice

## Next Steps

1. Implement Workflows slice following the same pattern
2. Implement Integrations slice following the same pattern
3. Implement Reports slice following the same pattern
4. Update API routes in Next.js app directory
5. Add comprehensive tests for all slices
6. Update main application to use clean architecture slices
