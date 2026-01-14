import { Command } from '../../command.base';
import { IndexName } from '../../../domain/search/index-name.vo';
import { DocumentId } from '../../../domain/search/document-id.vo';

export interface IndexDocumentCommandProps {
  indexName: string;
  documentId?: string;
  data: Record<string, any>;
}

export class IndexDocumentCommand extends Command<IndexDocumentCommandProps> {
  readonly indexName: IndexName;
  readonly documentId: DocumentId;
  readonly data: Record<string, any>;

  constructor(props: IndexDocumentCommandProps) {
    super(props);
    this.indexName = IndexName.create(props.indexName);
    this.documentId = DocumentId.create(props.documentId || `${Date.now()}-${Math.random()}`);
    this.data = props.data;
  }
}
