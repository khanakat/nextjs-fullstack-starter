import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { UploadFileCommand } from '../commands/upload-file-command';
import type { IFileRepository } from '../../domain/repositories/file-repository';
import { File } from '../../domain/entities/file';
import { FileDto } from '../dtos/file-dto';

/**
 * Upload File Command Handler
 * Handles upload file command
 */
@injectable()
export class UploadFileHandler extends CommandHandler<UploadFileCommand, FileDto> {
  constructor(
    @inject('FileRepository')
    private readonly fileRepository: IFileRepository
  ) {
    super();
  }

  async handle(command: UploadFileCommand): Promise<Result<FileDto>> {
    // Validate command
    const validationResult = this.validate(command);
    if (!validationResult.isValid) {
      return Result.failure<FileDto>(new Error(validationResult.errors.join(', ')));
    }

    // Create file entity
    const file = File.create({
      filename: command.props.filename,
      originalName: command.props.originalName,
      mimeType: command.props.mimeType,
      size: command.props.size,
      url: command.props.url,
      uploadedById: command.props.uploadedById,
    });

    // Save file
    const createdFile = await this.fileRepository.create(file);

    // Return DTO
    return Result.success(this.toDto(createdFile));
  }

  private validate(command: UploadFileCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.props.filename || command.props.filename.trim() === '') {
      errors.push('Filename is required');
    }

    if (!command.props.originalName || command.props.originalName.trim() === '') {
      errors.push('Original name is required');
    }

    if (!command.props.mimeType || command.props.mimeType.trim() === '') {
      errors.push('MIME type is required');
    }

    if (command.props.size === undefined || command.props.size === null || command.props.size < 0) {
      errors.push('Size is required and must be non-negative');
    }

    if (!command.props.url || command.props.url.trim() === '') {
      errors.push('URL is required');
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
