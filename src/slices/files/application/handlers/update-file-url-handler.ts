import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { UpdateFileUrlCommand } from '../commands/update-file-url-command';
import type { IFileRepository } from '../../domain/repositories/file-repository';
import { FileId } from '../../domain/value-objects/file-id';
import { File } from '../../domain/entities/file';
import { FileDto } from '../dtos/file-dto';

/**
 * Update File URL Command Handler
 * Handles update file URL command
 */
@injectable()
export class UpdateFileUrlHandler extends CommandHandler<UpdateFileUrlCommand, FileDto> {
  constructor(
    @inject('FileRepository')
    private readonly fileRepository: IFileRepository
  ) {
    super();
  }

  async handle(command: UpdateFileUrlCommand): Promise<Result<FileDto>> {
    // Validate command
    const validationResult = this.validate(command);
    if (!validationResult.isValid) {
      return Result.failure<FileDto>(new Error(validationResult.errors.join(', ')));
    }

    // Check if file exists
    const file = await this.fileRepository.findById(
      FileId.fromValue(command.props.fileId)
    );

    if (!file) {
      return Result.failure<FileDto>(new Error('File not found'));
    }

    // Check if user owns the file
    if (file.uploadedById !== command.props.userId) {
      return Result.failure<FileDto>(new Error('You do not have permission to update this file'));
    }

    // Update file URL
    file.updateUrl(command.props.url);
    const updatedFile = await this.fileRepository.updateUrl(file.id, command.props.url);

    // Return DTO
    return Result.success(this.toDto(updatedFile));
  }

  private validate(command: UpdateFileUrlCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.props.fileId || command.props.fileId.trim() === '') {
      errors.push('File ID is required');
    }

    if (!command.props.url || command.props.url.trim() === '') {
      errors.push('URL is required');
    }

    if (!command.props.userId || command.props.userId.trim() === '') {
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
