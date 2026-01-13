# Integrations Slice - Clean Architecture Integration Guide

## Overview

The Integrations slice has been migrated to Clean Architecture following the same pattern as other Phase 3 slices (Analytics, Workflows). This document provides guidance on how to integrate the new Clean Architecture implementation with the existing codebase.

## Architecture Overview

### Layer Structure

```
src/slices/integrations/
├── domain/
│   ├── value-objects/
│   │   └── integration-id.ts
│   ├── entities/
│   │   └── integration.ts
│   └── repositories/
│       └── integration-repository.ts
├── application/
│   ├── commands/
│   │   ├── create-integration-command.ts
│   │   ├── update-integration-command.ts
│   │   └── delete-integration-command.ts
│   ├── queries/
│   │   ├── get-integration-query.ts
│   │   └── get-integrations-query.ts
│   ├── dtos/
│   │   └── integration-dto.ts
│   ├── handlers/
│   │   ├── create-integration-handler.ts
│   │   ├── update-integration-handler.ts
│   │   ├── delete-integration-handler.ts
│   │   ├── get-integration-handler.ts
│   │   └── get-integrations-handler.ts
│   └── use-cases/
│       ├── create-integration-use-case.ts
│       ├── update-integration-use-case.ts
│       ├── delete-integration-use-case.ts
│       ├── get-integration-use-case.ts
│       └── get-integrations-use-case.ts
├── infrastructure/
│   ├── repositories/
│   │   └── prisma-integration-repository.ts
│   └── di/
│       └── integrations-container.ts
└── presentation/
    └── api/
        ├── create-integration-api-route.ts
        ├── update-integration-api-route.ts
        ├── delete-integration-api-route.ts
        ├── get-integration-api-route.ts
        └── get-integrations-api-route.ts
```

## Domain Layer

### Value Objects

#### IntegrationId

```typescript
import { IntegrationId } from '@/slices/integrations/domain/value-objects/integration-id';

// Create a new Integration ID
const integrationId = IntegrationId.create();

// Create from existing value
const existingId = IntegrationId.fromValue('existing-id');
```

### Entities

#### Integration

The `Integration` aggregate root represents an integration with the following properties:

- `id: IntegrationId` - Unique identifier
- `name: string` - Integration name
- `type: string` - Integration type
- `provider: string` - Integration provider
- `config: Record<string, unknown>` - Integration configuration
- `organizationId: UniqueId` - Organization ID
- `status: IntegrationStatus` - Integration status (PENDING, IN_PROGRESS, COMPLETED, FAILED)
- `lastSync: Date | null` - Last sync timestamp
- `lastError: string | null` - Last error message
- `category: string | null` - Integration category
- `description: string | null` - Integration description
- `settings: Record<string, unknown> | null` - Integration settings
- `isEnabled: boolean` - Integration enabled flag
- `createdAt: Date | null` - Created at timestamp
- `updatedAt: Date | null` - Updated at timestamp
- `createdBy: UniqueId | null` - Created by user ID

**Business Methods:**

```typescript
// Update integration configuration
integration.updateConfig(newConfig);

// Mark as completed
integration.markAsCompleted();

// Mark as failed
integration.markAsFailed('Error message');

// Update last sync
integration.updateLastSync();

// Check status
integration.isPending();
integration.isInProgress();
integration.isCompleted();
integration.isFailed();

// Get config as object
const config = integration.getConfigAsObject();
```

**Domain Events:**

- `IntegrationCreatedEvent` - Emitted when integration is created
- `IntegrationConfigUpdatedEvent` - Emitted when integration config is updated
- `IntegrationCompletedEvent` - Emitted when integration is marked as completed
- `IntegrationFailedEvent` - Emitted when integration is marked as failed

### Repositories

#### IIntegrationRepository

```typescript
interface IIntegrationRepository {
  save(integration: Integration): Promise<void>;
  findById(id: UniqueId): Promise<Integration | null>;
  findByOrganizationId(organizationId: UniqueId): Promise<Integration[]>;
  findByType(type: string): Promise<Integration[]>;
  findByProvider(provider: string): Promise<Integration[]>;
  findByStatus(status: IntegrationStatus): Promise<Integration[]>;
  findAll(limit?: number, offset?: number, filters?: IntegrationFilters): Promise<Integration[]>;
  count(filters?: IntegrationFilters): Promise<number>;
  delete(id: UniqueId): Promise<void>;
  exists(id: UniqueId): Promise<boolean>;
  findByName(organizationId: UniqueId, name: string): Promise<Integration | null>;
}
```

## Application Layer

### Commands

#### CreateIntegrationCommand

```typescript
import { CreateIntegrationCommand } from '@/slices/integrations/application/commands/create-integration-command';

const command = new CreateIntegrationCommand({
  name: 'My Integration',
  type: 'analytics',
  provider: 'google',
  config: { apiKey: 'xxx' },
  organizationId: 'org-id',
  category: 'data',
  description: 'Integration description',
  settings: { enabled: true },
  isEnabled: true,
  createdBy: 'user-id',
});
```

#### UpdateIntegrationCommand

```typescript
import { UpdateIntegrationCommand } from '@/slices/integrations/application/commands/update-integration-command';

const command = new UpdateIntegrationCommand({
  integrationId: 'integration-id',
  name: 'Updated Integration',
  config: { apiKey: 'yyy' },
  category: 'data',
  description: 'Updated description',
  settings: { enabled: false },
  isEnabled: false,
});
```

#### DeleteIntegrationCommand

```typescript
import { DeleteIntegrationCommand } from '@/slices/integrations/application/commands/delete-integration-command';

const command = new DeleteIntegrationCommand({
  integrationId: 'integration-id',
});
```

### Queries

#### GetIntegrationQuery

```typescript
import { GetIntegrationQuery } from '@/slices/integrations/application/queries/get-integration-query';

const query = new GetIntegrationQuery({
  integrationId: 'integration-id',
  userId: 'user-id',
});
```

#### GetIntegrationsQuery

```typescript
import { GetIntegrationsQuery } from '@/slices/integrations/application/queries/get-integrations-query';

const query = new GetIntegrationsQuery({
  organizationId: 'org-id',
  limit: 50,
  offset: 0,
  type: 'analytics',
  provider: 'google',
  status: 'COMPLETED',
});
```

### DTOs

#### IntegrationDto

```typescript
import { IntegrationDto } from '@/slices/integrations/application/dtos/integration-dto';

const dto = IntegrationDto.fromDomain(integration);
const plainObject = dto.toObject();
```

### Use Cases

#### CreateIntegrationUseCase

```typescript
import { CreateIntegrationUseCase } from '@/slices/integrations/application/use-cases/create-integration-use-case';

const useCase = container.get<CreateIntegrationUseCase>(TYPES.CreateIntegrationUseCase);
const result = await useCase.execute(command);

if (result.isSuccess) {
  const integration = result.getValue();
} else {
  const error = result.getError();
}
```

#### UpdateIntegrationUseCase

```typescript
import { UpdateIntegrationUseCase } from '@/slices/integrations/application/use-cases/update-integration-use-case';

const useCase = container.get<UpdateIntegrationUseCase>(TYPES.UpdateIntegrationUseCase);
const result = await useCase.execute(command);
```

#### DeleteIntegrationUseCase

```typescript
import { DeleteIntegrationUseCase } from '@/slices/integrations/application/use-cases/delete-integration-use-case';

const useCase = container.get<DeleteIntegrationUseCase>(TYPES.DeleteIntegrationUseCase);
const result = await useCase.execute(command);
```

#### GetIntegrationUseCase

```typescript
import { GetIntegrationUseCase } from '@/slices/integrations/application/use-cases/get-integration-use-case';

const useCase = container.get<GetIntegrationUseCase>(TYPES.GetIntegrationUseCase);
const result = await useCase.execute(query);

if (result.isSuccess) {
  const integration = result.getValue();
} else {
  const error = result.getError();
}
```

#### GetIntegrationsUseCase

```typescript
import { GetIntegrationsUseCase } from '@/slices/integrations/application/use-cases/get-integrations-use-case';

const useCase = container.get<GetIntegrationsUseCase>(TYPES.GetIntegrationsUseCase);
const result = await useCase.execute(query);

if (result.isSuccess) {
  const integrations = result.getValue();
  const total = result.getTotal();
} else {
  const error = result.getError();
}
```

## Infrastructure Layer

### PrismaIntegrationRepository

The `PrismaIntegrationRepository` implements `IIntegrationRepository` using Prisma ORM.

**Key Implementation Details:**

- Uses `upsert` in `save()` method for both create and update operations
- Handles Date conversions for `createdAt` and `updatedAt` fields
- Maps Prisma `lastSync` field to domain entity's `lastSync` property
- Supports filtering by `organizationId`, `type`, `provider`, and `status`
- Implements pagination with `limit` and `offset` parameters

**Usage:**

```typescript
import { PrismaIntegrationRepository } from '@/slices/integrations/infrastructure/repositories/prisma-integration-repository';

const repository = new PrismaIntegrationRepository(prismaClient);
await repository.save(integration);
```

## Presentation Layer

### API Routes

The integrations slice uses Next.js API routes instead of traditional controllers.

#### Create Integration API Route

**Endpoint:** `POST /api/integrations`

**Request Body:**
```json
{
  "name": "My Integration",
  "type": "analytics",
  "provider": "google",
  "config": { "apiKey": "xxx" },
  "organizationId": "org-id",
  "category": "data",
  "description": "Integration description",
  "settings": { "enabled": true },
  "isEnabled": true
}
```

**Headers:**
- `x-user-id` - User ID (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "integration-id",
    "name": "My Integration",
    "type": "analytics",
    "provider": "google",
    "config": { "apiKey": "xxx" },
    "organizationId": "org-id",
    "status": "PENDING",
    "category": "data",
    "description": "Integration description",
    "settings": { "enabled": true },
    "isEnabled": true,
    "createdAt": "2024-01-10T00:00:00.000Z",
    "updatedAt": null,
    "createdBy": "user-id"
  }
}
```

#### Update Integration API Route

**Endpoint:** `PUT /api/integrations/[id]`

**Request Body:**
```json
{
  "name": "Updated Integration",
  "config": { "apiKey": "yyy" },
  "category": "data",
  "description": "Updated description",
  "settings": { "enabled": false },
  "isEnabled": false
}
```

**Headers:**
- `x-user-id` - User ID (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "integration-id",
    "name": "Updated Integration",
    "type": "analytics",
    "provider": "google",
    "config": { "apiKey": "yyy" },
    "organizationId": "org-id",
    "status": "PENDING",
    "category": "data",
    "description": "Updated description",
    "settings": { "enabled": false },
    "isEnabled": false,
    "createdAt": "2024-01-10T00:00:00.000Z",
    "updatedAt": "2024-01-10T01:00:00.000Z",
    "createdBy": "user-id"
  }
}
```

#### Delete Integration API Route

**Endpoint:** `DELETE /api/integrations/[id]`

**Headers:**
- `x-user-id` - User ID (required)

**Response:**
```json
{
  "success": true,
  "message": "Integration deleted successfully"
}
```

#### Get Integration API Route

**Endpoint:** `GET /api/integrations/[id]`

**Headers:**
- `x-user-id` - User ID (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "integration-id",
    "name": "My Integration",
    "type": "analytics",
    "provider": "google",
    "config": { "apiKey": "xxx" },
    "organizationId": "org-id",
    "status": "COMPLETED",
    "lastSync": "2024-01-10T02:00:00.000Z",
    "lastError": null,
    "category": "data",
    "description": "Integration description",
    "settings": { "enabled": true },
    "isEnabled": true,
    "createdAt": "2024-01-10T00:00:00.000Z",
    "updatedAt": "2024-01-10T01:00:00.000Z",
    "createdBy": "user-id"
  }
}
```

#### Get Integrations API Route

**Endpoint:** `GET /api/integrations`

**Query Parameters:**
- `organizationId` - Organization ID (required)
- `limit` - Number of results to return (default: 50, max: 100)
- `offset` - Number of results to skip (default: 0)
- `type` - Filter by integration type
- `provider` - Filter by provider
- `status` - Filter by status (PENDING, IN_PROGRESS, COMPLETED, FAILED)

**Headers:**
- `x-user-id` - User ID (required)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "integration-id-1",
      "name": "My Integration",
      "type": "analytics",
      "provider": "google",
      "config": { "apiKey": "xxx" },
      "organizationId": "org-id",
      "status": "COMPLETED",
      "lastSync": "2024-01-10T02:00:00.000Z",
      "lastError": null,
      "category": "data",
      "description": "Integration description",
      "settings": { "enabled": true },
      "isEnabled": true,
      "createdAt": "2024-01-10T00:00:00.000Z",
      "updatedAt": "2024-01-10T01:00:00.000Z",
      "createdBy": "user-id"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

## Dependency Injection

The integrations slice uses the InversifyJS container for dependency injection.

### DI Types

```typescript
import { TYPES } from '@/shared/infrastructure/di/types';

// Repository
TYPES.IntegrationRepository

// Handlers
TYPES.CreateIntegrationHandler
TYPES.UpdateIntegrationHandler
TYPES.DeleteIntegrationHandler
TYPES.GetIntegrationHandler
TYPES.GetIntegrationsHandler

// Use Cases
TYPES.CreateIntegrationUseCase
TYPES.UpdateIntegrationUseCase
TYPES.DeleteIntegrationUseCase
TYPES.GetIntegrationUseCase
TYPES.GetIntegrationsUseCase
```

### Container Configuration

The integrations slice is automatically configured in the DI container:

```typescript
import { configureIntegrationsContainer } from '@/slices/integrations/infrastructure/di/integrations-container';

// Automatically called in src/shared/infrastructure/di/container.ts
configureIntegrationsContainer(container);
```

## Migration from Old Code

### Step 1: Update Imports

Replace old imports with new Clean Architecture imports:

```typescript
// Old
import { IntegrationService } from '@/lib/services/integration-service';

// New
import { CreateIntegrationUseCase } from '@/slices/integrations/application/use-cases/create-integration-use-case';
import { UpdateIntegrationUseCase } from '@/slices/integrations/application/use-cases/update-integration-use-case';
import { DeleteIntegrationUseCase } from '@/slices/integrations/application/use-cases/delete-integration-use-case';
import { GetIntegrationUseCase } from '@/slices/integrations/application/use-cases/get-integration-use-case';
import { GetIntegrationsUseCase } from '@/slices/integrations/application/use-cases/get-integrations-use-case';
```

### Step 2: Replace Service Calls with Use Cases

```typescript
// Old
const integration = await integrationService.createIntegration(data);

// New
const command = new CreateIntegrationCommand(data);
const result = await createIntegrationUseCase.execute(command);
if (result.isSuccess) {
  const integration = result.getValue();
}
```

### Step 3: Update API Routes

Replace old API routes with new Clean Architecture API routes:

```typescript
// Old
// app/api/integrations/route.ts

// New
import { createIntegrationApiRoute } from '@/slices/integrations/presentation/api/create-integration-api-route';
import { getIntegrationsApiRoute } from '@/slices/integrations/presentation/api/get-integrations-api-route';

export const POST = createIntegrationApiRoute;
export const GET = getIntegrationsApiRoute;
```

## Testing

### Unit Tests

```typescript
import { CreateIntegrationUseCase } from '@/slices/integrations/application/use-cases/create-integration-use-case';
import { IIntegrationRepository } from '@/slices/integrations/domain/repositories/integration-repository';

// Mock repository
const mockRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  // ...
} as unknown as IIntegrationRepository;

// Create use case
const useCase = new CreateIntegrationUseCase(mockRepository);

// Test
const command = new CreateIntegrationCommand({
  name: 'Test Integration',
  type: 'analytics',
  provider: 'google',
  config: {},
  organizationId: 'org-id',
});

const result = await useCase.execute(command);
expect(result.isSuccess).toBe(true);
```

### Integration Tests

```typescript
import { container } from '@/shared/infrastructure/di/container';
import { CreateIntegrationUseCase } from '@/slices/integrations/application/use-cases/create-integration-use-case';

const useCase = container.get<CreateIntegrationUseCase>(TYPES.CreateIntegrationUseCase);
const command = new CreateIntegrationCommand({
  name: 'Test Integration',
  type: 'analytics',
  provider: 'google',
  config: {},
  organizationId: 'org-id',
});

const result = await useCase.execute(command);
expect(result.isSuccess).toBe(true);
```

## Common Patterns

### Error Handling

All use cases return a `Result<T>` object:

```typescript
const result = await useCase.execute(command);

if (result.isSuccess) {
  const value = result.getValue();
} else {
  const error = result.getError();
  // Handle error
}
```

### Pagination

Use `GetIntegrationsQuery` for paginated results:

```typescript
const query = new GetIntegrationsQuery({
  organizationId: 'org-id',
  limit: 50,
  offset: 0,
});

const result = await useCase.execute(query);

if (result.isSuccess) {
  const integrations = result.getValue();
  const total = result.getTotal();
  const limit = result.getLimit();
  const offset = result.getOffset();
}
```

### Filtering

Use filters in `GetIntegrationsQuery`:

```typescript
const query = new GetIntegrationsQuery({
  organizationId: 'org-id',
  type: 'analytics',
  provider: 'google',
  status: 'COMPLETED',
});
```

## Troubleshooting

### Common Issues

1. **Integration Not Found**
   - Check that the integration ID is valid
   - Verify the integration exists in the database

2. **Permission Denied**
   - Check that the user has access to the organization
   - Verify the user ID is provided in the request headers

3. **Validation Errors**
   - Check that required fields are provided
   - Verify that field values are valid

4. **Database Errors**
   - Check that the database connection is working
   - Verify that the Prisma schema is up to date

## Next Steps

1. **Complete Migration**: Replace all old integration-related code with new Clean Architecture code
2. **Add Tests**: Write unit and integration tests for the integrations slice
3. **Update Documentation**: Update API documentation with new endpoints
4. **Monitor Performance**: Monitor the performance of the new implementation
5. **Gather Feedback**: Gather feedback from users and stakeholders

## Additional Resources

- [Clean Architecture Migration Plan](./clean-architecture-migration-plan.md)
- [Phase 3 Business Features](./phase3-business-features.md)
- [Integration Guide](./phase3-integration-guide.md)
- [Workflows Slice Integration](./phase3-workflows-integration.md)
