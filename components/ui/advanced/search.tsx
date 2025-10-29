"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  X,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Tag,
  User,
  Loader2,
  ChevronDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { useDebounce } from "@/hooks/use-common";

// Types
export interface SearchFilter {
  id: string;
  label: string;
  type:
    | "text"
    | "select"
    | "multiselect"
    | "date"
    | "daterange"
    | "boolean"
    | "number";
  options?: { value: string; label: string }[];
  value?: any;
  placeholder?: string;
}

export interface SearchSort {
  field: string;
  direction: "asc" | "desc";
  label?: string;
}

export interface SearchResult<T = any> {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  date?: Date;
  author?: string;
  data: T;
  relevance?: number;
}

export interface SearchProps<T = any> {
  onSearch: (
    query: string,
    filters: Record<string, any>,
    sort?: SearchSort,
  ) => Promise<SearchResult<T>[]> | SearchResult<T>[];
  placeholder?: string;
  filters?: SearchFilter[];
  sortOptions?: { field: string; label: string }[];
  defaultSort?: SearchSort;
  showFilters?: boolean;
  showSort?: boolean;
  showResults?: boolean;
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
  className?: string;
  resultClassName?: string;
  onResultClick?: (result: SearchResult<T>) => void;
  renderResult?: (result: SearchResult<T>) => React.ReactNode;
  emptyMessage?: string;
  loadingMessage?: string;
  autoFocus?: boolean;
  clearOnSelect?: boolean;
}

export interface AutocompleteProps<T = any> {
  onSearch: (query: string) => Promise<SearchResult<T>[]> | SearchResult<T>[];
  onSelect: (result: SearchResult<T>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearOnSelect?: boolean;
  renderResult?: (result: SearchResult<T>) => React.ReactNode;
  minQueryLength?: number;
  debounceMs?: number;
}

// Utility functions
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const highlightText = (text: string, query: string) => {
  if (!query.trim()) return text;

  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark
        key={index}
        className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
};

// Filter Component
function FilterPopover({
  filters,
  values,
  onChange,
}: {
  filters: SearchFilter[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeFiltersCount = Object.values(values).filter(
    (v) =>
      v !== undefined && v !== "" && (Array.isArray(v) ? v.length > 0 : true),
  ).length;

  const handleFilterChange = (filterId: string, value: any) => {
    onChange({ ...values, [filterId]: value });
  };

  const clearFilters = () => {
    const clearedValues = Object.keys(values).reduce(
      (acc, key) => {
        acc[key] = undefined;
        return acc;
      },
      {} as Record<string, any>,
    );
    onChange(clearedValues);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filters</h4>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            {filters.map((filter) => (
              <div key={filter.id} className="space-y-2">
                <Label className="text-sm font-medium">{filter.label}</Label>

                {filter.type === "text" && (
                  <Input
                    placeholder={filter.placeholder}
                    value={values[filter.id] || ""}
                    onChange={(e) =>
                      handleFilterChange(filter.id, e.target.value)
                    }
                  />
                )}

                {filter.type === "select" && filter.options && (
                  <Select
                    value={values[filter.id] || ""}
                    onValueChange={(value) =>
                      handleFilterChange(filter.id, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={filter.placeholder || "Select..."}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {filter.type === "multiselect" && filter.options && (
                  <div className="space-y-2">
                    {filter.options.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`${filter.id}-${option.value}`}
                          checked={(values[filter.id] || []).includes(
                            option.value,
                          )}
                          onCheckedChange={(checked) => {
                            const currentValues = values[filter.id] || [];
                            const newValues = checked
                              ? [...currentValues, option.value]
                              : currentValues.filter(
                                  (v: string) => v !== option.value,
                                );
                            handleFilterChange(filter.id, newValues);
                          }}
                        />
                        <Label
                          htmlFor={`${filter.id}-${option.value}`}
                          className="text-sm"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

                {filter.type === "boolean" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={filter.id}
                      checked={values[filter.id] || false}
                      onCheckedChange={(checked) =>
                        handleFilterChange(filter.id, checked)
                      }
                    />
                    <Label htmlFor={filter.id} className="text-sm">
                      {filter.placeholder || "Enable"}
                    </Label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Sort Component
function SortSelect({
  options,
  value,
  onChange,
}: {
  options: { field: string; label: string }[];
  value?: SearchSort;
  onChange: (sort: SearchSort) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          {value?.direction === "asc" ? (
            <SortAsc className="w-4 h-4 mr-2" />
          ) : (
            <SortDesc className="w-4 h-4 mr-2" />
          )}
          Sort
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {options.map((option) => (
                <React.Fragment key={option.field}>
                  <CommandItem
                    onSelect={() => {
                      onChange({
                        field: option.field,
                        direction: "asc",
                        label: option.label,
                      });
                      setOpen(false);
                    }}
                  >
                    <SortAsc className="w-4 h-4 mr-2" />
                    {option.label} (A-Z)
                    {value?.field === option.field &&
                      value?.direction === "asc" && (
                        <Check className="w-4 h-4 ml-auto" />
                      )}
                  </CommandItem>
                  <CommandItem
                    onSelect={() => {
                      onChange({
                        field: option.field,
                        direction: "desc",
                        label: option.label,
                      });
                      setOpen(false);
                    }}
                  >
                    <SortDesc className="w-4 h-4 mr-2" />
                    {option.label} (Z-A)
                    {value?.field === option.field &&
                      value?.direction === "desc" && (
                        <Check className="w-4 h-4 ml-auto" />
                      )}
                  </CommandItem>
                </React.Fragment>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Search Result Component
function SearchResultItem<T>({
  result,
  query,
  onClick,
  renderResult,
}: {
  result: SearchResult<T>;
  query: string;
  onClick?: (result: SearchResult<T>) => void;
  renderResult?: (result: SearchResult<T>) => React.ReactNode;
}) {
  if (renderResult) {
    return (
      <div onClick={() => onClick?.(result)} className="cursor-pointer">
        {renderResult(result)}
      </div>
    );
  }

  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onClick?.(result)}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-sm">
              {highlightText(result.title, query)}
            </h3>
            {result.relevance && (
              <Badge variant="secondary" className="text-xs">
                {Math.round(result.relevance * 100)}%
              </Badge>
            )}
          </div>

          {result.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {highlightText(result.description, query)}
            </p>
          )}

          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            {result.category && (
              <div className="flex items-center space-x-1">
                <Tag className="w-3 h-3" />
                <span>{result.category}</span>
              </div>
            )}

            {result.author && (
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>{result.author}</span>
              </div>
            )}

            {result.date && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{result.date.toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {result.tags && result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {result.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{result.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Search Component
export function AdvancedSearch<T = any>({
  onSearch,
  placeholder = "Search...",
  filters = [],
  sortOptions = [],
  defaultSort,
  showFilters = true,
  showSort = true,
  showResults = true,
  debounceMs = 300,
  minQueryLength = 1,
  maxResults = 50,
  className,
  resultClassName,
  onResultClick,
  renderResult,
  emptyMessage = "No results found",
  loadingMessage = "Searching...",
  autoFocus = false,
  clearOnSelect = false,
}: SearchProps<T>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult<T>[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [sort, setSort] = useState<SearchSort | undefined>(defaultSort);
  const [showResultsPanel, setShowResultsPanel] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, debounceMs);

  // Perform search
  const performSearch = useCallback(
    async (
      searchQuery: string,
      searchFilters: Record<string, any>,
      searchSort?: SearchSort,
    ) => {
      if (searchQuery.length < minQueryLength) {
        setResults([]);
        setShowResultsPanel(false);
        return;
      }

      setLoading(true);
      setShowResultsPanel(true);

      try {
        const searchResults = await onSearch(
          searchQuery,
          searchFilters,
          searchSort,
        );
        const limitedResults = Array.isArray(searchResults)
          ? searchResults.slice(0, maxResults)
          : [];
        setResults(limitedResults);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [onSearch, minQueryLength, maxResults],
  );

  // Effect for debounced search
  useEffect(() => {
    if (
      debouncedQuery ||
      Object.values(filterValues).some((v) => v !== undefined && v !== "")
    ) {
      performSearch(debouncedQuery, filterValues, sort);
    } else {
      setResults([]);
      setShowResultsPanel(false);
    }
  }, [debouncedQuery, filterValues, sort, performSearch]);

  // Handle result click
  const handleResultClick = (result: SearchResult<T>) => {
    onResultClick?.(result);
    if (clearOnSelect) {
      setQuery("");
      setResults([]);
      setShowResultsPanel(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResultsPanel(false);
    setFilterValues({});
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative space-y-4", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
          autoFocus={autoFocus}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={clearSearch}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filters and Sort */}
      {(showFilters || showSort) &&
        (filters.length > 0 || sortOptions.length > 0) && (
          <div className="flex items-center space-x-2">
            {showFilters && filters.length > 0 && (
              <FilterPopover
                filters={filters}
                values={filterValues}
                onChange={setFilterValues}
              />
            )}

            {showSort && sortOptions.length > 0 && (
              <SortSelect
                options={sortOptions}
                value={sort}
                onChange={setSort}
              />
            )}
          </div>
        )}

      {/* Active Filters */}
      {Object.entries(filterValues).some(
        ([_, value]) =>
          value !== undefined &&
          value !== "" &&
          (Array.isArray(value) ? value.length > 0 : true),
      ) && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filterValues).map(([filterId, value]) => {
            if (
              value === undefined ||
              value === "" ||
              (Array.isArray(value) && value.length === 0)
            ) {
              return null;
            }

            const filter = filters.find((f) => f.id === filterId);
            if (!filter) return null;

            const displayValue = Array.isArray(value)
              ? value.join(", ")
              : String(value);

            return (
              <Badge key={filterId} variant="secondary" className="text-xs">
                {filter.label}: {displayValue}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() =>
                    setFilterValues((prev) => ({
                      ...prev,
                      [filterId]: undefined,
                    }))
                  }
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Results */}
      {showResults && showResultsPanel && (
        <div className={cn("space-y-2", resultClassName)}>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-muted-foreground">{loadingMessage}</span>
            </div>
          )}

          {!loading &&
            results.length === 0 &&
            query.length >= minQueryLength && (
              <div className="text-center py-8 text-muted-foreground">
                {emptyMessage}
              </div>
            )}

          {!loading && results.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </div>
              {results.map((result) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  query={query}
                  onClick={handleResultClick}
                  renderResult={renderResult}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Autocomplete Component
export function Autocomplete<T = any>({
  onSearch,
  onSelect,
  placeholder = "Search...",
  className,
  disabled = false,
  clearOnSelect = true,
  renderResult,
  minQueryLength = 1,
  debounceMs = 300,
}: AutocompleteProps<T>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult<T>[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const debouncedQuery = useDebounce(query, debounceMs);

  // Perform search
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.length < minQueryLength) {
        setResults([]);
        setOpen(false);
        return;
      }

      setLoading(true);
      setOpen(true);

      try {
        const searchResults = await onSearch(debouncedQuery);
        setResults(Array.isArray(searchResults) ? searchResults : []);
      } catch (error) {
        console.error("Autocomplete search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, onSearch, minQueryLength]);

  const handleSelect = (result: SearchResult<T>) => {
    onSelect(result);
    if (clearOnSelect) {
      setQuery("");
      setResults([]);
    }
    setOpen(false);
  };

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn("pl-10", className)}
            disabled={disabled}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">
                  Searching...
                </span>
              </div>
            )}

            {!loading &&
              results.length === 0 &&
              query.length >= minQueryLength && (
                <CommandEmpty>No results found</CommandEmpty>
              )}

            {!loading && results.length > 0 && (
              <CommandGroup>
                {results.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer"
                  >
                    {renderResult ? (
                      renderResult(result)
                    ) : (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {highlightText(result.title, query)}
                        </div>
                        {result.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {highlightText(result.description, query)}
                          </div>
                        )}
                      </div>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Quick Search Component (minimal version)
export function QuickSearch({
  onSearch,
  placeholder = "Quick search...",
  className,
}: {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
