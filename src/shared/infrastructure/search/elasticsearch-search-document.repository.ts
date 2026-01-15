import { ISearchDocumentRepository } from '@/shared/domain/search/isearch-document.repository';
import { SearchDocument } from '@/shared/domain/search/search-document.entity';
import { DocumentId } from '@/shared/domain/search/document-id.vo';
import { IndexName } from '@/shared/domain/search/index-name.vo';
import { Result } from '@/shared/application/base/result';

/**
 * Elasticsearch implementation of ISearchDocumentRepository
 * This is a placeholder implementation. In production, this would use
 * the @elastic/elasticsearch client to interact with Elasticsearch.
 */
export class ElasticsearchSearchDocumentRepository implements ISearchDocumentRepository {
  private documents: Map<string, SearchDocument> = new Map();

  async save(document: SearchDocument): Promise<Result<SearchDocument>> {
    const key = `${document.indexName.value.value}:${document.id}`;
    this.documents.set(key, document);
    return Result.success<SearchDocument>(document);
  }

  async findById(documentId: DocumentId, indexName: IndexName): Promise<Result<SearchDocument | null>> {
    const key = `${indexName.value.value}:${documentId.value.value}`;
    const document = this.documents.get(key);
    return Result.success<SearchDocument | null>(document || null);
  }

  async findByIndexName(indexName: IndexName, page: number = 1, limit: number = 10): Promise<Result<SearchDocument[]>> {
    const documents = Array.from(this.documents.values())
      .filter((doc) => doc.indexName.value.value === indexName.value.value)
      .slice((page - 1) * limit, page * limit);

    return Result.success<SearchDocument[]>(documents);
  }

  async delete(documentId: DocumentId, indexName: IndexName): Promise<Result<void>> {
    const key = `${indexName.value.value}:${documentId.value.value}`;
    this.documents.delete(key);
    return Result.success<void>(undefined);
  }

  async deleteByIndexName(indexName: IndexName): Promise<Result<void>> {
    const keysToDelete = Array.from(this.documents.keys()).filter((key) =>
      key.startsWith(`${indexName.value.value}:`)
    );

    keysToDelete.forEach((key) => this.documents.delete(key));

    return Result.success<void>(undefined);
  }

  async count(indexName: IndexName): Promise<Result<number>> {
    const count = Array.from(this.documents.values()).filter(
      (doc) => doc.indexName.value.value === indexName.value.value
    ).length;

    return Result.success<number>(count);
  }
}
