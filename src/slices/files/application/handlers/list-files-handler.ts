import { injectable, inject } from 'inversify';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { ListFilesQuery } from '../queries/list-files-query';
import type { IFileRepository } from '../../domain/repositories/file-repository';
import { File } from '../../domain/entities/file';
import { FileDto } from '../dtos/file-dto';
import { PaginatedFilesDto } from '../dtos/paginated-files-dto';

/**
 * List Files Query Handler
 * Handles list files query
 */
@injectable()
export class ListFilesHandler extends QueryHandler<ListFilesQuery, PaginatedFilesDto> {
  constructor(
    @inject('FileRepository')
    private readonly fileRepository: IFileRepository
  ) {
    super();
  }

  async handle(query: ListFilesQuery): Promise<Result<PaginatedFilesDto>> {
    // Validate query
    const validationResult = this.validate(query);
    if (!validationResult.isValid) {
      return Result.failure<PaginatedFilesDto>(new Error(validationResult.errors.join(', ')));
    }

    // Get files with pagination
    const limit = query.props.limit || 20;
    const offset = query.props.offset || 0;
    const page = Math.floor(offset / limit) + 1;
    const pageSize = limit;

    const result = await this.fileRepository.findByUserIdPaginated(
      query.props.userId,
      pageSize,
      offset
    );

    // Filter files based on criteria
    let filteredFiles = result.files;

    if (query.props.mimeType) {
      filteredFiles = filteredFiles.filter(file => file.mimeType.value === query.props.mimeType);
    }

    if (query.props.minSize !== undefined) {
      filteredFiles = filteredFiles.filter(file => file.size >= query.props.minSize!);
    }

    if (query.props.maxSize !== undefined) {
      filteredFiles = filteredFiles.filter(file => file.size <= query.props.maxSize!);
    }

    if (query.props.startDate) {
      filteredFiles = filteredFiles.filter(file => file.createdAt >= query.props.startDate!);
    }

    if (query.props.endDate) {
      filteredFiles = filteredFiles.filter(file => file.createdAt <= query.props.endDate!);
    }

    if (query.props.searchTerm) {
      const searchTerm = query.props.searchTerm.toLowerCase();
      filteredFiles = filteredFiles.filter(file =>
        file.filename.toLowerCase().includes(searchTerm) ||
        file.originalName.toLowerCase().includes(searchTerm)
      );
    }

    // Return DTO
    return Result.success(new PaginatedFilesDto({
      files: filteredFiles.map(file => this.toDto(file)),
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    }));
  }

  private validate(query: ListFilesQuery): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!query.props.userId || query.props.userId.trim() === '') {
      errors.push('User ID is required');
    }

    if (query.props.limit !== undefined && query.props.limit < 1) {
      errors.push('Limit must be at least 1');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private toDto(file: File): FileDto {
    return new FileDto({
      id: file.id.value,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType.value,
      size: file.size,
      url: file.url,
      uploadedById: file.uploadedById,
      createdAt: file.createdAt,
      extension: file.getExtension(),
      isImage: file.isImage(),
      isVideo: file.isVideo(),
      isAudio: file.isAudio(),
      isDocument: file.isDocument(),
      isArchive: file.isArchive(),
      formattedSize: file.getFormattedSize(),
    });
  }
}
