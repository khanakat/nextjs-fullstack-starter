# Files Slice Integration Guide

## Overview

The Files slice provides file management functionality including file upload, storage, retrieval, deletion, and statistics. This guide explains how to integrate the Files slice into your application.

## Architecture

The Files slice follows clean architecture principles with four distinct layers:

### Domain Layer
- **Value Objects**: [`FileId`](../../src/slices/files/domain/value-objects/file-id.ts), [`FileType`](../../src/slices/files/domain/value-objects/file-type.ts)
- **Entities**: [`File`](../../src/slices/files/domain/entities/file.ts)
- **Repositories**: [`IFileRepository`](../../src/slices/files/domain/repositories/file-repository.ts)

### Application Layer
- **Commands**:
  - [`UploadFileCommand`](../../src/slices/files/application/commands/upload-file-command.ts)
  - [`DeleteFileCommand`](../../src/slices/files/application/commands/delete-file-command.ts)
  - [`UpdateFileUrlCommand`](../../src/slices/files/application/commands/update-file-url-command.ts)
  - [`DeleteManyFilesCommand`](../../src/slices/files/application/commands/delete-many-files-command.ts)
- **Queries**:
  - [`GetFileQuery`](../../src/slices/files/application/queries/get-file-query.ts)
  - [`ListFilesQuery`](../../src/slices/files/application/queries/list-files-query.ts)
  - [`GetFileStatisticsQuery`](../../src/slices/files/application/queries/get-file-statistics-query.ts)
- **DTOs**:
  - [`FileDto`](../../src/slices/files/application/dtos/file-dto.ts)
  - [`FileStatisticsDto`](../../src/slices/files/application/dtos/file-statistics-dto.ts)
  - [`PaginatedFilesDto`](../../src/slices/files/application/dtos/paginated-files-dto.ts)
- **Handlers**:
  - [`UploadFileHandler`](../../src/slices/files/application/handlers/upload-file-handler.ts)
  - [`DeleteFileHandler`](../../src/slices/files/application/handlers/delete-file-handler.ts)
  - [`UpdateFileUrlHandler`](../../src/slices/files/application/handlers/update-file-url-handler.ts)
  - [`DeleteManyFilesHandler`](../../src/slices/files/application/handlers/delete-many-files-handler.ts)
  - [`GetFileHandler`](../../src/slices/files/application/handlers/get-file-handler.ts)
  - [`ListFilesHandler`](../../src/slices/files/application/handlers/list-files-handler.ts)
  - [`GetFileStatisticsHandler`](../../src/slices/files/application/handlers/get-file-statistics-handler.ts)

### Infrastructure Layer
- **Repositories**: [`PrismaFileRepository`](../../src/slices/files/infrastructure/repositories/prisma-file-repository.ts)

### Presentation Layer
- **API Routes**: [`FilesApiRoute`](../../src/slices/files/presentation/routes/files-api-route.ts)

## Database Schema

The Files slice uses the Prisma `Media` model for file storage:

```prisma
model Media {
  id        String   @id @default(cuid())
  filename   String
  originalName String
  mimeType   String
  size       Int
  url        String
  uploadedById String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

## API Endpoints

### Upload File
```typescript
POST /api/files
Content-Type: application/json

Request Body:
{
  "filename": "file_abc123.pdf",
  "originalName": "document.pdf",
  "mimeType": "application/pdf",
  "size": 1024000,
  "url": "https://storage.example.com/files/file_abc123.pdf",
  "uploadedById": "user_123"
}

Response (201 Created):
{
  "id": "file_abc123",
  "filename": "file_abc123.pdf",
  "originalName": "document.pdf",
  "mimeType": "application/pdf",
  "size": 1024000,
  "url": "https://storage.example.com/files/file_abc123.pdf",
  "uploadedById": "user_123",
  "createdAt": "2024-01-10T10:00:00Z",
  "updatedAt": "2024-01-10T10:00:00Z"
}
```

### List Files
```typescript
GET /api/files?userId=user_123&limit=20&offset=0&mimeType=application/pdf&minSize=0&maxSize=10485760&startDate=2024-01-01&endDate=2024-01-31&searchTerm=document

Response (200 OK):
{
  "files": [
    {
      "id": "file_abc123",
      "filename": "file_abc123.pdf",
      "originalName": "document.pdf",
      "mimeType": "application/pdf",
      "size": 1024000,
      "url": "https://storage.example.com/files/file_abc123.pdf",
      "uploadedById": "user_123",
      "createdAt": "2024-01-10T10:00:00Z",
      "updatedAt": "2024-01-10T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

### Get File Statistics
```typescript
GET /api/files?statistics=true&userId=user_123

Response (200 OK):
{
  "totalFiles": 150,
  "totalSize": 157286400,
  "totalSizeFormatted": "150 MB",
  "byType": {
    "application/pdf": 50,
    "image/jpeg": 60,
    "video/mp4": 40
  }
}
```

### Get File by ID
```typescript
GET /api/files/file_abc123?userId=user_123

Response (200 OK):
{
  "id": "file_abc123",
  "filename": "file_abc123.pdf",
  "originalName": "document.pdf",
  "mimeType": "application/pdf",
  "size": 1024000,
  "url": "https://storage.example.com/files/file_abc123.pdf",
  "uploadedById": "user_123",
  "createdAt": "2024-01-10T10:00:00Z",
  "updatedAt": "2024-01-10T10:00:00Z"
}
```

### Update File URL
```typescript
PATCH /api/files/file_abc123
Content-Type: application/json

Request Body:
{
  "url": "https://storage.example.com/files/file_abc123_updated.pdf",
  "userId": "user_123"
}

Response (200 OK):
{
  "id": "file_abc123",
  "filename": "file_abc123.pdf",
  "originalName": "document.pdf",
  "mimeType": "application/pdf",
  "size": 1024000,
  "url": "https://storage.example.com/files/file_abc123_updated.pdf",
  "uploadedById": "user_123",
  "createdAt": "2024-01-10T10:00:00Z",
  "updatedAt": "2024-01-10T10:05:00Z"
}
```

### Delete File
```typescript
DELETE /api/files/file_abc123
Content-Type: application/json

Request Body:
{
  "userId": "user_123"
}

Response (200 OK):
{
  "success": true
}
```

### Delete Multiple Files
```typescript
DELETE /api/files?ids=file_abc123,file_456def,file_789ghi&userId=user_123

Response (200 OK):
{
  "success": true
}
```

## Dependency Injection

The Files slice is configured in the DI container:

```typescript
import { DIContainer } from '@/shared/infrastructure/di/container';
import { TYPES } from '@/shared/infrastructure/di/types';

// Get repository
const fileRepository = DIContainer.get<IFileRepository>(TYPES.FileRepository);

// Get handlers
const uploadFileHandler = DIContainer.get<UploadFileHandler>(TYPES.UploadFileHandler);
const deleteFileHandler = DIContainer.get<DeleteFileHandler>(TYPES.DeleteFileHandler);
const updateFileUrlHandler = DIContainer.get<UpdateFileUrlHandler>(TYPES.UpdateFileUrlHandler);
const deleteManyFilesHandler = DIContainer.get<DeleteManyFilesHandler>(TYPES.DeleteManyFilesHandler);
const getFileHandler = DIContainer.get<GetFileHandler>(TYPES.GetFileHandler);
const listFilesHandler = DIContainer.get<ListFilesHandler>(TYPES.ListFilesHandler);
const getFileStatisticsHandler = DIContainer.get<GetFileStatisticsHandler>(TYPES.GetFileStatisticsHandler);
```

## Usage Examples

### Uploading a File

```typescript
import { UploadFileCommand } from '@/slices/files/application/commands/upload-file-command';
import { UploadFileHandler } from '@/slices/files/application/handlers/upload-file-handler';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { TYPES } from '@/shared/infrastructure/di/types';

const uploadFileHandler = DIContainer.get<UploadFileHandler>(TYPES.UploadFileHandler);

const command = new UploadFileCommand({
  filename: `file_${Date.now()}.pdf`,
  originalName: 'document.pdf',
  mimeType: 'application/pdf',
  size: 1024000,
  url: 'https://storage.example.com/files/file_abc123.pdf',
  uploadedById: 'user_123',
});

const result = await uploadFileHandler.handle(command);

if (result.isSuccess) {
  const file = result.value;
  console.log('File uploaded:', file.toObject());
} else {
  console.error('Upload failed:', result.error);
}
```

### Listing Files with Filters

```typescript
import { ListFilesQuery } from '@/slices/files/application/queries/list-files-query';
import { ListFilesHandler } from '@/slices/files/application/handlers/list-files-handler';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { TYPES } from '@/shared/infrastructure/di/types';

const listFilesHandler = DIContainer.get<ListFilesHandler>(TYPES.ListFilesHandler);

const query = new ListFilesQuery({
  userId: 'user_123',
  limit: 20,
  offset: 0,
  mimeType: 'application/pdf',
  minSize: 0,
  maxSize: 10485760, // 10 MB
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  searchTerm: 'document',
});

const result = await listFilesHandler.handle(query);

if (result.isSuccess) {
  const paginatedFiles = result.value;
  console.log('Files:', paginatedFiles.files.length);
  console.log('Total:', paginatedFiles.total);
  console.log('Page:', paginatedFiles.page, 'of', paginatedFiles.totalPages);
} else {
  console.error('List failed:', result.error);
}
```

### Getting File Statistics

```typescript
import { GetFileStatisticsQuery } from '@/slices/files/application/queries/get-file-statistics-query';
import { GetFileStatisticsHandler } from '@/slices/files/application/handlers/get-file-statistics-handler';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { TYPES } from '@/shared/infrastructure/di/types';

const getFileStatisticsHandler = DIContainer.get<GetFileStatisticsHandler>(TYPES.GetFileStatisticsHandler);

const query = new GetFileStatisticsQuery({ userId: 'user_123' });

const result = await getFileStatisticsHandler.handle(query);

if (result.isSuccess) {
  const statistics = result.value;
  console.log('Total files:', statistics.totalFiles);
  console.log('Total size:', statistics.totalSizeFormatted);
  console.log('By type:', statistics.byType);
} else {
  console.error('Statistics failed:', result.error);
}
```

### Deleting a File

```typescript
import { DeleteFileCommand } from '@/slices/files/application/commands/delete-file-command';
import { DeleteFileHandler } from '@/slices/files/application/handlers/delete-file-handler';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { TYPES } from '@/shared/infrastructure/di/types';

const deleteFileHandler = DIContainer.get<DeleteFileHandler>(TYPES.DeleteFileHandler);

const command = new DeleteFileCommand({
  fileId: 'file_abc123',
  userId: 'user_123',
});

const result = await deleteFileHandler.handle(command);

if (result.isSuccess) {
  console.log('File deleted successfully');
} else {
  console.error('Delete failed:', result.error);
}
```

## File Type Detection

The [`FileType`](../../src/slices/files/domain/value-objects/file-type.ts) value object provides helper methods for file type detection:

```typescript
import { FileType } from '@/slices/files/domain/value-objects/file-type';

const fileTypeResult = FileType.create({ mimeType: 'application/pdf' });

if (fileTypeResult.isSuccess) {
  const fileType = fileTypeResult.value;
  
  console.log('Extension:', fileType.getExtension()); // ".pdf"
  console.log('Is image:', fileType.isImage()); // false
  console.log('Is document:', fileType.isDocument()); // true
  console.log('Is video:', fileType.isVideo()); // false
  console.log('Is audio:', fileType.isAudio()); // false
  console.log('Is archive:', fileType.isArchive()); // false
}
```

## Error Handling

All operations return a [`Result`](../../src/shared/domain/result.ts) object:

```typescript
interface Result<T> {
  readonly isSuccess: boolean;
  readonly value?: T;
  readonly error?: Error;
}
```

Always check `result.isSuccess` before accessing `result.value`:

```typescript
const result = await someHandler.handle(command);

if (result.isSuccess) {
  // Success - use result.value
  const data = result.value;
} else {
  // Failure - handle result.error
  console.error(result.error?.message);
}
```

## Testing

Example test for file operations:

```typescript
import { describe, it, expect } from '@jest/globals';
import { UploadFileCommand } from '@/slices/files/application/commands/upload-file-command';
import { UploadFileHandler } from '@/slices/files/application/handlers/upload-file-handler';

describe('Files Slice', () => {
  describe('UploadFileHandler', () => {
    it('should upload a file successfully', async () => {
      const command = new UploadFileCommand({
        filename: 'test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        url: 'https://example.com/test.pdf',
        uploadedById: 'user_123',
      });

      const result = await handler.handle(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.value?.filename).toBe('test.pdf');
    });
  });
});
```

## Best Practices

1. **File Size Validation**: Always validate file sizes before upload to prevent storage issues
2. **MIME Type Validation**: Use the [`FileType`](../../src/slices/files/domain/value-objects/file-type.ts) value object for MIME type validation
3. **Pagination**: Use pagination for large file lists to improve performance
4. **User Authorization**: Always include `userId` in operations to ensure proper authorization
5. **Error Handling**: Always check `result.isSuccess` before accessing `result.value`
6. **File Naming**: Use consistent naming conventions for files
7. **URL Updates**: Use the [`UpdateFileUrlCommand`](../../src/slices/files/application/commands/update-file-url-command.ts) for updating file URLs
8. **Bulk Operations**: Use [`DeleteManyFilesCommand`](../../src/slices/files/application/commands/delete-many-files-command.ts) for batch deletions

## Integration Checklist

- [ ] Configure file storage service (S3, Cloudinary, etc.)
- [ ] Set up file upload endpoints
- [ ] Configure file size limits
- [ ] Set up allowed MIME types
- [ ] Implement file virus scanning (if required)
- [ ] Configure CDN for file delivery
- [ ] Set up file cleanup policies
- [ ] Configure file access permissions
- [ ] Implement file versioning (if needed)
- [ ] Set up file backup strategy
