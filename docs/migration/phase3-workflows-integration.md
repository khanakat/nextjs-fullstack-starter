# Workflows Slice Integration Guide

## Overview

This guide explains how to integrate the Workflows slice into your Next.js application using Clean Architecture principles.

## Architecture Overview

The Workflows slice follows Clean Architecture principles with clear separation of concerns:

```
src/slices/workflows/
├── domain/              # Domain layer (business logic, no dependencies)
│   ├── value-objects/
│   │   └── workflow-id.ts
│   └── entities/
│       └── workflow.ts
│   └── repositories/
│       └── workflow-repository.ts
├── application/          # Application layer (use cases, orchestration)
│   ├── commands/
│   │   ├── create-workflow-command.ts
│   │   ├── update-workflow-command.ts
│   │   └── delete-workflow-command.ts
│   ├── queries/
│   │   ├── get-workflow-query.ts
│   │   └── get-workflows-query.ts
│   ├── dtos/
│   │   └── workflow-dto.ts
│   ├── handlers/
│   │   ├── create-workflow-handler.ts
│   │   ├── update-workflow-handler.ts
│   │   ├── delete-workflow-handler.ts
│   │   ├── get-workflow-handler.ts
│   │   └── get-workflows-handler.ts
│   ├── use-cases/
│   │   ├── create-workflow-use-case.ts
│   │   ├── update-workflow-use-case.ts
│   │   ├── delete-workflow-use-case.ts
│   │   ├── get-workflow-use-case.ts
│   │   └── get-workflows-use-case.ts
│   └── index.ts
├── infrastructure/       # Infrastructure layer (external dependencies)
│   └── repositories/
│       └── prisma-workflow-repository.ts
│   └── index.ts
└── presentation/         # Presentation layer (API routes)
    ├── api/
    │   ├── create-workflow-api-route.ts
    │   ├── get-workflow-api-route.ts
    │   ├── get-workflows-api-route.ts
    │   ├── update-workflow-api-route.ts
    │   └── delete-workflow-api-route.ts
    └── index.ts
```

## Workflow Domain Model

### Workflow Entity

The [`Workflow`](src/slices/workflows/domain/entities/workflow.ts) entity represents a business process workflow with:

**Properties:**
- `id: WorkflowId` - Unique identifier
- `name: string` - Workflow name
- `description?: string` - Optional description
- `version: string` - Workflow version (e.g., "1.0")
- `status: WorkflowStatus` - Current status (DRAFT, ACTIVE, INACTIVE, ARCHIVED)
- `definition: string` - JSON string for workflow definition (nodes, edges, etc.)
- `settings: string` - JSON string for workflow settings
- `variables: string` - JSON string for workflow variables
- `organizationId?: string` - Optional organization association
- `isTemplate: boolean` - Whether workflow is a template
- `isPublic: boolean` - Whether workflow is publicly accessible

**Business Methods:**
- `updateDetails(updates)` - Update workflow properties
- `publish()` - Publish workflow (set status to ACTIVE)
- `activate()` - Activate workflow
- `deactivate()` - Deactivate workflow
- `archive()` - Archive workflow
- `isDraft()`, `isActive()`, `isInactive()`, `isArchived()` - Status checks
- `isWorkflowTemplate()`, `isWorkflowPublic()` - Feature checks
- `getDefinitionAsObject()` - Parse definition JSON
- `getSettingsAsObject()` - Parse settings JSON
- `getVariablesAsObject()` - Parse variables JSON
- `getUncommittedEvents()` - Get domain events
- `clearEvents()` - Clear committed events

**Domain Events:**
- `WorkflowCreatedEvent` - Fired when workflow is created
- `WorkflowUpdatedEvent` - Fired when workflow is updated
- `WorkflowDeletedEvent` - Fired when workflow is deleted
- `WorkflowPublishedEvent` - Fired when workflow is published
- `WorkflowActivatedEvent` - Fired when workflow is activated
- `WorkflowDeactivatedEvent` - Fired when workflow is deactivated

### Workflow Status Enum

```typescript
export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}
```

## Application Layer

### Commands

#### CreateWorkflowCommand

Creates a new workflow with the following properties:

**Required:**
- `name: string` - Workflow name
- `organizationId: string` - Organization ID
- `definition: string` - Workflow definition JSON
- `settings: string` - Workflow settings JSON
- `variables: string` - Workflow variables JSON
- `createdBy: string` - Creator user ID

**Optional:**
- `description?: string` - Workflow description
- `status?: WorkflowStatus` - Initial status (defaults to DRAFT)
- `isTemplate?: boolean` - Whether workflow is a template (defaults to false)
- `isPublic?: boolean` - Whether workflow is public (defaults to false)

#### UpdateWorkflowCommand

Updates an existing workflow:

**Required:**
- `workflowId: string` - Workflow ID to update
- `updatedBy: string` - Updater user ID

**Optional:**
- `name?: string` - New workflow name
- `description?: string` - New description
- `definition?: string` - New definition JSON
- `settings?: string` - New settings JSON
- `variables?: string` - New variables JSON
- `status?: WorkflowStatus` - New status
- `isTemplate?: boolean` - Template flag
- `isPublic?: boolean` - Public flag

#### DeleteWorkflowCommand

Deletes a workflow:

**Required:**
- `workflowId: string` - Workflow ID to delete
- `deletedBy: string` - Deleter user ID

### Queries

#### GetWorkflowQuery

Retrieves a single workflow by ID:

**Required:**
- `workflowId: string` - Workflow ID

#### GetWorkflowsQuery

Retrieves workflows with optional filters:

**Optional Filters:**
- `organizationId?: string` - Filter by organization
- `status?: WorkflowStatus` - Filter by status
- `isTemplate?: boolean` - Filter templates only
- `isPublic?: boolean` - Filter public workflows only

**Pagination:**
- `limit?: number` - Max results (default 50, max 100)
- `offset?: number` - Pagination offset (default 0)

### DTOs

#### WorkflowDto

Data transfer object with all workflow properties:

**Properties:**
- `id: string` - Workflow ID
- `name: string` - Workflow name
- `description: string` - Workflow description
- `organizationId: string` - Organization ID
- `definition: string` - Workflow definition JSON
- `settings: string` - Workflow settings JSON
- `variables: string` - Workflow variables JSON
- `status: WorkflowStatus` - Workflow status
- `version: string` - Workflow version
- `isTemplate: boolean` - Template flag
- `isPublic: boolean` - Public flag
- `publishedAt: Date | null` - Publication date
- `executionCount: number` - Execution count
- `successRate: number` - Success rate
- `avgDuration: number` - Average duration
- `lastExecutedAt: Date | null` - Last execution date
- `createdBy: string` - Creator user ID
- `createdAt: Date` - Creation date
- `updatedAt: Date` - Update date

## Handlers

### CreateWorkflowHandler

Handles workflow creation:

**Validation:**
- Workflow name is required
- Organization ID is required
- Workflow definition is required
- Creator ID is required

**Process:**
1. Validate command
2. Create [`Workflow`](src/slices/workflows/domain/entities/workflow.ts) entity
3. Save via [`IWorkflowRepository`](src/slices/workflows/domain/repositories/workflow-repository.ts)
4. Return [`WorkflowDto`](src/slices/workflows/application/dtos/workflow-dto.ts)

### UpdateWorkflowHandler

Handles workflow updates:

**Validation:**
- Workflow ID is required
- Updater ID is required
- At least one field must be provided for update

**Process:**
1. Validate command
2. Find workflow by ID
3. Update workflow via [`updateDetails()`](src/slices/workflows/domain/entities/workflow.ts:16) method
4. Save via repository
5. Return updated [`WorkflowDto`](src/slices/workflows/application/dtos/workflow-dto.ts)

### DeleteWorkflowHandler

Handles workflow deletion:

**Validation:**
- Workflow ID is required
- Deleter ID is required

**Process:**
1. Validate command
2. Find workflow by ID
3. Delete via [`IWorkflowRepository.delete()`](src/slices/workflows/domain/repositories/workflow-repository.ts:1)
4. Return success

### GetWorkflowHandler

Handles single workflow retrieval:

**Validation:**
- Workflow ID is required

**Process:**
1. Validate query
2. Find workflow by ID
3. Return [`WorkflowDto`](src/slices/workflows/application/dtos/workflow-dto.ts)

### GetWorkflowsHandler

Handles multiple workflows retrieval with filtering and pagination:

**Validation:**
- Limit must be between 1-100
- Offset must be >= 0

**Process:**
1. Validate query
2. Get workflows based on filters:
   - By organization ID → [`findByOrganizationId()`](src/slices/workflows/domain/repositories/workflow-repository.ts:1)
   - By status → [`findByStatus()`](src/slices/workflows/domain/repositories/workflow-repository.ts:1)
   - By template flag → [`findTemplates()`](src/slices/workflows/domain/repositories/workflow-repository.ts:1)
   - By public flag → [`findPublic()`](src/slices/workflows/domain/repositories/workflow-repository.ts:1)
   - All → [`findAll()`](src/slices/workflows/domain/repositories/workflow-repository.ts:1)
3. Apply additional client-side filters (status, isTemplate, isPublic)
4. Apply pagination (limit, offset)
5. Convert to DTOs
6. Return [`WorkflowDto[]`](src/slices/workflows/application/dtos/workflow-dto.ts)

## Use Cases

Use cases orchestrate handler execution and provide a clean API for the application layer.

### CreateWorkflowUseCase

```typescript
const useCase = new CreateWorkflowUseCase(handler);
const result = await useCase.execute(command);
```

### UpdateWorkflowUseCase

```typescript
const useCase = new UpdateWorkflowUseCase(handler);
const result = await useCase.execute(command);
```

### DeleteWorkflowUseCase

```typescript
const useCase = new DeleteWorkflowUseCase(handler);
const result = await useCase.execute(command);
```

### GetWorkflowUseCase

```typescript
const useCase = new GetWorkflowUseCase(handler);
const result = await useCase.execute(query);
```

### GetWorkflowsUseCase

```typescript
const useCase = new GetWorkflowsUseCase(handler);
const result = await useCase.execute(query);
```

## API Routes

### POST /api/workflows

Creates a new workflow:

**Request Body:**
```json
{
  "name": "My Workflow",
  "description": "Workflow description",
  "organizationId": "org-123",
  "definition": "{\"nodes\": [], \"edges\": []}",
  "settings": "{}",
  "variables": "{}",
  "createdBy": "user-123",
  "status": "DRAFT",
  "isTemplate": false,
  "isPublic": false
}
```

**Response (Success - 201):**
```json
{
  "data": {
    "id": "cuid...",
    "name": "My Workflow",
    "status": "DRAFT",
    ...
  }
}
```

**Response (Error - 400):**
```json
{
  "error": "Workflow name is required"
}
```

### GET /api/workflows/[id]

Retrieves a single workflow:

**Response (Success - 200):**
```json
{
  "data": {
    "id": "cuid...",
    "name": "My Workflow",
    "status": "ACTIVE",
    ...
  }
}
```

**Response (Error - 404):**
```json
{
  "error": "Workflow not found"
}
```

### GET /api/workflows

Retrieves workflows with optional filters:

**Query Parameters:**
- `organizationId` - Filter by organization
- `status` - Filter by status (DRAFT, ACTIVE, INACTIVE, ARCHIVED)
- `isTemplate` - Filter templates only
- `isPublic` - Filter public workflows only
- `limit` - Max results (default 50, max 100)
- `offset` - Pagination offset (default 0)

**Response (Success - 200):**
```json
{
  "data": [
    {
      "id": "cuid...",
      "name": "Workflow 1",
      "status": "ACTIVE",
      ...
    },
    {
      "id": "cuid...",
      "name": "Workflow 2",
      "status": "DRAFT",
      ...
    }
  ]
}
```

### PUT /api/workflows/[id]

Updates an existing workflow:

**Request Body:**
```json
{
  "name": "Updated Workflow Name",
  "description": "Updated description",
  "definition": "{\"nodes\": [], \"edges\": []}",
  "settings": "{}",
  "variables": "{}",
  "status": "ACTIVE",
  "isTemplate": true,
  "isPublic": false,
  "updatedBy": "user-123"
}
```

**Response (Success - 200):**
```json
{
  "data": {
    "id": "cuid...",
    "name": "Updated Workflow Name",
    "status": "ACTIVE",
    ...
  }
}
```

### DELETE /api/workflows/[id]

Deletes a workflow:

**Response (Success - 200):**
```json
{
  "message": "Workflow deleted successfully"
}
```

## Integration with Next.js App Directory

### Route Configuration

Add the following routes to your Next.js App Router:

```typescript
// app/api/workflows/create/route.ts
import { POST } from '@/slices/workflows/presentation/api/create-workflow-api-route';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  return POST(request);
}

// app/api/workflows/[id]/route.ts
import { GET } from '@/slices/workflows/presentation/api/get-workflow-api-route';
import { PUT } from '@/slices/workflows/presentation/api/update-workflow-api-route';
import { DELETE } from '@/slices/workflows/presentation/api/delete-workflow-api-route';

export async function GET(request: NextRequest) {
  return GET(request);
}

export async function PUT(request: NextRequest) {
  return PUT(request);
}

export async function DELETE(request: NextRequest) {
  return DELETE(request);
}
```

### Client-Side Integration

#### Creating a Workflow

```typescript
import { CreateWorkflowCommand } from '@/slices/workflows/application/commands';

const response = await fetch('/api/workflows', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': userId,
  },
  body: JSON.stringify({
    name: 'My Workflow',
    description: 'Workflow description',
    organizationId: 'org-123',
    definition: JSON.stringify({ nodes: [], edges: [] }),
    settings: JSON.stringify({}),
    variables: JSON.stringify({}),
    createdBy: userId,
    status: 'DRAFT',
  }),
});

const data = await response.json();
```

#### Getting Workflows

```typescript
const response = await fetch('/api/workflows?organizationId=org-123&status=ACTIVE&limit=20', {
  method: 'GET',
  headers: {
    'x-user-id': userId,
  },
});

const data = await response.json();
```

#### Updating a Workflow

```typescript
const response = await fetch(`/api/workflows/${workflowId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': userId,
  },
  body: JSON.stringify({
    name: 'Updated Name',
    description: 'Updated description',
    status: 'ACTIVE',
  }),
});

const data = await response.json();
```

#### Deleting a Workflow

```typescript
const response = await fetch(`/api/workflows/${workflowId}`, {
  method: 'DELETE',
  headers: {
    'x-user-id': userId,
  },
});

const data = await response.json();
```

## Error Handling

All API routes return consistent error responses:

**Validation Errors (400):**
```json
{
  "error": "Workflow name is required"
}
```

**Not Found Errors (404):**
```json
{
  "error": "Workflow not found"
}
```

**Server Errors (500):**
```json
{
  "error": "Internal server error"
}
```

## Workflow Status Management

### Status Transitions

Workflows follow this status lifecycle:

```
DRAFT → ACTIVE (publish/activate)
DRAFT → INACTIVE (deactivate)
DRAFT → ARCHIVED (archive)
ACTIVE → INACTIVE (deactivate)
ACTIVE → ARCHIVED (archive)
INACTIVE → ACTIVE (activate)
ARCHIVED → ACTIVE (activate)
```

### Business Rules

1. **Draft workflows** cannot be executed
2. **Archived workflows** cannot be modified
3. **Templates** can be instantiated but not executed
4. **Public workflows** can be viewed by anyone
5. **Organization-scoped workflows** are only visible to organization members

## Domain Events

The Workflow entity publishes domain events for state changes:

- `WorkflowCreatedEvent` - When a new workflow is created
- `WorkflowUpdatedEvent` - When workflow details are updated
- `WorkflowDeletedEvent` - When a workflow is deleted
- `WorkflowPublishedEvent` - When workflow is published
- `WorkflowActivatedEvent` - When workflow is activated
- `WorkflowDeactivatedEvent` - When workflow is deactivated

These events can be handled by:
- Event listeners for audit logging
- Notification services for user notifications
- Analytics tracking for workflow metrics

## Testing

### Unit Tests

```typescript
describe('CreateWorkflowHandler', () => {
  it('should create a workflow with valid data', async () => {
    const command = new CreateWorkflowCommand({
      name: 'Test Workflow',
      organizationId: 'org-123',
      definition: '{}',
      settings: '{}',
      variables: '{}',
      createdBy: 'user-123',
    });

    const result = await handler.handle(command);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBeDefined();
    expect(result.value.id).toBeDefined();
    expect(result.value.name).toBe('Test Workflow');
  });

  it('should fail with missing name', async () => {
    const command = new CreateWorkflowCommand({
      name: '',
      organizationId: 'org-123',
      definition: '{}',
      settings: '{}',
      variables: '{}',
      createdBy: 'user-123',
    });

    const result = await handler.handle(command);

    expect(result.isSuccess).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('Workflows API', () => {
  it('should create a workflow', async () => {
    const response = await fetch('/api/workflows', {
      method: 'POST',
      headers: { 'x-user-id': userId },
      body: JSON.stringify({
        name: 'Test Workflow',
        organizationId: 'org-123',
        definition: '{}',
        settings: '{}',
        variables: '{}',
        createdBy: userId,
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data).toBeDefined();
  });

  it('should get workflows', async () => {
    const response = await fetch('/api/workflows?limit=10', {
      method: 'GET',
      headers: { 'x-user-id': userId },
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

## Performance Considerations

1. **Database Indexing**: Ensure `organizationId` and `status` fields are indexed for efficient filtering
2. **Pagination**: Use limit/offset for large datasets to avoid memory issues
3. **JSON Parsing**: Parse definition/settings/variables only when needed
4. **Domain Events**: Use domain events sparingly for audit trails
5. **Caching**: Consider caching frequently accessed workflows

## Security Considerations

1. **Authorization**: All routes require `x-user-id` header
2. **Organization Scoping**: Workflows are scoped to organizations
3. **Access Control**: Public workflows are accessible to all users
4. **Input Validation**: All inputs are validated before processing
5. **SQL Injection**: Prisma ORM provides protection against SQL injection

## Migration Notes

When migrating existing workflow functionality to the new Clean Architecture:

1. **Map existing workflow fields** to new domain model:
   - `definition` → `definition` (JSON string)
   - `settings` → `settings` (JSON string)
   - `variables` → `variables` (JSON string)
   - Status enum → `WorkflowStatus` enum

2. **Update API routes** to use new Clean Architecture handlers:
   - Replace direct database calls with use case execution
   - Add proper error handling with `Result<T>` pattern

3. **Update client code**:
   - Import from `@/slices/workflows/application` instead of old paths
   - Use new DTOs and commands

4. **Test thoroughly**:
   - Unit tests for handlers and use cases
   - Integration tests for API routes
   - Manual testing of workflow execution

## Summary

The Workflows slice provides a complete Clean Architecture implementation for workflow management with:

- **Domain Layer**: Business logic with entities, value objects, and repository interfaces
- **Application Layer**: Commands, queries, DTOs, handlers, and use cases
- **Infrastructure Layer**: Prisma repository implementation
- **Presentation Layer**: Next.js API routes for CRUD operations

The slice follows the same patterns as the Auth, Organizations, and Analytics slices, ensuring consistency across the codebase.
