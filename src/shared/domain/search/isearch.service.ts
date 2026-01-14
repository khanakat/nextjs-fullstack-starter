import { SearchQuery } from './search-query.vo';
import { SearchResult } from './search-result.vo';
import { SearchDocument } from './search-document.entity';
import { DocumentId } from './document-id.vo';
import { IndexName } from './index-name.vo';
import { Result } from '../result';

export interface ISearchService {
  // Document operations
  indexDocument(document: SearchDocument): Promise<Result<SearchDocument>>;
  updateDocument(document: SearchDocument): Promise<Result<SearchDocument>>;
  deleteDocument(documentId: DocumentId, indexName: IndexName): Promise<Result<void>>;
  getDocument(documentId: DocumentId, indexName: IndexName): Promise<Result<SearchDocument | null>>;

  // Bulk operations
  bulkIndexDocuments(documents: SearchDocument[]): Promise<Result<SearchDocument[]>>;
  bulkDeleteDocuments(documentIds: DocumentId[], indexName: IndexName): Promise<Result<void>>;

  // Search operations
  search(query: SearchQuery, indexName: IndexName): Promise<Result<SearchResult>>;
  searchMultipleIndices(query: SearchQuery, indexNames: IndexName[]): Promise<Result<SearchResult>>;

  // Index operations
  createIndex(indexName: IndexName, mappings: Record<string, any>): Promise<Result<void>>;
  deleteIndex(indexName: IndexName): Promise<Result<void>>;
  indexExists(indexName: IndexName): Promise<Result<boolean>>;
  getIndexStats(indexName: IndexName): Promise<Result<Record<string, any>>>;

  // Suggestion operations
  getSuggestions(prefix: string, indexName?: IndexName, limit?: number): Promise<Result<string[]>>;
}
