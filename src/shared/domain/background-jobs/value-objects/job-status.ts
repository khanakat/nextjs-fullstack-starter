import { ValueObject } from '../../base/value-object';
import { ValidationError } from '../../exceptions/validation-error';

/**
 * Job Status Enumeration
 * Represents the status of a background job
 */
export enum JobStatusEnum {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused',
}

/**
 * Job Status Value Object
 * Represents the status of a background job
 */
export class JobStatus extends ValueObject<JobStatusEnum> {
  private constructor(value: JobStatusEnum) {
    super(value);
  }

  protected validate(value: JobStatusEnum): void {
    if (!Object.values(JobStatusEnum).includes(value)) {
      throw new ValidationError('jobStatus', `Invalid job status: ${value}`);
    }
  }

  public static create(value: JobStatusEnum | string): JobStatus {
    const statusValue = typeof value === 'string'
      ? this.fromString(value)
      : value;

    return new JobStatus(statusValue);
  }

  public static fromString(value: string): JobStatusEnum {
    const upperValue = value.toUpperCase();
    if (upperValue in JobStatusEnum) {
      return JobStatusEnum[upperValue as keyof typeof JobStatusEnum];
    }
    throw new Error(`Invalid job status: ${value}`);
  }

  public static pending(): JobStatus {
    return new JobStatus(JobStatusEnum.PENDING);
  }

  public static active(): JobStatus {
    return new JobStatus(JobStatusEnum.ACTIVE);
  }

  public static completed(): JobStatus {
    return new JobStatus(JobStatusEnum.COMPLETED);
  }

  public static failed(): JobStatus {
    return new JobStatus(JobStatusEnum.FAILED);
  }

  public static delayed(): JobStatus {
    return new JobStatus(JobStatusEnum.DELAYED);
  }

  public static paused(): JobStatus {
    return new JobStatus(JobStatusEnum.PAUSED);
  }

  public getValue(): JobStatusEnum {
    return this._value;
  }

  public isPending(): boolean {
    return this._value === JobStatusEnum.PENDING;
  }

  public isActive(): boolean {
    return this._value === JobStatusEnum.ACTIVE;
  }

  public isCompleted(): boolean {
    return this._value === JobStatusEnum.COMPLETED;
  }

  public isFailed(): boolean {
    return this._value === JobStatusEnum.FAILED;
  }

  public isDelayed(): boolean {
    return this._value === JobStatusEnum.DELAYED;
  }

  public isPaused(): boolean {
    return this._value === JobStatusEnum.PAUSED;
  }
}
