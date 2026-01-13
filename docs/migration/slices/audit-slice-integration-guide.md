# Audit Slice Integration Guide

## Overview
The Audit slice provides comprehensive activity tracking and compliance logging capabilities. This slice enables tracking of all system activities for security auditing, compliance requirements, and forensic analysis.

## Domain Layer

### Value Objects
- **AuditId** - Unique identifier for audit log entries
  - `create(value: string): Result<AuditId>` - Creates a new AuditId
  - `fromValue(value: string): AuditId` - Creates AuditId from existing value
  - `getValue(): string` - Gets the ID value

- **AuditAction** - Represents the type of action performed
  - Static factory methods: `CREATE()`, `UPDATE()`, `DELETE()`, `LOGIN()`, `LOGOUT()`, `EXPORT()`, `IMPORT()`

### Entities
- **AuditLog** - Represents an audit log entry
  - Properties: id, action, resource, resourceId, userId, organizationId, sessionId, ipAddress, userAgent, endpoint, method, oldValues, newValues, metadata, status, severity, category, retentionDate, isArchived, createdAt
  - Methods:
    - `archive(): AuditLog` - Archives the audit log
    - `unarchive(): AuditLog` - Unarchives the audit log
    - `getId(): string` - Gets the audit log ID
    - `getAction(): string` - Gets the action type
    - `getResource(): string` - Gets the resource type
    - `getResourceId(): string | null` - Gets the resource ID
    - `getUserId(): string | null` - Gets the user ID
    - `getOrganizationId(): string | null` - Gets the organization ID
    - `getSessionId(): string | null` - Gets the session ID
    - `getIpAddress(): string | null` - Gets the IP address
    - `getUserAgent(): string | null` - Gets the user agent
    - `getEndpoint(): string | null` - Gets the API endpoint
    - `getMethod(): string | null` - Gets the HTTP method
    - `getOldValues(): string | null` - Gets the old values
    - `getNewValues(): string | null` - Gets the new values
    - `getMetadata(): string` - Gets the metadata
    - `getStatus(): string` - Gets the status
    - `getSeverity(): string` - Gets the severity level
    - `getCategory(): string` - Gets the category
    - `getRetentionDate(): Date | null` - Gets the retention date
    - `isArchived(): boolean` - Checks if archived
    - `getCreatedAt(): Date` - Gets the creation timestamp
  - Static: `create(props): AuditLog` - Creates a new audit log

### Repository Interface
- **IAuditLogRepository** - Defines contract for audit log data access
  - `findById(id: string): Promise<AuditLog | null>` - Find audit log by ID
  - `findAll(): Promise<AuditLog[]>` - Get all audit logs
  - `findByUserId(userId: string): Promise<AuditLog[]>` - Find audit logs by user ID
  - `findByOrganizationId(organizationId: string): Promise<AuditLog[]>` - Find audit logs by organization ID
  - `findByAction(action: string): Promise<AuditLog[]>` - Find audit logs by action type
  - `findByResource(resource: string): Promise<AuditLog[]>` - Find audit logs by resource type
  - `findByCategory(category: string): Promise<AuditLog[]>` - Find audit logs by category
  - `findBySeverity(severity: string): Promise<AuditLog[]>` - Find audit logs by severity
  - `findByFilters(filters): Promise<{ logs: AuditLog[]; total: number }>` - Find audit logs with filters
  - `save(auditLog: AuditLog): Promise<AuditLog>` - Save audit log
  - `update(auditLog: AuditLog): Promise<AuditLog>` - Update audit log
  - `delete(id: string): Promise<boolean>` - Delete audit log
  - `deleteByUserId(userId: string): Promise<number>` - Delete audit logs by user ID
  - `deleteByOrganizationId(organizationId: string): Promise<number>` - Delete audit logs by organization ID
  - `archive(id: string): Promise<AuditLog | null>` - Archive audit log
  - `archiveByRetentionDate(retentionDate: Date): Promise<number>` - Archive audit logs by retention date
  - `count(filters?): Promise<number>` - Count audit logs

## Application Layer

### Commands
- **CreateAuditLogCommand** - Command for creating audit log
  - Properties: action, resource, resourceId, userId, organizationId, sessionId, ipAddress, userAgent, endpoint, method, oldValues, newValues, metadata, status, severity, category, retentionDate

- **UpdateAuditLogCommand** - Command for updating audit log
  - Properties: id, status, metadata, retentionDate, isArchived

- **ArchiveAuditLogCommand** - Command for archiving audit log
  - Properties: id

- **DeleteAuditLogCommand** - Command for deleting audit log
  - Properties: id

### Queries
- **GetAuditLogQuery** - Query for retrieving single audit log
  - Properties: id

- **ListAuditLogsQuery** - Query for retrieving audit logs with filters
  - Properties: userId, organizationId, action, resource, category, severity, startDate, endDate, limit, offset

- **GetAuditStatisticsQuery** - Query for retrieving audit statistics
  - Properties: userId, organizationId, startDate, endDate

### DTOs
- **AuditLogDto** - Data transfer object for audit log
  - Methods:
    - `fromObject(obj): AuditLogDto` - Creates DTO from object
    - `toObject(): object` - Converts DTO to plain object

- **AuditStatisticsDto** - Data transfer object for audit statistics
  - Properties: totalLogs, byAction, byResource, byCategory, bySeverity, successCount, failureCount, warningCount
  - Methods: `toObject(): object` - Converts DTO to plain object

- **PaginatedAuditLogsDto** - Data transfer object for paginated audit logs
  - Properties: logs, total, limit, offset
  - Methods: `toObject(): object` - Converts DTO to plain object

### Handlers
- **CreateAuditLogHandler** - Handles creating audit log entries
  - `handle(command: CreateAuditLogCommand): Promise<Result<AuditLog>>`

- **UpdateAuditLogHandler** - Handles updating audit log entries
  - `handle(command: UpdateAuditLogCommand): Promise<Result<AuditLog>>`

- **DeleteAuditLogHandler** - Handles deleting audit log entries
  - `handle(command: DeleteAuditLogCommand): Promise<Result<boolean>>`

- **GetAuditLogHandler** - Handles retrieving single audit log
  - `handle(query: GetAuditLogQuery): Promise<Result<AuditLogDto>>`

- **ListAuditLogsHandler** - Handles retrieving audit logs with filters
  - `handle(query: ListAuditLogsQuery): Promise<Result<PaginatedAuditLogsDto>>`

- **GetAuditLogsHandler** - Handles retrieving all audit logs
  - `handle(): Promise<Result<AuditLogDto[]>>`

- **GetAuditStatisticsHandler** - Handles retrieving audit statistics
  - `handle(query: GetAuditStatisticsQuery): Promise<Result<AuditStatisticsDto>>`

## Infrastructure Layer

### Repository Implementation
- **PrismaAuditLogRepository** - Prisma-based implementation of IAuditLogRepository
  - All methods from IAuditLogRepository interface
  - Factory function: `createPrismaAuditLogRepository(prisma: PrismaClient): IAuditLogRepository`

### DI Container
- **configureAuditContainer(container: Container): void** - Configures audit slice dependencies
  - Binds: AuditLogRepository, CreateAuditLogHandler, UpdateAuditLogHandler, DeleteAuditLogHandler, GetAuditLogHandler, ListAuditLogsHandler, GetAuditLogsHandler, GetAuditStatisticsHandler

## Presentation Layer

### API Routes
- **GET /api/audit/:id** - Get single audit log
- **GET /api/audit** - List all audit logs
- **POST /api/audit** - Create audit log
- **PUT /api/audit/:id** - Update audit log
- **DELETE /api/audit/:id** - Delete audit log
- **POST /api/audit/archive/:id** - Archive audit log
- **GET /api/audit/statistics** - Get audit statistics

## Usage Examples

### Creating an Audit Log
```typescript
import { CreateAuditLogHandler } from '@/slices/audit/application/handlers';
import { CreateAuditLogCommand } from '@/slices/audit/application/commands';
import { AuditAction } from '@/slices/audit/domain/value-objects/audit-action';
import { container } from '@/shared/infrastructure/di/container';

const handler = container.get<CreateAuditLogHandler>(TYPES.CreateAuditLogHandler);

const command = new CreateAuditLogCommand({
  action: AuditAction.CREATE().getValue(),
  resource: 'User',
  resourceId: 'user-123',
  userId: 'user-456',
  organizationId: 'org-789',
  sessionId: 'session-abc',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0',
  endpoint: '/api/users',
  method: 'POST',
  oldValues: JSON.stringify({ name: 'Old Name' }),
  newValues: JSON.stringify({ name: 'New Name' }),
  metadata: JSON.stringify({ source: 'admin-panel' }),
  status: 'success',
  severity: 'info',
  category: 'general',
});

const result = await handler.handle(command);
```

### Listing Audit Logs with Filters
```typescript
import { ListAuditLogsHandler } from '@/slices/audit/application/handlers';
import { ListAuditLogsQuery } from '@/slices/audit/application/commands';
import { container } from '@/shared/infrastructure/di/container';

const handler = container.get<ListAuditLogsHandler>(TYPES.ListAuditLogsHandler);

const query = new ListAuditLogsQuery({
  userId: 'user-456',
  organizationId: 'org-789',
  action: 'CREATE',
  resource: 'User',
  category: 'general',
  severity: 'info',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  limit: 50,
  offset: 0,
});

const result = await handler.handle(query);
```

### Getting Audit Statistics
```typescript
import { GetAuditStatisticsHandler } from '@/slices/audit/application/handlers';
import { GetAuditStatisticsQuery } from '@/slices/audit/application/commands';
import { container } from '@/shared/infrastructure/di/container';

const handler = container.get<GetAuditStatisticsHandler>(TYPES.GetAuditStatisticsHandler);

const query = new GetAuditStatisticsQuery({
  userId: 'user-456',
  organizationId: 'org-789',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
});

const result = await handler.handle(query);
```

## Compliance and Security Considerations

1. **Retention Policy**: Audit logs should be archived or deleted based on retention policies
2. **Data Privacy**: Sensitive data in oldValues/newValues should be encrypted or masked
3. **Immutable Logs**: Audit logs should never be modified after creation (except for archiving)
4. **Integrity**: Audit logs should include checksums or hashes to ensure data integrity
5. **Access Control**: Audit log access should be restricted to authorized personnel

## Testing

### Unit Tests
- Test audit log creation with various action types
- Test audit log filtering by user, organization, action, resource, category, severity
- Test audit log archiving and unarchiving
- Test audit log deletion
- Test audit statistics calculation

### Integration Tests
- Test audit log creation through API endpoints
- Test audit log retrieval with pagination
- Test audit log filtering and sorting
- Test audit log export functionality

## Migration Notes

When migrating existing audit functionality to the new clean architecture:

1. **Data Migration**: Migrate existing audit logs to the new AuditLog entity structure
2. **API Compatibility**: Maintain backward compatibility with existing audit endpoints
3. **Indexing**: Ensure audit logs are properly indexed for fast queries
4. **Retention**: Implement automatic archiving based on retention dates
5. **Performance**: Consider adding database indexes for common query patterns (userId, organizationId, action, resource, category, severity, createdAt)
