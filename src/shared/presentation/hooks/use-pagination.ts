import { useState, useMemo } from 'react';
import { PaginationDto, PaginatedResultDto } from '../../application/base/dto';

export interface UsePaginationReturn {
  pagination: PaginationDto;
  setPagination: (pagination: Partial<PaginationDto>) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSort: (sortBy: string, sortOrder?: 'asc' | 'desc') => void;
  resetPagination: () => void;
}

const DEFAULT_PAGINATION: PaginationDto = {
  page: 1,
  pageSize: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/**
 * Hook for managing pagination state
 */
export function usePagination(
  initialPagination: Partial<PaginationDto> = {}
): UsePaginationReturn {
  const [pagination, setPaginationState] = useState<PaginationDto>({
    ...DEFAULT_PAGINATION,
    ...initialPagination,
  });

  const setPagination = (newPagination: Partial<PaginationDto>) => {
    setPaginationState(prev => ({
      ...prev,
      ...newPagination,
    }));
  };

  const setPage = (page: number) => {
    setPagination({ page });
  };

  const setPageSize = (pageSize: number) => {
    setPagination({ pageSize, page: 1 }); // Reset to first page when changing page size
  };

  const setSort = (sortBy: string, sortOrder: 'asc' | 'desc' = 'asc') => {
    setPagination({ sortBy, sortOrder, page: 1 }); // Reset to first page when changing sort
  };

  const resetPagination = () => {
    setPaginationState({
      ...DEFAULT_PAGINATION,
      ...initialPagination,
    });
  };

  return {
    pagination,
    setPagination,
    setPage,
    setPageSize,
    setSort,
    resetPagination,
  };
}

/**
 * Hook for calculating pagination metadata
 */
export function usePaginationMeta<T>(
  paginatedResult: PaginatedResultDto<T> | null,
  pagination: PaginationDto
) {
  return useMemo(() => {
    if (!paginatedResult) {
      return {
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        startItem: 0,
        endItem: 0,
      };
    }

    const { total } = paginatedResult;
    const { page, pageSize } = pagination;

    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, total);

    return {
      totalPages,
      hasNextPage,
      hasPreviousPage,
      startItem,
      endItem,
    };
  }, [paginatedResult, pagination]);
}