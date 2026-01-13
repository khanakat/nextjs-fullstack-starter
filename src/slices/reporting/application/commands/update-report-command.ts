import { Command } from '../../../../shared/application/base/command';
import { ReportConfigDto } from '../dtos/report-dto';

/**
 * Command to update an existing report
 */
export class UpdateReportCommand extends Command {
  public readonly reportId: string;
  public readonly title?: string;
  public readonly description?: string;
  public readonly config?: ReportConfigDto;
  public readonly status?: string;
  public readonly isPublic?: boolean;

  constructor(
    reportIdOrInput:
      | string
      | {
          id?: string;
          updatedBy?: string;
          userId?: string;
          title?: string;
          description?: string;
          config?: ReportConfigDto;
          status?: string | { toString: () => string };
          isPublic?: boolean;
        },
    userId?: string,
    title?: string,
    description?: string,
    config?: ReportConfigDto,
    status?: string | boolean | { toString: () => string },
    isPublic?: boolean
  ) {
    // Normalize inputs: support both object-style and positional arguments
    if (typeof reportIdOrInput === 'object' && reportIdOrInput !== null && userId === undefined) {
      const input = reportIdOrInput;
      const normalizedUserId = input.updatedBy ?? input.userId;
      super(normalizedUserId);
      this.reportId = (input.id ?? '').toString();
      this.title = input.title;
      this.description = input.description;
      this.config = input.config;
      // Normalize status to string if VO-like provided
      const rawStatus = input.status as any;
      this.status = rawStatus == null
        ? undefined
        : typeof rawStatus === 'string'
          ? rawStatus
          : typeof rawStatus?.toString === 'function'
            ? rawStatus.toString()
            : (rawStatus as string);
      this.isPublic = input.isPublic;
    } else {
      super(userId);
      this.reportId = reportIdOrInput as string;
      this.title = title;
      this.description = description;
      this.config = config;
      // Support both parameter orders:
      // - Some callers pass isPublic as the 6th argument (boolean)
      // - Others pass status as the 6th and isPublic as the 7th
      if (typeof status === 'boolean' && isPublic === undefined) {
        this.isPublic = status as unknown as boolean;
        this.status = undefined;
      } else {
        const rawStatus = status as any;
        this.status = rawStatus == null
          ? undefined
          : typeof rawStatus === 'string'
            ? rawStatus
            : typeof rawStatus?.toString === 'function'
              ? rawStatus.toString()
              : (rawStatus as string);
        this.isPublic = isPublic;
      }
    }
  }

  public validate(): void {
    super.validate();
    
    if (!this.reportId || this.reportId.trim().length === 0) {
      throw new Error('Report ID is required');
    }

    if (!this.userId) {
      throw new Error('User ID is required');
    }

    if (this.title !== undefined) {
      if (!this.title || this.title.trim().length === 0) {
        throw new Error('Report title cannot be empty');
      }

      if (this.title.length > 200) {
        throw new Error('Report title cannot exceed 200 characters');
      }
    }

    if (this.description !== undefined && this.description && this.description.length > 1000) {
      throw new Error('Report description cannot exceed 1000 characters');
    }

    if (this.status !== undefined) {
      const validStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
      const normalized = this.status.toString().toUpperCase();
      if (!validStatuses.includes(normalized)) {
        throw new Error('Invalid report status');
      }
    }

    if (this.isPublic !== undefined && typeof this.isPublic !== 'boolean') {
      throw new Error('Invalid isPublic value');
    }

    // At least one field must be provided for update
    if (this.title === undefined && 
        this.description === undefined && 
        this.config === undefined && 
        this.status === undefined &&
        this.isPublic === undefined) {
      throw new Error('At least one field must be provided for update');
    }
  }
}