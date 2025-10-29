import { useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UsePaginationProps {
  initialPage?: number;
  initialPageSize?: number;
  total?: number;
  serverSide?: boolean; // If true, uses URL params for state
}

export interface UsePaginationReturn {
  // State
  currentPage: number;
  pageSize: number;
  total: number;
  totalPages: number;

  // Actions
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setTotal: (total: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  resetPagination: () => void;

  // Computed
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;

  // For server-side pagination
  searchParams: URLSearchParams | null;
}

export function usePagination({
  initialPage = 1,
  initialPageSize = 10,
  total = 0,
  serverSide = false,
}: UsePaginationProps = {}): UsePaginationReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial values from URL params if server-side
  const getInitialPage = () => {
    if (serverSide && searchParams) {
      return Number(searchParams.get("page")) || initialPage;
    }
    return initialPage;
  };

  const getInitialPageSize = () => {
    if (serverSide && searchParams) {
      return Number(searchParams.get("pageSize")) || initialPageSize;
    }
    return initialPageSize;
  };

  // State
  const [page, setPageState] = useState(getInitialPage);
  const [pageSize, setPageSizeState] = useState(getInitialPageSize);
  const [totalItems, setTotalItems] = useState(total);

  // Computed values
  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / pageSize);
  }, [totalItems, pageSize]);

  const hasNextPage = useMemo(() => {
    return page < totalPages;
  }, [page, totalPages]);

  const hasPreviousPage = useMemo(() => {
    return page > 1;
  }, [page]);

  const startIndex = useMemo(() => {
    return (page - 1) * pageSize;
  }, [page, pageSize]);

  const endIndex = useMemo(() => {
    return Math.min(page * pageSize - 1, totalItems - 1);
  }, [page, pageSize, totalItems]);

  // Update URL params for server-side pagination
  const updateURLParams = useCallback(
    (newPage: number, newPageSize?: number) => {
      if (!serverSide) return;

      const params = new URLSearchParams(searchParams?.toString());

      if (newPage !== initialPage) {
        params.set("page", newPage.toString());
      } else {
        params.delete("page");
      }

      if (newPageSize && newPageSize !== initialPageSize) {
        params.set("pageSize", newPageSize.toString());
      } else if (newPageSize === initialPageSize) {
        params.delete("pageSize");
      }

      const paramString = params.toString();
      const newURL = paramString ? `${pathname}?${paramString}` : pathname;

      if (newURL) {
        router.push(newURL);
      }
    },
    [serverSide, searchParams, pathname, router, initialPage, initialPageSize],
  );

  // Actions
  const setPage = useCallback(
    (newPage: number) => {
      const validPage = Math.max(1, Math.min(newPage, totalPages));
      setPageState(validPage);
      updateURLParams(validPage);
    },
    [totalPages, updateURLParams],
  );

  const setPageSize = useCallback(
    (newPageSize: number) => {
      setPageSizeState(newPageSize);
      // Reset to page 1 when changing page size
      setPageState(1);
      updateURLParams(1, newPageSize);
    },
    [updateURLParams],
  );

  const setTotal = useCallback(
    (newTotal: number) => {
      setTotalItems(newTotal);
      // Adjust current page if it's now out of bounds
      const newTotalPages = Math.ceil(newTotal / pageSize);
      if (page > newTotalPages && newTotalPages > 0) {
        setPage(newTotalPages);
      }
    },
    [page, pageSize, setPage],
  );

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(page + 1);
    }
  }, [hasNextPage, page, setPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage(page - 1);
    }
  }, [hasPreviousPage, page, setPage]);

  const resetPagination = useCallback(() => {
    setPageState(initialPage);
    setPageSizeState(initialPageSize);
    updateURLParams(initialPage, initialPageSize);
  }, [initialPage, initialPageSize, updateURLParams]);

  return {
    // State
    currentPage: page,
    pageSize,
    total: totalItems,
    totalPages,

    // Actions
    setPage,
    setPageSize,
    setTotal,
    nextPage,
    previousPage,
    resetPagination,

    // Computed
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,

    // For server-side pagination
    searchParams: serverSide ? searchParams : null,
  };
}
