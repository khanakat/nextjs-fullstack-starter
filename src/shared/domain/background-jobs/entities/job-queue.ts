import { Entity } from '../../base/entity';
import { UniqueId } from '../../value-objects/unique-id';
import { JobPriority } from '../value-objects/job-priority';

/**
 * Job Queue Entity
 * Represents a queue for managing background jobs
 */
export class JobQueue extends Entity<UniqueId> {
  private _name: string;
  private _description?: string;
  private _defaultPriority: JobPriority;
  private _concurrency: number;
  private _maxRetries: number;
  private _defaultTimeout?: number;
  private _defaultDelay?: number;
  private _isActive: boolean;
  private _paused: boolean;
  private _jobCount: number;
  private _completedCount: number;
  private _failedCount: number;

  private readonly _createdAt: Date;

  constructor(
    id: UniqueId,
    name: string,
    description?: string,
    defaultPriority: JobPriority = JobPriority.normal(),
    concurrency: number = 5,
    maxRetries: number = 3,
    defaultTimeout?: number,
    defaultDelay?: number
  ) {
    super(id);
    this._name = name;
    this._description = description;
    this._defaultPriority = defaultPriority;
    this._concurrency = concurrency;
    this._maxRetries = maxRetries;
    this._defaultTimeout = defaultTimeout;
    this._defaultDelay = defaultDelay;
    this._isActive = true;
    this._paused = false;
    this._jobCount = 0;
    this._completedCount = 0;
    this._failedCount = 0;
    this._createdAt = new Date();
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get name(): string {
    return this._name;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public get defaultPriority(): JobPriority {
    return this._defaultPriority;
  }

  public get concurrency(): number {
    return this._concurrency;
  }

  public get maxRetries(): number {
    return this._maxRetries;
  }

  public get defaultTimeout(): number | undefined {
    return this._defaultTimeout;
  }

  public get defaultDelay(): number | undefined {
    return this._defaultDelay;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get isPaused(): boolean {
    return this._paused;
  }

  public get jobCount(): number {
    return this._jobCount;
  }

  public get completedCount(): number {
    return this._completedCount;
  }

  public get failedCount(): number {
    return this._failedCount;
  }

  public get pendingCount(): number {
    return this._jobCount - this._completedCount - this._failedCount;
  }

  public get successRate(): number {
    if (this._completedCount + this._failedCount === 0) {
      return 0;
    }
    return (this._completedCount / (this._completedCount + this._failedCount)) * 100;
  }

  public setDescription(description: string): void {
    this._description = description;
  }

  public setDefaultPriority(priority: JobPriority): void {
    this._defaultPriority = priority;
  }

  public setConcurrency(concurrency: number): void {
    if (concurrency < 1) {
      throw new Error('Concurrency must be at least 1');
    }
    this._concurrency = concurrency;
  }

  public setMaxRetries(maxRetries: number): void {
    if (maxRetries < 0) {
      throw new Error('Max retries cannot be negative');
    }
    this._maxRetries = maxRetries;
  }

  public setDefaultTimeout(timeout?: number): void {
    if (timeout !== undefined && timeout < 0) {
      throw new Error('Timeout cannot be negative');
    }
    this._defaultTimeout = timeout;
  }

  public setDefaultDelay(delay?: number): void {
    if (delay !== undefined && delay < 0) {
      throw new Error('Delay cannot be negative');
    }
    this._defaultDelay = delay;
  }

  public activate(): void {
    this._isActive = true;
  }

  public deactivate(): void {
    this._isActive = false;
  }

  public pause(): void {
    this._paused = true;
  }

  public resume(): void {
    this._paused = false;
  }

  public incrementJobCount(): void {
    this._jobCount++;
  }

  public incrementCompletedCount(): void {
    this._completedCount++;
  }

  public incrementFailedCount(): void {
    this._failedCount++;
  }

  public getStatistics(): any {
    return {
      name: this._name,
      jobCount: this._jobCount,
      completedCount: this._completedCount,
      failedCount: this._failedCount,
      pendingCount: this.pendingCount,
      successRate: this.successRate,
      isActive: this._isActive,
      isPaused: this._paused,
      concurrency: this._concurrency,
      maxRetries: this._maxRetries,
    };
  }

  public toObject(): any {
    return {
      id: this._id.getValue(),
      name: this._name,
      description: this._description,
      defaultPriority: this._defaultPriority.getValue(),
      concurrency: this._concurrency,
      maxRetries: this._maxRetries,
      defaultTimeout: this._defaultTimeout,
      defaultDelay: this._defaultDelay,
      isActive: this._isActive,
      isPaused: this._paused,
      statistics: this.getStatistics(),
      createdAt: this.createdAt.toISOString(),
    };
  }
}
