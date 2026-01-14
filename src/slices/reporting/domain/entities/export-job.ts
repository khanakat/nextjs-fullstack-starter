import { Entity } from '../../../../shared/domain/entities/entity';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

export enum ExportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  JSON = 'JSON',
  HTML = 'HTML',
  PNG = 'PNG',
}

export enum ExportJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface ExportJobProps {
  id?: UniqueId;
  reportId: string;
  format: ExportFormat;
  status: ExportJobStatus;
  userId: string;
  organizationId?: string;
  options?: string;
  filePath?: string;
  downloadUrl?: string;
  fileUrl?: string;
  fileSize?: number;
  errorMessage?: string;
  queueJobId?: string;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ExportJob extends Entity<ExportJobProps> {
  private readonly reportId: string;
  private readonly format: ExportFormat;
  private status: ExportJobStatus;
  private readonly userId: string;
  private readonly organizationId?: string;
  private options?: string;
  private filePath?: string;
  private downloadUrl?: string;
  private fileUrl?: string;
  private fileSize?: number;
  private errorMessage?: string;
  private queueJobId?: string;
  private completedAt?: Date;

  private constructor(props: ExportJobProps) {
    super(props.id || UniqueId.generate());
    this.reportId = props.reportId;
    this.format = props.format;
    this.status = props.status;
    this.userId = props.userId;
    this.organizationId = props.organizationId;
    this.options = props.options;
    this.filePath = props.filePath;
    this.downloadUrl = props.downloadUrl;
    this.fileUrl = props.fileUrl;
    this.fileSize = props.fileSize;
    this.errorMessage = props.errorMessage;
    this.queueJobId = props.queueJobId;
    this.completedAt = props.completedAt;
  }

  static create(props: ExportJobProps): ExportJob {
    return new ExportJob(props);
  }

  // Getters
  getReportId(): string {
    return this.reportId;
  }

  getFormat(): ExportFormat {
    return this.format;
  }

  getStatus(): ExportJobStatus {
    return this.status;
  }

  getUserId(): string {
    return this.userId;
  }

  getOrganizationId(): string | undefined {
    return this.organizationId;
  }

  getOptions(): string | undefined {
    return this.options;
  }

  getFilePath(): string | undefined {
    return this.filePath;
  }

  getDownloadUrl(): string | undefined {
    return this.downloadUrl;
  }

  getFileUrl(): string | undefined {
    return this.fileUrl;
  }

  getFileSize(): number | undefined {
    return this.fileSize;
  }

  getErrorMessage(): string | undefined {
    return this.errorMessage;
  }

  getQueueJobId(): string | undefined {
    return this.queueJobId;
  }

  getCompletedAt(): Date | undefined {
    return this.completedAt;
  }

  // Business logic methods
  canBeCancelled(): boolean {
    return [ExportJobStatus.PENDING, ExportJobStatus.PROCESSING].includes(this.status);
  }

  canBeRetried(): boolean {
    return this.status === ExportJobStatus.FAILED;
  }

  canBeDeleted(): boolean {
    return this.status !== ExportJobStatus.PROCESSING;
  }

  cancel(): void {
    if (!this.canBeCancelled()) {
      throw new Error(`Cannot cancel export job in status: ${this.status}`);
    }
    this.status = ExportJobStatus.CANCELLED;
    this.completedAt = new Date();
  }

  retry(): void {
    if (!this.canBeRetried()) {
      throw new Error(`Cannot retry export job in status: ${this.status}`);
    }
    this.status = ExportJobStatus.PENDING;
    this.errorMessage = undefined;
    this.downloadUrl = undefined;
    this.fileUrl = undefined;
    this.completedAt = undefined;
  }

  markAsProcessing(): void {
    if (this.status !== ExportJobStatus.PENDING) {
      throw new Error(`Cannot mark export job as processing from status: ${this.status}`);
    }
    this.status = ExportJobStatus.PROCESSING;
  }

  markAsCompleted(fileUrl: string, fileSize?: number): void {
    if (this.status !== ExportJobStatus.PROCESSING) {
      throw new Error(`Cannot mark export job as completed from status: ${this.status}`);
    }
    this.status = ExportJobStatus.COMPLETED;
    this.fileUrl = fileUrl;
    this.downloadUrl = fileUrl;
    this.fileSize = fileSize;
    this.completedAt = new Date();
  }

  markAsFailed(error: string): void {
    if (this.status !== ExportJobStatus.PROCESSING) {
      throw new Error(`Cannot mark export job as failed from status: ${this.status}`);
    }
    this.status = ExportJobStatus.FAILED;
    this.errorMessage = error;
    this.completedAt = new Date();
  }

  setQueueJobId(queueJobId: string): void {
    this.queueJobId = queueJobId;
  }

  toPrimitives(): Record<string, any> {
    return {
      id: this.id.toString(),
      reportId: this.reportId,
      format: this.format,
      status: this.status,
      userId: this.userId,
      organizationId: this.organizationId,
      options: this.options,
      filePath: this.filePath,
      downloadUrl: this.downloadUrl,
      fileUrl: this.fileUrl,
      fileSize: this.fileSize,
      errorMessage: this.errorMessage,
      queueJobId: this.queueJobId,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
