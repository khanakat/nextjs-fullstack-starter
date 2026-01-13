import { Command } from '../../../../shared/application/base/command';

/**
 * Delete File Command
 * Command for deleting a file
 */
export class DeleteFileCommand extends Command {
  public readonly props: {
    fileId: string;
    userId: string;
  };

  constructor(props: DeleteFileCommand['props']) {
    super();
    this.props = props;
  }
}
