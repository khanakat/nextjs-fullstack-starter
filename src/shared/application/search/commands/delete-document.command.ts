import { Command } from '../../command.base';
import { IndexName } from '../../../domain/search/index-name.vo';
import { DocumentId } from '../../../domain/search/document-id.vo';

export interface DeleteDocumentCommandProps {
  indexName: string;
  documentId: string;
}

export class DeleteDocumentCommand extends Command<DeleteDocumentCommandProps> {
  readonly indexName: IndexName;
  readonly documentId: DocumentId;

  constructor(props: DeleteDocumentCommandProps) {
    super(props);
    this.indexName = IndexName.create(props.indexName);
    this.documentId = DocumentId.create(props.documentId);
  }
}
