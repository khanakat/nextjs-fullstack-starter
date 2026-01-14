import { SearchDocument } from '../search-document.entity';
import { DocumentId } from '../document-id.vo';
import { IndexName } from '../index-name.vo';
import { Result } from '../../result';

export interface ISearchDocumentRepository {
  save(document: SearchDocument): Promise<Result<SearchDocument>>;
  findById(documentId: DocumentId, indexName: IndexName): Promise<Result<SearchDocument | null>>;
  findByIndexName(indexName: IndexName, page?: number, limit?: number): Promise<Result<SearchDocument[]>>;
  delete(documentId: DocumentId, indexName: IndexName): Promise<Result<void>>;
  deleteByIndexName(indexName: IndexName): Promise<Result<void>>;
  count(indexName: IndexName): Promise<Result<number>>;
}
