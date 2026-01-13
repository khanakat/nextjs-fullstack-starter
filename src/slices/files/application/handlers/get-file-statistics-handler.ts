import { injectable, inject } from 'inversify';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { GetFileStatisticsQuery } from '../queries/get-file-statistics-query';
import type { IFileRepository } from '../../domain/repositories/file-repository';
import { FileStatisticsDto } from '../dtos/file-statistics-dto';

/**
 * Get File Statistics Query Handler
 * Handles get file statistics query
 */
@injectable()
export class GetFileStatisticsHandler extends QueryHandler<GetFileStatisticsQuery, FileStatisticsDto> {
  constructor(
    @inject('FileRepository')
    private readonly fileRepository: IFileRepository
  ) {
    super();
  }

  async handle(query: GetFileStatisticsQuery): Promise<Result<FileStatisticsDto>> {
    // Validate query
    const validationResult = this.validate(query);
    if (!validationResult.isValid) {
      return Result.failure<FileStatisticsDto>(new Error(validationResult.errors.join(', ')));
    }

    // Get statistics
    const statistics = await this.fileRepository.getStatistics(query.props.userId);

    // Return DTO
    return Result.success(new FileStatisticsDto({
      totalFiles: statistics.totalFiles,
      totalSize: statistics.totalSize,
      totalSizeFormatted: this.formatBytes(statistics.totalSize),
      byType: statistics.byType,
    }));
  }

  private validate(query: GetFileStatisticsQuery): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!query.props.userId || query.props.userId.trim() === '') {
      errors.push('User ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    const formatted = value.toFixed(2);
    return `${formatted} ${sizes[i]}`;
  }
}
