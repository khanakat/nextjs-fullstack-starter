import { Command } from '../../command.base';
import { IndexName } from '../../../domain/search/index-name.vo';
import { DocumentId } from '../../../domain/search/document-id.vo';

export interface UpdateDocumentCommandProps {
  indexName: string;
  documentId: string;
  data: Record<string, any>;
}

export class UpdateDocumentCommand extends Command<UpdateDocumentCommandProps> {
  readonly indexName: IndexName;
  readonly documentId: DocumentId;
  readonly data: Record<string, any>;

  constructor(props: UpdateDocumentCommandProps) {
    super(props);
    this.indexName = IndexName.create(props.indexName);
    this.documentId = DocumentId.create(props.documentId);
    this.data = props.data;
  }
}
