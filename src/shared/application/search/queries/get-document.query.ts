import { Query } from '../../query.base';
import { IndexName } from '../../../domain/search/index-name.vo';
import { DocumentId } from '../../../domain/search/document-id.vo';

export interface GetDocumentQueryProps {
  indexName: string;
  documentId: string;
}

export class GetDocumentQuery extends Query<GetDocumentQueryProps> {
  readonly indexName: IndexName;
  readonly documentId: DocumentId;

  constructor(props: GetDocumentQueryProps) {
    super(props);
    this.indexName = IndexName.create(props.indexName);
    this.documentId = DocumentId.create(props.documentId);
  }
}
