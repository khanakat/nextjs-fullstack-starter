import { NextRequest, NextResponse } from 'next/server';
import { injectable } from 'inversify';
import { FileId } from '../../domain/value-objects/file-id';
import { UploadFileHandler } from '../../application/handlers/upload-file-handler';
import { DeleteFileHandler } from '../../application/handlers/delete-file-handler';
import { UpdateFileUrlHandler } from '../../application/handlers/update-file-url-handler';
import { DeleteManyFilesHandler } from '../../application/handlers/delete-many-files-handler';
import { GetFileHandler } from '../../application/handlers/get-file-handler';
import { ListFilesHandler } from '../../application/handlers/list-files-handler';
import { GetFileStatisticsHandler } from '../../application/handlers/get-file-statistics-handler';
import { UploadFileCommand } from '../../application/commands/upload-file-command';
import { DeleteFileCommand } from '../../application/commands/delete-file-command';
import { UpdateFileUrlCommand } from '../../application/commands/update-file-url-command';
import { DeleteManyFilesCommand } from '../../application/commands/delete-many-files-command';
import { GetFileQuery } from '../../application/queries/get-file-query';
import { ListFilesQuery } from '../../application/queries/list-files-query';
import { GetFileStatisticsQuery } from '../../application/queries/get-file-statistics-query';

/**
 * Files API Route
 * Handles HTTP requests for file operations
 * 
 * Endpoints:
 * - GET /api/files - List files with filtering and pagination
 * - GET /api/files/[id] - Get file by ID
 * - GET /api/files/statistics - Get file statistics
 * - POST /api/files - Upload file
 * - PATCH /api/files/[id] - Update file URL
 * - DELETE /api/files/[id] - Delete file
 * - DELETE /api/files - Delete multiple files
 */
@injectable()
export class FilesApiRoute {
  constructor(
    private readonly uploadFileHandler: UploadFileHandler,
    private readonly deleteFileHandler: DeleteFileHandler,
    private readonly updateFileUrlHandler: UpdateFileUrlHandler,
    private readonly deleteManyFilesHandler: DeleteManyFilesHandler,
    private readonly getFileHandler: GetFileHandler,
    private readonly listFilesHandler: ListFilesHandler,
    private readonly getFileStatisticsHandler: GetFileStatisticsHandler
  ) {}

  /**
   * GET /api/files
   * List files with optional filtering and pagination
   */
  async list(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');
      const mimeType = searchParams.get('mimeType');
      const minSize = searchParams.get('minSize');
      const maxSize = searchParams.get('maxSize');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const searchTerm = searchParams.get('search');
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

      // If statistics requested
      if (searchParams.get('statistics') === 'true') {
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for statistics' },
            { status: 400 }
          );
        }

        const query = new GetFileStatisticsQuery({ userId });
        const result = await this.getFileStatisticsHandler.handle(query);

        if (!result.isSuccess) {
          return NextResponse.json(
            { error: result.error?.message || 'Failed to get statistics' },
            { status: 400 }
          );
        }

        return NextResponse.json(result.value?.toObject() || {});
      }

      // Calculate limit and offset from page and pageSize
      const limit = pageSize;
      const offset = (page - 1) * pageSize;

      // List files
      const listQuery = new ListFilesQuery({
        userId: userId || '',
        limit,
        offset,
        mimeType: mimeType || undefined,
        minSize: minSize ? parseInt(minSize, 10) : undefined,
        maxSize: maxSize ? parseInt(maxSize, 10) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        searchTerm: searchTerm || undefined,
      });

      const result = await this.listFilesHandler.handle(listQuery);

      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to list files' },
          { status: 400 }
        );
      }

      return NextResponse.json(result.value?.toObject() || {});
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/files
   * Upload a new file
   */
  async upload(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      const command = new UploadFileCommand({
        filename: body.filename,
        originalName: body.originalName,
        mimeType: body.mimeType,
        size: body.size,
        url: body.url,
        uploadedById: body.uploadedById,
      });

      const result = await this.uploadFileHandler.handle(command);

      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to upload file' },
          { status: 400 }
        );
      }

      return NextResponse.json(result.value?.toObject() || {}, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /api/files
   * Delete multiple files
   */
  async deleteMany(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const ids = searchParams.get('ids');
      const userId = searchParams.get('userId');

      if (!ids) {
        return NextResponse.json(
          { error: 'ids parameter is required' },
          { status: 400 }
        );
      }

      if (!userId) {
        return NextResponse.json(
          { error: 'userId parameter is required' },
          { status: 400 }
        );
      }

      const fileIdStrings = ids.split(',');
      const fileIds = fileIdStrings.map((id) => FileId.fromValue(id).value);

      const command = new DeleteManyFilesCommand({ fileIds, userId });
      const result = await this.deleteManyFilesHandler.handle(command);

      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to delete files' },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/files/[id]
   * Get a single file by ID
   */
  async get(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');

      if (!userId) {
        return NextResponse.json(
          { error: 'userId is required' },
          { status: 400 }
        );
      }

      const fileId = FileId.fromValue(id);
      const query = new GetFileQuery({ fileId: fileId.value, userId });

      const result = await this.getFileHandler.handle(query);

      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to get file' },
          { status: 400 }
        );
      }

      if (!result.value) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(result.value.toObject());
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * PATCH /api/files/[id]
   * Update file URL
   */
  async updateUrl(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const fileId = FileId.fromValue(id);

      const command = new UpdateFileUrlCommand({
        fileId: fileId.value,
        url: body.url,
        userId: body.userId,
      });

      const result = await this.updateFileUrlHandler.handle(command);

      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to update file' },
          { status: 400 }
        );
      }

      return NextResponse.json(result.value?.toObject() || {});
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /api/files/[id]
   * Delete a single file by ID
   */
  async delete(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const fileId = FileId.fromValue(id);

      const command = new DeleteFileCommand({
        fileId: fileId.value,
        userId: body.userId,
      });

      const result = await this.deleteFileHandler.handle(command);

      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to delete file' },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}

/**
 * Next.js API route handler
 * This is actual function that Next.js will call
 */
export async function GET(request: NextRequest, { params }: { params: { id?: string } }) {
  const apiRoute = new FilesApiRoute(
    // These would be injected by DI container in a real implementation
    {} as any, // uploadFileHandler
    {} as any, // deleteFileHandler
    {} as any, // updateFileUrlHandler
    {} as any, // deleteManyFilesHandler
    {} as any, // getFileHandler
    {} as any, // listFilesHandler
    {} as any, // getFileStatisticsHandler
  );

  if (params?.id) {
    // Get single file
    return await apiRoute.get(request, params.id);
  }

  // List files
  return await apiRoute.list(request);
}

export async function POST(request: NextRequest) {
  const apiRoute = new FilesApiRoute(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  return await apiRoute.upload(request);
}

export async function PATCH(request: NextRequest, { params }: { params: { id?: string } }) {
  const apiRoute = new FilesApiRoute(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  if (params?.id) {
    // Update file URL
    return await apiRoute.updateUrl(request, params.id);
  }

  return NextResponse.json(
    { error: 'Invalid request' },
    { status: 400 }
  );
}

export async function DELETE(request: NextRequest, { params }: { params: { id?: string } }) {
  const apiRoute = new FilesApiRoute(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  const { searchParams } = new URL(request.url);
  if (params?.id) {
    // Delete single file
    return await apiRoute.delete(request, params.id);
  }

  // Delete multiple files
  return await apiRoute.deleteMany(request);
}

// Export route handlers for Next.js with renamed exports to avoid conflicts
export const UploadFile = POST;
export const ListFiles = GET;
export const GetFile = GET;
export const UpdateFile = PATCH;
export const DeleteFile = DELETE;
