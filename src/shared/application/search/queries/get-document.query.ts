import { Query } from '../../base/query';
import { IndexName } from '../../../domain/search/index-name.vo';
import { DocumentId } from '../../../domain/search/document-id.vo';

export interface GetDocumentQueryProps {
  indexName: string;
  documentId: string;
}

export class GetDocumentQuery extends Query {
  readonly indexName: IndexName;
  readonly documentId: DocumentId;

  constructor(props: GetDocumentQueryProps, userId?: string) {
    super(userId);
    this.indexName = IndexName.create(props.indexName);
    this.documentId = DocumentId.create(props.documentId);
  }
}
