import { injectable } from 'inversify';
import { CommandHandler } from '../../base/command-handler';
import { DeleteJobCommand } from '../commands/delete-job-command';
import { JobQueueService } from '../../../domain/background-jobs/services/job-queue-service';
import { Result } from '../../base/result';

@injectable()
export class DeleteJobHandler extends CommandHandler<DeleteJobCommand, void> {
  constructor(private readonly jobQueueService: JobQueueService) {
    super();
  }

  async handle(command: DeleteJobCommand): Promise<Result<void>> {
    return await this.handleWithValidation(command, async () => {
      await this.jobQueueService.deleteJob(command.jobId);
    });
  }
}
