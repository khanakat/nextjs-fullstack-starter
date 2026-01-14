import { Entity } from '../../base/entity';
import { JobId } from '../value-objects/job-id';
import { JobStatus } from '../value-objects/job-status';
import { JobPriority } from '../value-objects/job-priority';
import { UniqueId } from '../../value-objects/unique-id';

export interface JobData {
  [key: string]: any;
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Background Job Entity
 * Represents a background job in the system
 */
export class BackgroundJob extends Entity<JobId> {
  private _name: string;
  private _status: JobStatus;
  private _priority: JobPriority;
  private _data: JobData;
  private _result?: JobResult;
  private _error?: string;
  private _progress: number;
  private _attempts: number;
  private _maxAttempts: number;
  private _delay?: number;
  private _timeout?: number;
  private _startedAt?: Date;
  private _completedAt?: Date;
  private _failedAt?: Date;
  private _nextRetryAt?: Date;
  private _queueName: string;

  private readonly _createdAt: Date;

  constructor(
    id: JobId,
    name: string,
    queueName: string,
    data: JobData,
    priority: JobPriority = JobPriority.normal(),
    maxAttempts: number = 3,
    delay?: number,
    timeout?: number
  ) {
    super(id);
    this._name = name;
    this._queueName = queueName;
    this._data = data;
    this._priority = priority;
    this._status = JobStatus.pending();
    this._progress = 0;
    this._attempts = 0;
    this._maxAttempts = maxAttempts;
    this._delay = delay;
    this._timeout = timeout;
    this._createdAt = new Date();
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get name(): string {
    return this._name;
  }

  public get queueName(): string {
    return this._queueName;
  }

  public get status(): JobStatus {
    return this._status;
  }

  public get priority(): JobPriority {
    return this._priority;
  }

  public get data(): JobData {
    return this._data;
  }

  public get result(): JobResult | undefined {
    return this._result;
  }

  public get error(): string | undefined {
    return this._error;
  }

  public get progress(): number {
    return this._progress;
  }

  public get attempts(): number {
    return this._attempts;
  }

  public get maxAttempts(): number {
    return this._maxAttempts;
  }

  public get delay(): number | undefined {
    return this._delay;
  }

  public get timeout(): number | undefined {
    return this._timeout;
  }

  public get startedAt(): Date | undefined {
    return this._startedAt;
  }

  public get completedAt(): Date | undefined {
    return this._completedAt;
  }

  public get failedAt(): Date | undefined {
    return this._failedAt;
  }

  public get nextRetryAt(): Date | undefined {
    return this._nextRetryAt;
  }

  public start(): void {
    if (this._status.isActive()) {
      return;
    }
    this._status = JobStatus.active();
    this._startedAt = new Date();
    this._attempts++;
  }

  public complete(result?: JobResult): void {
    if (!this._status.isActive()) {
      return;
    }
    this._status = JobStatus.completed();
    this._completedAt = new Date();
    this._progress = 100;
    this._result = result;
  }

  public fail(error: string): void {
    if (!this._status.isActive()) {
      return;
    }

    if (this._attempts < this._maxAttempts) {
      // Schedule retry
      this._status = JobStatus.delayed();
      this._failedAt = new Date();
      this._error = error;
      this._calculateNextRetry();
    } else {
      // Mark as permanently failed
      this._status = JobStatus.failed();
      this._failedAt = new Date();
      this._error = error;
    }
  }

  public updateProgress(progress: number): void {
    if (progress < 0) {
      progress = 0;
    }
    if (progress > 100) {
      progress = 100;
    }
    this._progress = progress;
  }

  public pause(): void {
    if (this._status.isActive() || this._status.isDelayed()) {
      this._status = JobStatus.paused();
    }
  }

  public resume(): void {
    if (this._status.isPaused()) {
      this._status = JobStatus.active();
    }
  }

  public retry(): void {
    if (this._status.isFailed() || this._status.isDelayed()) {
      this._status = JobStatus.pending();
      this._error = undefined;
      this._nextRetryAt = undefined;
    }
  }

  public canRetry(): boolean {
    return this._attempts < this._maxAttempts;
  }

  public isRunning(): boolean {
    return this._status.isActive();
  }

  public isCompleted(): boolean {
    return this._status.isCompleted();
  }

  public isFailed(): boolean {
    return this._status.isFailed();
  }

  public isDelayed(): boolean {
    return this._status.isDelayed();
  }

  public isPaused(): boolean {
    return this._status.isPaused();
  }

  private _calculateNextRetry(): void {
    // Exponential backoff: delay = baseDelay * (2 ^ (attempts - 1))
    const baseDelay = this._delay || 5000; // 5 seconds default
    const retryDelay = baseDelay * Math.pow(2, this._attempts - 1);
    this._nextRetryAt = new Date(Date.now() + retryDelay);
  }

  public toObject(): any {
    return {
      id: this._id.getValue(),
      name: this._name,
      queueName: this._queueName,
      status: this._status.getValue(),
      priority: this._priority.getValue(),
      data: this._data,
      result: this._result,
      error: this._error,
      progress: this._progress,
      attempts: this._attempts,
      maxAttempts: this._maxAttempts,
      delay: this._delay,
      timeout: this._timeout,
      startedAt: this._startedAt?.toISOString(),
      completedAt: this._completedAt?.toISOString(),
      failedAt: this._failedAt?.toISOString(),
      nextRetryAt: this._nextRetryAt?.toISOString(),
      createdAt: this._createdAt.toISOString(),
    };
  }
}
