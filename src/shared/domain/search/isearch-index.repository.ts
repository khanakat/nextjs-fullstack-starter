import { SearchIndex } from '../search-index.entity';
import { IndexName } from '../index-name.vo';
import { Result } from '../../result';

export interface ISearchIndexRepository {
  save(index: SearchIndex): Promise<Result<SearchIndex>>;
  findByName(indexName: IndexName): Promise<Result<SearchIndex | null>>;
  findAll(): Promise<Result<SearchIndex[]>>;
  delete(indexName: IndexName): Promise<Result<void>>;
  exists(indexName: IndexName): Promise<Result<boolean>>;
}
