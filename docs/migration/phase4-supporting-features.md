# Phase 4: Supporting Features Migration

## Overview

Phase 4 focuses on migrating supporting features that provide essential infrastructure and utility functionality for the application. These features support the core business features but are not directly part of the core business logic.

## Phase 4 Slices

### 1. Notifications Slice

**Purpose**: Manage user notifications across different channels (in-app, email, push, SMS)

**Status**: Not Started ⏳

**Domain Model**:
- Value Objects: NotificationId, NotificationType, NotificationStatus
- Entities: Notification
- Repositories: INotificationRepository
- Services: INotificationService

**Use Cases**:
- Create notification
- Mark notification as read
- Delete notification
- Mark all notifications as read
- Delete old notifications
- List notifications
- Get unread count

### 2. Files Slice

**Purpose**: Manage file uploads, storage, and retrieval

**Status**: Complete ✅

**Domain Model**:
- Value Objects: FileId, FileType, FileStatus, FileMetadata
- Entities: File, FileFolder, FileShare
- Repositories: IFileRepository, IFileFolderRepository, IFileShareRepository
- Services: IFileStorageService, IFileValidationService, IFileCompressionService

**Use Cases**:
- Upload file
- Download file
- Delete file
- List files
- Create folder
- Share file
- Get file metadata

### 3. Settings Slice

**Purpose**: Manage user and organization settings

**Status**: Not Started ⏳

**Domain Model**:
- Value Objects: SettingId, SettingType, SettingScope
- Entities: Setting, SettingGroup
- Repositories: ISettingRepository, ISettingGroupRepository
- Services: ISettingValidationService

**Use Cases**:
- Get setting
- Update setting
- Reset setting to default
- List settings
- Create setting group
- Update setting group

### 4. Audit Slice

**Purpose**: Track and audit system events and user actions

**Status**: Complete ✅

**Domain Model**:
- Value Objects: AuditId, AuditAction
- Entities: AuditLog
- Repositories: IAuditLogRepository

**Application Layer**:
- Commands: CreateAuditLogCommand, UpdateAuditLogCommand, ArchiveAuditLogCommand, DeleteAuditLogCommand
- Queries: GetAuditLogQuery, ListAuditLogsQuery, GetAuditStatisticsQuery
- DTOs: AuditLogDto, AuditStatisticsDto, PaginatedAuditLogsDto
- Handlers: CreateAuditLogHandler, UpdateAuditLogHandler, DeleteAuditLogHandler, GetAuditLogHandler, ListAuditLogsHandler, GetAuditLogsHandler, GetAuditStatisticsHandler

**Infrastructure Layer**:
- Repository: PrismaAuditLogRepository
- DI Container: configureAuditContainer()

**Presentation Layer**:
- API Routes: GET /api/audit/:id, GET /api/audit, POST /api/audit, PUT /api/audit/:id, DELETE /api/audit/:id, POST /api/audit/archive/:id, GET /api/audit/statistics

**Use Cases**:
- Create audit log
- Update audit log
- Delete audit log
- Get single audit log
- List audit logs with filters
- Get all audit logs
- Get audit statistics

## Migration Strategy

### Slice Structure Template

Each slice follows the same structure:

```
src/slices/{slice-name}/
├── domain/
│   ├── value-objects/
│   │   ├── {slice-name}-id.ts
│   │   ├── {slice-name}-type.ts
│   │   └── ...
│   ├── entities/
│   │   ├── {slice-name}.ts
│   │   └── ...
│   ├── repositories/
│   │   ├── i{slice-name}-repository.ts
│   │   └── ...
│   ├── services/
│   │   ├── i{slice-name}-service.ts
│   │   └── ...
│   ├── events/
│   │   └── ...
│   └── index.ts
├── application/
│   ├── commands/
│   │   ├── create-{slice-name}-command.ts
│   │   ├── update-{slice-name}-command.ts
│   │   └── ...
│   ├── queries/
│   │   ├── get-{slice-name}-query.ts
│   │   ├── list-{slice-name}s-query.ts
│   │   └── ...
│   ├── dtos/
│   │   ├── {slice-name}-dto.ts
│   │   └── ...
│   ├── handlers/
│   │   ├── create-{slice-name}-handler.ts
│   │   ├── update-{slice-name}-handler.ts
│   │   └── ...
│   ├── use-cases/
│   │   ├── create-{slice-name}-use-case.ts
│   │   ├── update-{slice-name}-use-case.ts
│   │   └── ...
│   └── index.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── prisma-{slice-name}-repository.ts
│   │   └── ...
│   ├── services/
│   │   ├── {slice-name}-service-impl.ts
│   │   └── ...
│   └── index.ts
├── presentation/
│   ├── api/
│   │   ├── {slice-name}-api-route.ts
│   │   └── ...
│   └── index.ts
└── index.ts
```

### Migration Approach

1. **Domain Layer First**: Start with value objects, entities, repositories, and services
2. **Application Layer Second**: Create commands, queries, DTOs, handlers, and use cases
3. **Infrastructure Layer Third**: Implement Prisma repositories and service implementations
4. **Presentation Layer Last**: Create API routes for external access

### Dependency Injection

Each slice should register its dependencies in the DI container:

```typescript
// src/shared/infrastructure/di/types.ts
export const TYPES = {
  // ... existing types

  // Notifications
  NotificationRepository: Symbol.for('NotificationRepository'),
  NotificationTemplateRepository: Symbol.for('NotificationTemplateRepository'),
  NotificationPreferenceRepository: Symbol.for('NotificationPreferenceRepository'),
  NotificationService: Symbol.for('NotificationService'),
  EmailNotificationService: Symbol.for('EmailNotificationService'),
  PushNotificationService: Symbol.for('PushNotificationService'),
  SmsNotificationService: Symbol.for('SmsNotificationService'),
  CreateNotificationHandler: Symbol.for('CreateNotificationHandler'),
  UpdateNotificationHandler: Symbol.for('UpdateNotificationHandler'),
  DeleteNotificationHandler: Symbol.for('DeleteNotificationHandler'),
  GetNotificationHandler: Symbol.for('GetNotificationHandler'),
  ListNotificationsHandler: Symbol.for('ListNotificationsHandler'),
  UpdateNotificationPreferencesHandler: Symbol.for('UpdateNotificationPreferencesHandler'),
  SendNotificationHandler: Symbol.for('SendNotificationHandler'),
  CreateNotificationUseCase: Symbol.for('CreateNotificationUseCase'),
  UpdateNotificationUseCase: Symbol.for('UpdateNotificationUseCase'),
  DeleteNotificationUseCase: Symbol.for('DeleteNotificationUseCase'),
  GetNotificationUseCase: Symbol.for('GetNotificationUseCase'),
  ListNotificationsUseCase: Symbol.for('ListNotificationsUseCase'),
  UpdateNotificationPreferencesUseCase: Symbol.for('UpdateNotificationPreferencesUseCase'),
  SendNotificationUseCase: Symbol.for('SendNotificationUseCase'),

  // Files
  FileRepository: Symbol.for('FileRepository'),
  FileFolderRepository: Symbol.for('FileFolderRepository'),
  FileShareRepository: Symbol.for('FileShareRepository'),
  FileStorageService: Symbol.for('FileStorageService'),
  FileValidationService: Symbol.for('FileValidationService'),
  FileCompressionService: Symbol.for('FileCompressionService'),
  UploadFileHandler: Symbol.for('UploadFileHandler'),
  DownloadFileHandler: Symbol.for('DownloadFileHandler'),
  DeleteFileHandler: Symbol.for('DeleteFileHandler'),
  ListFilesHandler: Symbol.for('ListFilesHandler'),
  CreateFolderHandler: Symbol.for('CreateFolderHandler'),
  ShareFileHandler: Symbol.for('ShareFileHandler'),
  GetFileMetadataHandler: Symbol.for('GetFileMetadataHandler'),
  UploadFileUseCase: Symbol.for('UploadFileUseCase'),
  DownloadFileUseCase: Symbol.for('DownloadFileUseCase'),
  DeleteFileUseCase: Symbol.for('DeleteFileUseCase'),
  ListFilesUseCase: Symbol.for('ListFilesUseCase'),
  CreateFolderUseCase: Symbol.for('CreateFolderUseCase'),
  ShareFileUseCase: Symbol.for('ShareFileUseCase'),
  GetFileMetadataUseCase: Symbol.for('GetFileMetadataUseCase'),

  // Settings
  SettingRepository: Symbol.for('SettingRepository'),
  SettingGroupRepository: Symbol.for('SettingGroupRepository'),
  SettingValidationService: Symbol.for('SettingValidationService'),
  GetSettingHandler: Symbol.for('GetSettingHandler'),
  UpdateSettingHandler: Symbol.for('UpdateSettingHandler'),
  ResetSettingHandler: Symbol.for('ResetSettingHandler'),
  ListSettingsHandler: Symbol.for('ListSettingsHandler'),
  CreateSettingGroupHandler: Symbol.for('CreateSettingGroupHandler'),
  UpdateSettingGroupHandler: Symbol.for('UpdateSettingGroupHandler'),
  GetSettingUseCase: Symbol.for('GetSettingUseCase'),
  UpdateSettingUseCase: Symbol.for('UpdateSettingUseCase'),
  ResetSettingUseCase: Symbol.for('ResetSettingUseCase'),
  ListSettingsUseCase: Symbol.for('ListSettingsUseCase'),
  CreateSettingGroupUseCase: Symbol.for('CreateSettingGroupUseCase'),
  UpdateSettingGroupUseCase: Symbol.for('UpdateSettingGroupUseCase'),

  // Audit
  AuditLogRepository: Symbol.for('AuditLogRepository'),
  AuditEventRepository: Symbol.for('AuditEventRepository'),
  AuditService: Symbol.for('AuditService'),
  AuditQueryService: Symbol.for('AuditQueryService'),
  CreateAuditLogHandler: Symbol.for('CreateAuditLogHandler'),
  QueryAuditLogsHandler: Symbol.for('QueryAuditLogsHandler'),
  ExportAuditLogsHandler: Symbol.for('ExportAuditLogsHandler'),
  GetAuditStatisticsHandler: Symbol.for('GetAuditStatisticsHandler'),
  MonitorAuditEventsHandler: Symbol.for('MonitorAuditEventsHandler'),
  CreateAuditLogUseCase: Symbol.for('CreateAuditLogUseCase'),
  QueryAuditLogsUseCase: Symbol.for('QueryAuditLogsUseCase'),
  ExportAuditLogsUseCase: Symbol.for('ExportAuditLogsUseCase'),
  GetAuditStatisticsUseCase: Symbol.for('GetAuditStatisticsUseCase'),
  MonitorAuditEventsUseCase: Symbol.for('MonitorAuditEventsUseCase'),
};
```

## Timeline

### Week 1: Notifications Slice
- Day 1-2: Domain layer (value objects, entities, repositories, services)
- Day 3-4: Application layer (commands, queries, DTOs, handlers, use cases)
- Day 5: Infrastructure layer (Prisma repositories, service implementations)
- Day 6-7: Presentation layer (API routes) and integration

### Week 2: Files Slice
- Day 1-2: Domain layer (value objects, entities, repositories, services)
- Day 3-4: Application layer (commands, queries, DTOs, handlers, use cases)
- Day 5: Infrastructure layer (Prisma repositories, service implementations)
- Day 6-7: Presentation layer (API routes) and integration

### Week 3: Settings Slice
- Day 1-2: Domain layer (value objects, entities, repositories, services)
- Day 3-4: Application layer (commands, queries, DTOs, handlers, use cases)
- Day 5: Infrastructure layer (Prisma repositories, service implementations)
- Day 6-7: Presentation layer (API routes) and integration

### Week 4: Audit Slice
- Day 1-2: Domain layer (value objects, entities, repositories, services)
- Day 3-4: Application layer (commands, queries, DTOs, handlers, use cases)
- Day 5: Infrastructure layer (Prisma repositories, service implementations)
- Day 6-7: Presentation layer (API routes) and integration

## Success Criteria

- All 4 slices implemented following Clean Architecture principles
- All slices have complete domain, application, infrastructure, and presentation layers
- All slices registered in DI container
- All slices have integration documentation
- All slices have API routes for external access
- All slices follow the same structure and patterns as Phase 3 slices

## Risks and Mitigation

### Risk 1: File Storage Complexity
**Description**: File storage involves complex operations like upload, download, compression, and validation

**Mitigation**: Use existing file storage services in `lib/` and create adapters for clean architecture

### Risk 2: Notification Delivery
**Description**: Notifications need to be delivered through multiple channels (email, push, SMS)

**Mitigation**: Use existing notification services in `lib/` and create adapters for clean architecture

### Risk 3: Audit Log Volume
**Description**: Audit logs can grow very large and impact performance

**Mitigation**: Implement proper indexing, archiving, and query optimization in repository layer

### Risk 4: Settings Validation
**Description**: Settings need to be validated based on type and scope

**Mitigation**: Create a robust validation service with type-specific validation rules

## Lessons Learned from Phase 3

1. **TypeScript Compilation**: Use `export type` for interfaces to avoid `isolatedModules` errors
2. **Prisma Schema Compatibility**: Map between domain entities and Prisma models in repository implementations
3. **Dependency Injection**: Keep DI container organized and avoid duplicates
4. **Result Pattern**: Use `Result<T>` pattern consistently across all handlers
5. **Value Objects**: Be consistent with value object property access (use `value` getter)
6. **API Routes**: Next.js API routes are different from traditional controllers
7. **Documentation**: Create integration guides for each slice

## Next Steps

1. Start with Notifications slice
2. Follow the slice structure template
3. Implement domain layer first
4. Implement application layer second
5. Implement infrastructure layer third
6. Implement presentation layer last
7. Update DI container
8. Create integration documentation
9. Repeat for Files, Settings, and Audit slices
10. Update Phase 4 documentation with completion status
11. Update migration progress documentation
