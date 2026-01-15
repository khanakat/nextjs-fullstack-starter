import { Entity } from '../base/entity';
import { SearchId } from '@/shared/domain/search/search-id.vo';
import { Result } from '../../application/base/result';

export interface SearchSuggestionProps {
  id: SearchId;
  text: string;
  weight?: number;
  context?: Record<string, any>;
  createdAt: Date;
}

export class SearchSuggestion extends Entity<string> {
  private _props: SearchSuggestionProps;

  get searchId(): SearchId {
    return this._props.id;
  }

  get text(): string {
    return this._props.text;
  }

  get weight(): number {
    return this._props.weight || 1.0;
  }

  get context(): Record<string, any> | undefined {
    return this._props.context;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  private constructor(id: string, props: SearchSuggestionProps) {
    super(id);
    this._props = props;
  }

  static create(props: SearchSuggestionProps): Result<SearchSuggestion> {
    if (!props.text || props.text.trim().length === 0) {
      return Result.failure<SearchSuggestion>(new Error('Suggestion text cannot be empty'));
    }

    if (props.text.length > 100) {
      return Result.failure<SearchSuggestion>(new Error('Suggestion text cannot exceed 100 characters'));
    }

    if (props.weight !== undefined && (props.weight < 0 || props.weight > 1)) {
      return Result.failure<SearchSuggestion>(new Error('Weight must be between 0 and 1'));
    }

    // @ts-ignore - SearchId extends UniqueId which has .id property
    const id = (props.id as any).id;
    return Result.success<SearchSuggestion>(new SearchSuggestion(id, props));
  }

  updateWeight(weight: number): Result<SearchSuggestion> {
    if (weight < 0 || weight > 1) {
      return Result.failure<SearchSuggestion>(new Error('Weight must be between 0 and 1'));
    }

    this._props.weight = weight;

    return Result.success<SearchSuggestion>(this);
  }
}
