import { injectable, inject } from 'inversify';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { GetFileQuery } from '../queries/get-file-query';
import type { IFileRepository } from '../../domain/repositories/file-repository';
import { FileId } from '../../domain/value-objects/file-id';
import { File } from '../../domain/entities/file';
import { FileDto } from '../dtos/file-dto';

/**
 * Get File Query Handler
 * Handles get file query
 */
@injectable()
export class GetFileHandler extends QueryHandler<GetFileQuery, FileDto> {
  constructor(
    @inject('FileRepository')
    private readonly fileRepository: IFileRepository
  ) {
    super();
  }

  async handle(query: GetFileQuery): Promise<Result<FileDto>> {
    // Validate query
    const validationResult = this.validate(query);
    if (!validationResult.isValid) {
      return Result.failure<FileDto>(new Error(validationResult.errors.join(', ')));
    }

    // Get file
    const file = await this.fileRepository.findById(
      FileId.fromValue(query.props.fileId)
    );

    if (!file) {
      return Result.failure<FileDto>(new Error('File not found'));
    }

    // Check if user owns the file
    if (file.uploadedById !== query.props.userId) {
      return Result.failure<FileDto>(new Error('You do not have permission to access this file'));
    }

    // Return DTO
    return Result.success(this.toDto(file));
  }

  private validate(query: GetFileQuery): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!query.props.fileId || query.props.fileId.trim() === '') {
      errors.push('File ID is required');
    }

    if (!query.props.userId || query.props.userId.trim() === '') {
      errors.push('User ID is required');
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
