/**
 * Job Queue DTO
 * Data transfer object for job queues
 */
export class JobQueueDto {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly createdAt: string,
    public readonly defaultPriority: number,
    public readonly concurrency: number,
    public readonly maxRetries: number,
    public readonly isActive: boolean,
    public readonly isPaused: boolean,
    public readonly jobCount: number,
    public readonly completedCount: number,
    public readonly failedCount: number,
    public readonly pendingCount: number,
    public readonly successRate: number,
    public readonly description?: string,
    public readonly defaultTimeout?: number,
    public readonly defaultDelay?: number
  ) {}

  public toObject(): any {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      defaultPriority: this.defaultPriority,
      concurrency: this.concurrency,
      maxRetries: this.maxRetries,
      defaultTimeout: this.defaultTimeout,
      defaultDelay: this.defaultDelay,
      isActive: this.isActive,
      isPaused: this.isPaused,
      jobCount: this.jobCount,
      completedCount: this.completedCount,
      failedCount: this.failedCount,
      pendingCount: this.pendingCount,
      successRate: this.successRate,
      createdAt: this.createdAt,
    };
  }
}
