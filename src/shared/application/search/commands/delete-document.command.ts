import { Command } from '../../base/command';
import { IndexName } from '../../../domain/search/index-name.vo';
import { DocumentId } from '../../../domain/search/document-id.vo';

export interface DeleteDocumentCommandProps {
  indexName: string;
  documentId: string;
}

export class DeleteDocumentCommand extends Command {
  readonly indexName: IndexName;
  readonly documentId: DocumentId;

  constructor(props: DeleteDocumentCommandProps, userId?: string) {
    super(userId);
    this.indexName = IndexName.create(props.indexName);
    this.documentId = DocumentId.create(props.documentId);
  }
}
