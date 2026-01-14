import { injectable } from 'inversify';
import { CommandHandler } from '../../base/command-handler';
import { DeleteQueueCommand } from '../commands/delete-queue-command';
import { JobQueueService } from '../../../domain/background-jobs/services/job-queue-service';
import { Result } from '../../base/result';

@injectable()
export class DeleteQueueHandler extends CommandHandler<DeleteQueueCommand, void> {
  constructor(private readonly jobQueueService: JobQueueService) {
    super();
  }

  async handle(command: DeleteQueueCommand): Promise<Result<void>> {
    return await this.handleWithValidation(command, async () => {
      await this.jobQueueService.deleteQueue(command.queueName);
    });
  }
}
