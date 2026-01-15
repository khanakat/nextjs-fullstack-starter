import { NextRequest, NextResponse } from 'next/server';
import { BackgroundJobsController } from '../background-jobs-controller';
import { CreateQueueCommand } from '../../../application/background-jobs/commands/create-queue-command';
import { CreateJobCommand } from '../../../application/background-jobs/commands/create-job-command';
import { RetryJobCommand } from '../../../application/background-jobs/commands/retry-job-command';
import { DeleteJobCommand } from '../../../application/background-jobs/commands/delete-job-command';
import { DeleteQueueCommand } from '../../../application/background-jobs/commands/delete-queue-command';
import { PauseQueueCommand } from '../../../application/background-jobs/commands/pause-queue-command';
import { ResumeQueueCommand } from '../../../application/background-jobs/commands/resume-queue-command';
import { GetJobQuery } from '../../../application/background-jobs/queries/get-job-query';
import { GetJobsByQueueQuery } from '../../../application/background-jobs/queries/get-jobs-by-queue-query';
import { GetQueueQuery } from '../../../application/background-jobs/queries/get-queue-query';
import { GetQueuesQuery } from '../../../application/background-jobs/queries/get-queues-query';
import { GetQueueStatisticsQuery } from '../../../application/background-jobs/queries/get-queue-statistics-query';

/**
 * Background Jobs API Route
 * Next.js App Router API route for background job management
 */
export async function GET(request: NextRequest) {
  // @ts-ignore - TODO: Setup DI for controller dependencies
  const controller = new BackgroundJobsController();
  const query = new GetQueuesQuery();
  const result = await controller.getQueues(query);

  if (result.isFailure) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(result.value, { status: 200 });
}

/**
 * Create a new job queue
 * POST /api/background-jobs/queues
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  // @ts-ignore - TODO: Setup DI for controller dependencies
  const controller = new BackgroundJobsController();
  const command = new CreateQueueCommand(
    body.name,
    body.description,
    body.defaultPriority,
    body.concurrency,
    body.maxRetries,
    body.defaultTimeout,
    body.defaultDelay
  );
  const result = await controller.createQueue(command);

  if (result.isFailure) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(result.value, { status: 201 });
}

/**
 * Get a single job queue
 * GET /api/background-jobs/queues/[queueName]
 */
export async function GET_QUEUE(
  request: NextRequest,
  { params }: { params: { queueName: string } }
) {
  // @ts-ignore - TODO: Setup DI for controller dependencies
  const controller = new BackgroundJobsController();
  const query = new GetQueueQuery(params.queueName);
  const result = await controller.getQueue(query);

  if (result.isFailure) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(result.value, { status: 200 });
}

/**
 * Pause a job queue
 * POST /api/background-jobs/queues/[queueName]/pause
 */
export async function POST_PAUSE(
  request: NextRequest,
  { params }: { params: { queueName: string } }
) {
  // @ts-ignore - TODO: Setup DI for controller dependencies
  const controller = new BackgroundJobsController();
  const command = new PauseQueueCommand(params.queueName);
  const result = await controller.pauseQueue(command);

  if (result.isFailure) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(result.value, { status: 200 });
}

/**
 * Resume a paused job queue
 * POST /api/background-jobs/queues/[queueName]/resume
 */
export async function POST_RESUME(
  request: NextRequest,
  { params }: { params: { queueName: string } }
) {
  // @ts-ignore - TODO: Setup DI for controller dependencies
  const controller = new BackgroundJobsController();
  const command = new ResumeQueueCommand(params.queueName);
  const result = await controller.resumeQueue(command);

  if (result.isFailure) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(result.value, { status: 200 });
}

/**
 * Get statistics for a job queue
 * GET /api/background-jobs/queues/[queueName]/statistics
 */
export async function GET_STATISTICS(
  request: NextRequest,
  { params }: { params: { queueName: string } }
) {
  // @ts-ignore - TODO: Setup DI for controller dependencies
  const controller = new BackgroundJobsController();
  const query = new GetQueueStatisticsQuery(params.queueName);
  const result = await controller.getQueueStatistics(query);

  if (result.isFailure) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(result.value, { status: 200 });
}

/**
 * Get jobs for a specific queue
 * GET /api/background-jobs/jobs?queueName=...
 */
export async function GET_JOBS(request: NextRequest) {
  const { searchParams } = new URL(request.url || '', 'http://localhost');
  const queueName = searchParams.get('queueName');
  
  if (!queueName) {
    return NextResponse.json(
      { error: 'Queue name is required' },
      { status: 400 }
    );
  }

  // @ts-ignore - TODO: Setup DI for controller dependencies
  const controller = new BackgroundJobsController();
  const query = new GetJobsByQueueQuery(queueName);
  const result = await controller.getJobsByQueue(query);

  if (result.isFailure) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(result.value, { status: 200 });
}

/**
 * Get a single background job
 * GET /api/background-jobs/jobs/[jobId]
 */
export async function GET_JOB(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  // @ts-ignore - TODO: Setup DI for controller dependencies
  const controller = new BackgroundJobsController();
  const query = new GetJobQuery(params.jobId);
  const result = await controller.getJob(query);

  if (result.isFailure) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(result.value, { status: 200 });
}

/**
 * Create a new background job
 * POST /api/background-jobs/jobs
 */
export async function POST_JOB(request: NextRequest) {
  const body = await request.json();
  // @ts-ignore - TODO: Setup DI for controller dependencies
  const controller = new BackgroundJobsController();
  const command = new CreateJobCommand(
    body.name,
    body.queueName,
    body.data,
    body.priority,
    body.maxAttempts,
    body.delay,
    body.timeout
  );
  const result = await controller.createJob(command);

  if (result.isFailure) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(result.value, { status: 201 });
}

/**
 * Retry a failed job
 * POST /api/background-jobs/jobs/[jobId]/retry
 */
export async function POST_RETRY(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  // @ts-ignore - TODO: Setup DI for controller dependencies
  const controller = new BackgroundJobsController();
  const command = new RetryJobCommand(params.jobId);
  const result = await controller.retryJob(command);

  if (result.isFailure) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(result.value, { status: 200 });
}

/**
 * Delete a background job
 * DELETE /api/background-jobs/jobs/[jobId]
 */
export async function DELETE_JOB(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  // @ts-ignore - TODO: Setup DI for controller dependencies
  const controller = new BackgroundJobsController();
  const command = new DeleteJobCommand(params.jobId);
  const result = await controller.deleteJob(command);

  if (result.isFailure) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(result.value, { status: 200 });
}

/**
 * Delete a job queue
 * DELETE /api/background-jobs/queues/[queueName]
 */
export async function DELETE_QUEUE(
  request: NextRequest,
  { params }: { params: { queueName: string } }
) {
  // @ts-ignore - TODO: Setup DI for controller dependencies
  const controller = new BackgroundJobsController();
  const command = new DeleteQueueCommand(params.queueName);
  const result = await controller.deleteQueue(command);

  if (result.isFailure) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(result.value, { status: 200 });
}
