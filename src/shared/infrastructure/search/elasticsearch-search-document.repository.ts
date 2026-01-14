import { ISearchDocumentRepository } from '../../../domain/search/isearch-document.repository';
import { SearchDocument } from '../../../domain/search/search-document.entity';
import { DocumentId } from '../../../domain/search/document-id.vo';
import { IndexName } from '../../../domain/search/index-name.vo';
import { Result } from '../../../application/base/result';

/**
 * Elasticsearch implementation of ISearchDocumentRepository
 * This is a placeholder implementation. In production, this would use
 * the @elastic/elasticsearch client to interact with Elasticsearch.
 */
export class ElasticsearchSearchDocumentRepository implements ISearchDocumentRepository {
  private documents: Map<string, SearchDocument> = new Map();

  async save(document: SearchDocument): Promise<Result<SearchDocument>> {
    const key = `${document.indexName.value}:${document.id.value}`;
    this.documents.set(key, document);
    return Result.success<SearchDocument>(document);
  }

  async findById(documentId: DocumentId, indexName: IndexName): Promise<Result<SearchDocument | null>> {
    const key = `${indexName.value}:${documentId.value}`;
    const document = this.documents.get(key);
    return Result.success<SearchDocument | null>(document || null);
  }

  async findByIndexName(indexName: IndexName, page: number = 1, limit: number = 10): Promise<Result<SearchDocument[]>> {
    const documents = Array.from(this.documents.values())
      .filter((doc) => doc.indexName.value === indexName.value)
      .slice((page - 1) * limit, page * limit);

    return Result.success<SearchDocument[]>(documents);
  }

  async delete(documentId: DocumentId, indexName: IndexName): Promise<Result<void>> {
    const key = `${indexName.value}:${documentId.value}`;
    this.documents.delete(key);
    return Result.success<void>(undefined);
  }

  async deleteByIndexName(indexName: IndexName): Promise<Result<void>> {
    const keysToDelete = Array.from(this.documents.keys()).filter((key) =>
      key.startsWith(`${indexName.value}:`)
    );

    keysToDelete.forEach((key) => this.documents.delete(key));

    return Result.success<void>(undefined);
  }

  async count(indexName: IndexName): Promise<Result<number>> {
    const count = Array.from(this.documents.values()).filter(
      (doc) => doc.indexName.value === indexName.value
    ).length;

    return Result.success<number>(count);
  }
}
