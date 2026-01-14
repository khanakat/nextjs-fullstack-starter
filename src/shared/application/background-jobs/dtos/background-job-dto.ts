import type { JobResult } from '../../../domain/background-jobs/entities/background-job';

/**
 * Background Job DTO
 * Data transfer object for background jobs
 */
export class BackgroundJobDto {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly queueName: string,
    public readonly status: string,
    public readonly priority: number,
    public readonly data: any,
    public readonly createdAt: string,
    public readonly result?: JobResult,
    public readonly error?: string,
    public readonly delay?: number,
    public readonly timeout?: number,
    public readonly startedAt?: string,
    public readonly completedAt?: string,
    public readonly failedAt?: string,
    public readonly nextRetryAt?: string,
    public readonly progress: number = 0,
    public readonly attempts: number = 0,
    public readonly maxAttempts: number = 3
  ) {}

  public toObject(): any {
    return {
      id: this.id,
      name: this.name,
      queueName: this.queueName,
      status: this.status,
      priority: this.priority,
      data: this.data,
      result: this.result,
      error: this.error,
      progress: this.progress,
      attempts: this.attempts,
      maxAttempts: this.maxAttempts,
      delay: this.delay,
      timeout: this.timeout,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      failedAt: this.failedAt,
      nextRetryAt: this.nextRetryAt,
      createdAt: this.createdAt,
    };
  }
}
