import { ISearchIndexRepository } from '@/shared/domain/search/isearch-index.repository';
import { SearchIndex } from '@/shared/domain/search/search-index.entity';
import { IndexName } from '@/shared/domain/search/index-name.vo';
import { Result } from '@/shared/application/base/result';

/**
 * Elasticsearch implementation of ISearchIndexRepository
 * This is a placeholder implementation. In production, this would use
 * the @elastic/elasticsearch client to interact with Elasticsearch indices.
 */
export class ElasticsearchSearchIndexRepository implements ISearchIndexRepository {
  private indices: Map<string, SearchIndex> = new Map();

  async save(index: SearchIndex): Promise<Result<SearchIndex>> {
    this.indices.set(index.name.value.value, index);
    return Result.success<SearchIndex>(index);
  }

  async findByName(indexName: IndexName): Promise<Result<SearchIndex | null>> {
    const index = this.indices.get(indexName.value.value);
    return Result.success<SearchIndex | null>(index || null);
  }

  async findAll(): Promise<Result<SearchIndex[]>> {
    const indices = Array.from(this.indices.values());
    return Result.success<SearchIndex[]>(indices);
  }

  async delete(indexName: IndexName): Promise<Result<void>> {
    this.indices.delete(indexName.value.value);
    return Result.success<void>(undefined);
  }

  async exists(indexName: IndexName): Promise<Result<boolean>> {
    const exists = this.indices.has(indexName.value.value);
    return Result.success<boolean>(exists);
  }
}
