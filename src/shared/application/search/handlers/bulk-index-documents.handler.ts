import { CommandHandler } from '../../base/command-handler';
import { BulkIndexDocumentsCommand } from '../commands/bulk-index-documents.command';
import { ISearchService } from '../../../domain/search/isearch.service';
import { SearchDocument } from '../../../domain/search/search-document.entity';
import { DocumentId } from '../../../domain/search/document-id.vo';
import { Result } from '../../base/result';

export class BulkIndexDocumentsHandler extends CommandHandler<BulkIndexDocumentsCommand, SearchDocument[]> {
  constructor(private searchService: ISearchService) {
    super();
  }

  async handle(command: BulkIndexDocumentsCommand): Promise<Result<SearchDocument[]>> {
    const documents = command.documents.map((doc) => {
      const documentResult = SearchDocument.create({
        id: DocumentId.create(doc.documentId || `${Date.now()}-${Math.random()}`),
        indexName: command.indexName,
        data: doc.data,
        updatedAt: new Date(),
      });

      if (documentResult.isFailure) {
        throw new Error(`Failed to create document: ${documentResult.error}`);
      }

      return documentResult.value;
    });

    return this.searchService.bulkIndexDocuments(documents);
  }
}
