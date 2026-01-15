import { ISearchSuggestionRepository } from '@/shared/domain/search/isearch-suggestion.repository';
import { SearchSuggestion } from '@/shared/domain/search/search-suggestion.entity';
import { SearchId } from '@/shared/domain/search/search-id.vo';
import { Result } from '@/shared/application/base/result';

/**
 * In-memory implementation of ISearchSuggestionRepository
 * This is a placeholder implementation for development and testing.
 */
export class InMemorySearchSuggestionRepository implements ISearchSuggestionRepository {
  private suggestions: Map<string, SearchSuggestion> = new Map();

  async save(suggestion: SearchSuggestion): Promise<Result<SearchSuggestion>> {
    this.suggestions.set(suggestion.id, suggestion);
    return Result.success<SearchSuggestion>(suggestion);
  }

  async findById(id: SearchId): Promise<Result<SearchSuggestion | null>> {
    const suggestion = this.suggestions.get(id.id);
    return Result.success<SearchSuggestion | null>(suggestion || null);
  }

  async findByPrefix(prefix: string, limit: number = 10): Promise<Result<SearchSuggestion[]>> {
    const suggestions = Array.from(this.suggestions.values())
      .filter((s) => s.text.toLowerCase().startsWith(prefix.toLowerCase()))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);

    return Result.success<SearchSuggestion[]>(suggestions);
  }

  async delete(id: SearchId): Promise<Result<void>> {
    this.suggestions.delete(id.id);
    return Result.success<void>(undefined);
  }

  async deleteAll(): Promise<Result<void>> {
    this.suggestions.clear();
    return Result.success<void>(undefined);
  }
}
