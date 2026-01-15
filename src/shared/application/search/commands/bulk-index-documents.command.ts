import { Command } from '../../base/command';
import { IndexName } from '../../../domain/search/index-name.vo';

export interface BulkIndexDocument {
  documentId?: string;
  data: Record<string, unknown>;
}

export interface BulkIndexDocumentsCommandProps {
  indexName: string;
  documents: BulkIndexDocument[];
}

export class BulkIndexDocumentsCommand extends Command {
  readonly indexName: IndexName;
  readonly documents: BulkIndexDocument[];

  constructor(props: BulkIndexDocumentsCommandProps, userId?: string) {
    super(userId);
    this.indexName = IndexName.create(props.indexName);
    this.documents = props.documents;

    if (this.documents.length === 0) {
      throw new Error('At least one document must be provided');
    }

    if (this.documents.length > 1000) {
      throw new Error('Cannot bulk index more than 1000 documents at once');
    }
  }
}
