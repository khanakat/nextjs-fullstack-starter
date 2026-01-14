import { Command } from '../../command.base';
import { IndexName } from '../../../domain/search/index-name.vo';

export interface BulkIndexDocument {
  documentId?: string;
  data: Record<string, any>;
}

export interface BulkIndexDocumentsCommandProps {
  indexName: string;
  documents: BulkIndexDocument[];
}

export class BulkIndexDocumentsCommand extends Command<BulkIndexDocumentsCommandProps> {
  readonly indexName: IndexName;
  readonly documents: BulkIndexDocument[];

  constructor(props: BulkIndexDocumentsCommandProps) {
    super(props);
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
