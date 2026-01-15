import { Command } from '../../base/command';
import { IndexName } from '../../../domain/search/index-name.vo';
import { DocumentId } from '../../../domain/search/document-id.vo';

export interface UpdateDocumentCommandProps {
  indexName: string;
  documentId: string;
  data: Record<string, unknown>;
}

export class UpdateDocumentCommand extends Command {
  readonly indexName: IndexName;
  readonly documentId: DocumentId;
  readonly data: Record<string, unknown>;

  constructor(props: UpdateDocumentCommandProps, userId?: string) {
    super(userId);
    this.indexName = IndexName.create(props.indexName);
    this.documentId = DocumentId.create(props.documentId);
    this.data = props.data;
  }
}
