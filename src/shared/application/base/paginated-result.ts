/**
 * Represents a paginated result set
 */
export class PaginatedResult<T> {
  constructor(
    public readonly items: T[],
    public readonly totalCount: number,
    public readonly page: number,
    public readonly pageSize: number
  ) {}

  // Aliases expected by some tests and repositories
  get data(): T[] {
    return this.items;
  }

  get total(): number {
    return this.totalCount;
  }

  get limit(): number {
    return this.pageSize;
  }

  /**
   * Get the total number of pages
   */
  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  /**
   * Check if there is a next page
   */
  get hasNextPage(): boolean {
    return this.page < this.totalPages;
  }

  /**
   * Check if there is a previous page
   */
  get hasPreviousPage(): boolean {
    return this.page > 1;
  }

  /**
   * Get the start index of current page items
   */
  get startIndex(): number {
    return (this.page - 1) * this.pageSize;
  }

  /**
   * Get the end index of current page items
   */
  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize - 1, this.totalCount - 1);
  }

  /**
   * Check if the result set is empty
   */
  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Map the items to a different type
   */
  map<U>(mapper: (item: T) => U): PaginatedResult<U> {
    return new PaginatedResult(
      this.items.map(mapper),
      this.totalCount,
      this.page,
      this.pageSize
    );
  }

  /**
   * Create a paginated result from an array and pagination info
   */
  static create<T>(
    items: T[],
    totalCount: number,
    page: number,
    pageSize: number
  ): PaginatedResult<T> {
    return new PaginatedResult(items, totalCount, page, pageSize);
  }

  /**
   * Create an empty paginated result
   */
  static empty<T>(page: number = 1, pageSize: number = 10): PaginatedResult<T> {
    return new PaginatedResult([], 0, page, pageSize);
  }

  /**
   * Convert to a plain object for serialization
   */
  toObject() {
    return {
      items: this.items,
      totalCount: this.totalCount,
      page: this.page,
      pageSize: this.pageSize,
      totalPages: this.totalPages,
      hasNextPage: this.hasNextPage,
      hasPreviousPage: this.hasPreviousPage,
      startIndex: this.startIndex,
      endIndex: this.endIndex,
      isEmpty: this.isEmpty,
    };
  }
}