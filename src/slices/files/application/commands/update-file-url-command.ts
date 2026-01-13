import { Command } from '../../../../shared/application/base/command';

/**
 * Update File URL Command
 * Command for updating a file's URL
 */
export class UpdateFileUrlCommand extends Command {
  public readonly props: {
    fileId: string;
    url: string;
    userId: string;
  };

  constructor(props: UpdateFileUrlCommand['props']) {
    super();
    this.props = props;
  }
}
