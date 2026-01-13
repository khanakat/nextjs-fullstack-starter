import { Command } from '../../../../shared/application/base/command';

/**
 * Delete Many Files Command
 * Command for deleting multiple files
 */
export class DeleteManyFilesCommand extends Command {
  public readonly props: {
    fileIds: string[];
    userId: string;
  };

  constructor(props: DeleteManyFilesCommand['props']) {
    super();
    this.props = props;
  }
}
