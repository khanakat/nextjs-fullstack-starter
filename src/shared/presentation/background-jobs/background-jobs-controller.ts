import { BaseController } from '../api/base-controller';
import { Result } from '../../application/base/result';
import { BackgroundJobDto } from '../../application/background-jobs/dtos/background-job-dto';
import { JobQueueDto } from '../../application/background-jobs/dtos/job-queue-dto';
import { CreateQueueCommand } from '../../application/background-jobs/commands/create-queue-command';
import { CreateJobCommand } from '../../application/background-jobs/commands/create-job-command';
import { RetryJobCommand } from '../../application/background-jobs/commands/retry-job-command';
import { DeleteJobCommand } from '../../application/background-jobs/commands/delete-job-command';
import { DeleteQueueCommand } from '../../application/background-jobs/commands/delete-queue-command';
import { PauseQueueCommand } from '../../application/background-jobs/commands/pause-queue-command';
import { ResumeQueueCommand } from '../../application/background-jobs/commands/resume-queue-command';
import { GetJobQuery } from '../../application/background-jobs/queries/get-job-query';
import { GetJobsByQueueQuery } from '../../application/background-jobs/queries/get-jobs-by-queue-query';
import { GetQueueQuery } from '../../application/background-jobs/queries/get-queue-query';
import { GetQueuesQuery } from '../../application/background-jobs/queries/get-queues-query';
import { GetQueueStatisticsQuery } from '../../application/background-jobs/queries/get-queue-statistics-query';
import { CreateQueueHandler } from '../../application/background-jobs/handlers/create-queue-handler';
import { CreateJobHandler } from '../../application/background-jobs/handlers/create-job-handler';
import { RetryJobHandler } from '../../application/background-jobs/handlers/retry-job-handler';
import { DeleteJobHandler } from '../../application/background-jobs/handlers/delete-job-handler';
import { DeleteQueueHandler } from '../../application/background-jobs/handlers/delete-queue-handler';
import { PauseQueueHandler } from '../../application/background-jobs/handlers/pause-queue-handler';
import { ResumeQueueHandler } from '../../application/background-jobs/handlers/resume-queue-handler';
import { GetJobHandler } from '../../application/background-jobs/handlers/get-job-handler';
import { GetJobsByQueueHandler } from '../../application/background-jobs/handlers/get-jobs-by-queue-handler';
import { GetQueueHandler } from '../../application/background-jobs/handlers/get-queue-handler';
import { GetQueuesHandler } from '../../application/background-jobs/handlers/get-queues-handler';
import { GetQueueStatisticsHandler } from '../../application/background-jobs/handlers/get-queue-statistics-handler';

/**
 * Background Jobs Controller
 * Handles HTTP requests for background job management
 * 
 * NOTE: This is a simplified controller without DI for now.
 * The handlers should be injected via DI in production.
 */
export class BackgroundJobsController extends BaseController {
  constructor(
    private readonly createQueueHandler: CreateQueueHandler,
    private readonly createJobHandler: CreateJobHandler,
    private readonly retryJobHandler: RetryJobHandler,
    private readonly deleteJobHandler: DeleteJobHandler,
    private readonly deleteQueueHandler: DeleteQueueHandler,
    private readonly pauseQueueHandler: PauseQueueHandler,
    private readonly resumeQueueHandler: ResumeQueueHandler,
    private readonly getJobHandler: GetJobHandler,
    private readonly getJobsByQueueHandler: GetJobsByQueueHandler,
    private readonly getQueueHandler: GetQueueHandler,
    private readonly getQueuesHandler: GetQueuesHandler,
    private readonly getQueueStatisticsHandler: GetQueueStatisticsHandler,
  ) {
    super();
  }

  /**
   * Create a new job queue
   */
  async createQueue(command: CreateQueueCommand): Promise<Result<JobQueueDto>> {
    return this.createQueueHandler.handle(command);
  }

  /**
   * Create a new background job
   */
  async createJob(command: CreateJobCommand): Promise<Result<BackgroundJobDto>> {
    return this.createJobHandler.handle(command);
  }

  /**
   * Retry a failed job
   */
  async retryJob(command: RetryJobCommand): Promise<Result<BackgroundJobDto>> {
    return this.retryJobHandler.handle(command);
  }

  /**
   * Delete a background job
   */
  async deleteJob(command: DeleteJobCommand): Promise<Result<void>> {
    return this.deleteJobHandler.handle(command);
  }

  /**
   * Delete a job queue
   */
  async deleteQueue(command: DeleteQueueCommand): Promise<Result<void>> {
    return this.deleteQueueHandler.handle(command);
  }

  /**
   * Pause a job queue
   */
  async pauseQueue(command: PauseQueueCommand): Promise<Result<JobQueueDto>> {
    return this.pauseQueueHandler.handle(command);
  }

  /**
   * Resume a paused job queue
   */
  async resumeQueue(command: ResumeQueueCommand): Promise<Result<JobQueueDto>> {
    return this.resumeQueueHandler.handle(command);
  }

  /**
   * Get a single background job
   */
  async getJob(query: GetJobQuery): Promise<Result<BackgroundJobDto>> {
    return this.getJobHandler.handle(query);
  }

  /**
   * Get jobs for a specific queue
   */
  async getJobsByQueue(query: GetJobsByQueueQuery): Promise<Result<BackgroundJobDto[]>> {
    return this.getJobsByQueueHandler.handle(query);
  }

  /**
   * Get a single job queue
   */
  async getQueue(query: GetQueueQuery): Promise<Result<JobQueueDto>> {
    return this.getQueueHandler.handle(query);
  }

  /**
   * Get all job queues
   */
  async getQueues(query: GetQueuesQuery): Promise<Result<JobQueueDto[]>> {
    return this.getQueuesHandler.handle(query);
  }

  /**
   * Get statistics for a job queue
   */
  async getQueueStatistics(query: GetQueueStatisticsQuery): Promise<Result<{
    total: number;
    pending: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }>> {
    return this.getQueueStatisticsHandler.handle(query);
  }
}
