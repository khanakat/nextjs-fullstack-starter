import { Entity } from '../entity.base';
import { SearchId } from './search-id.vo';
import { Result } from '../result';

export interface SearchSuggestionProps {
  id: SearchId;
  text: string;
  weight?: number;
  context?: Record<string, any>;
  createdAt: Date;
}

export class SearchSuggestion extends Entity<SearchSuggestionProps> {
  get id(): SearchId {
    return this.props.id;
  }

  get text(): string {
    return this.props.text;
  }

  get weight(): number {
    return this.props.weight || 1.0;
  }

  get context(): Record<string, any> | undefined {
    return this.props.context;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private constructor(props: SearchSuggestionProps) {
    super(props);
  }

  static create(props: SearchSuggestionProps): Result<SearchSuggestion> {
    if (!props.text || props.text.trim().length === 0) {
      return Result.failure<SearchSuggestion>('Suggestion text cannot be empty');
    }

    if (props.text.length > 100) {
      return Result.failure<SearchSuggestion>('Suggestion text cannot exceed 100 characters');
    }

    if (props.weight !== undefined && (props.weight < 0 || props.weight > 1)) {
      return Result.failure<SearchSuggestion>('Weight must be between 0 and 1');
    }

    return Result.success<SearchSuggestion>(new SearchSuggestion(props));
  }

  updateWeight(weight: number): Result<SearchSuggestion> {
    if (weight < 0 || weight > 1) {
      return Result.failure<SearchSuggestion>('Weight must be between 0 and 1');
    }

    this.props.weight = weight;

    return Result.success<SearchSuggestion>(this);
  }
}
