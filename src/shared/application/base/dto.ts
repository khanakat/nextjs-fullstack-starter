/**
 * Base Data Transfer Object interface
 * DTOs are used to transfer data between layers
 */
export interface BaseDto {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Base DTO class with common properties
 */
export abstract class Dto implements BaseDto {
  public readonly id: string;
  public readonly createdAt: Date;
  public readonly updatedAt?: Date;

  constructor(id: string, createdAt: Date, updatedAt?: Date) {
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Converts DTO to plain object
   */
  public toPlainObject(): Record<string, any> {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

/**
 * Pagination DTO for paginated results
 */
export interface PaginationDto {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination metadata for results
 */
export interface PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Paginated result DTO
 */
export interface PaginatedResultDto<T> {
  data: T[];
  pagination: PaginationMetaDto;
  total: number;
}

/**
 * Creates pagination metadata DTO
 */
export function createPaginationDto(
  page: number,
  limit: number,
  total: number
): PaginationMetaDto {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}