export interface SearchSuggestionDto {
  text: string;
  weight?: number;
  context?: Record<string, any>;
}

export interface SearchSuggestionsResponseDto {
  suggestions: string[];
  count: number;
}
