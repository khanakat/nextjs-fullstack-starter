import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { DeleteFileCommand } from '../commands/delete-file-command';
import type { IFileRepository } from '../../domain/repositories/file-repository';
import { FileId } from '../../domain/value-objects/file-id';

/**
 * Delete File Command Handler
 * Handles delete file command
 */
@injectable()
export class DeleteFileHandler extends CommandHandler<DeleteFileCommand, void> {
  constructor(
    @inject('FileRepository')
    private readonly fileRepository: IFileRepository
  ) {
    super();
  }

  async handle(command: DeleteFileCommand): Promise<Result<void>> {
    // Validate command
    const validationResult = this.validate(command);
    if (!validationResult.isValid) {
      return Result.failure<void>(new Error(validationResult.errors.join(', ')));
    }

    // Check if file exists
    const file = await this.fileRepository.findById(
      FileId.fromValue(command.props.fileId)
    );

    if (!file) {
      return Result.failure<void>(new Error('File not found'));
    }

    // Check if user owns the file
    if (file.uploadedById !== command.props.userId) {
      return Result.failure<void>(new Error('You do not have permission to delete this file'));
    }

    // Delete file
    await this.fileRepository.delete(file.id);

    return Result.success(undefined);
  }

  private validate(command: DeleteFileCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.props.fileId || command.props.fileId.trim() === '') {
      errors.push('File ID is required');
    }

    if (!command.props.userId || command.props.userId.trim() === '') {
      errors.push('User ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
