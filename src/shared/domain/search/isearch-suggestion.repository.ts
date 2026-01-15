import { SearchSuggestion } from '@/shared/domain/search/search-suggestion.entity';
import { SearchId } from '@/shared/domain/search/search-id.vo';
import { Result } from '@/shared/application/base/result';

export interface ISearchSuggestionRepository {
  save(suggestion: SearchSuggestion): Promise<Result<SearchSuggestion>>;
  findById(id: SearchId): Promise<Result<SearchSuggestion | null>>;
  findByPrefix(prefix: string, limit?: number): Promise<Result<SearchSuggestion[]>>;
  delete(id: SearchId): Promise<Result<void>>;
  deleteAll(): Promise<Result<void>>;
}
