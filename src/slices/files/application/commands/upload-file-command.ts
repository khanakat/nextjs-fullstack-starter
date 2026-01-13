import { Command } from '../../../../shared/application/base/command';

/**
 * Upload File Command
 * Command for uploading a new file
 */
export class UploadFileCommand extends Command {
  public readonly props: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedById?: string;
  };

  constructor(props: UploadFileCommand['props']) {
    super();
    this.props = props;
  }
}
