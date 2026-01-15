import { SearchDocument } from '@/shared/domain/search/search-document.entity';
import { DocumentId } from '@/shared/domain/search/document-id.vo';
import { IndexName } from '@/shared/domain/search/index-name.vo';
import { Result } from '@/shared/application/base/result';

export interface ISearchDocumentRepository {
  save(document: SearchDocument): Promise<Result<SearchDocument>>;
  findById(documentId: DocumentId, indexName: IndexName): Promise<Result<SearchDocument | null>>;
  findByIndexName(indexName: IndexName, page?: number, limit?: number): Promise<Result<SearchDocument[]>>;
  delete(documentId: DocumentId, indexName: IndexName): Promise<Result<void>>;
  deleteByIndexName(indexName: IndexName): Promise<Result<void>>;
  count(indexName: IndexName): Promise<Result<number>>;
}
