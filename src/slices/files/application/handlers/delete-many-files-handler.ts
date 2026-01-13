import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { DeleteManyFilesCommand } from '../commands/delete-many-files-command';
import type { IFileRepository } from '../../domain/repositories/file-repository';
import { FileId } from '../../domain/value-objects/file-id';

/**
 * Delete Many Files Command Handler
 * Handles delete multiple files command
 */
@injectable()
export class DeleteManyFilesHandler extends CommandHandler<DeleteManyFilesCommand, number> {
  constructor(
    @inject('FileRepository')
    private readonly fileRepository: IFileRepository
  ) {
    super();
  }

  async handle(command: DeleteManyFilesCommand): Promise<Result<number>> {
    // Validate command
    const validationResult = this.validate(command);
    if (!validationResult.isValid) {
      return Result.failure<number>(new Error(validationResult.errors.join(', ')));
    }

    // Check if files exist and belong to user
    const fileIds = command.props.fileIds.map(id => FileId.fromValue(id));
    const files = await this.fileRepository.findByIds(fileIds);
    
    // Filter files that belong to the user
    const userFiles = files.filter(file => file.uploadedById === command.props.userId);
    
    if (userFiles.length !== command.props.fileIds.length) {
      return Result.failure<number>(new Error('Some files not found or you do not have permission to delete them'));
    }

    // Delete files
    await this.fileRepository.deleteMany(userFiles.map(file => file.id));

    return Result.success(userFiles.length);
  }

  private validate(command: DeleteManyFilesCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.props.fileIds || command.props.fileIds.length === 0) {
      errors.push('File IDs are required');
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
