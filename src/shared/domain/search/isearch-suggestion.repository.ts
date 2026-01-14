import { SearchSuggestion } from '../search-suggestion.entity';
import { SearchId } from '../search-id.vo';
import { Result } from '../../result';

export interface ISearchSuggestionRepository {
  save(suggestion: SearchSuggestion): Promise<Result<SearchSuggestion>>;
  findById(id: SearchId): Promise<Result<SearchSuggestion | null>>;
  findByPrefix(prefix: string, limit?: number): Promise<Result<SearchSuggestion[]>>;
  delete(id: SearchId): Promise<Result<void>>;
  deleteAll(): Promise<Result<void>>;
}
