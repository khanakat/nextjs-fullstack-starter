import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Base API hook for standardized API calls
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    type: string;
    message: string;
    details?: any;
    validationErrors?: any;
    timestamp: string;
  };
  timestamp: string;
}

/**
 * Custom hook for API queries with error handling
 */
export function useApiQuery<T>(
  key: string[],
  fetcher: () => Promise<ApiResponse<T>>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
  }
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const response = await fetcher();
      if (!response.success && response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    enabled: options?.enabled,
    staleTime: options?.staleTime,
    gcTime: options?.cacheTime,
  });
}

/**
 * Custom hook for API mutations with error handling and optimistic updates
 */
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    invalidateQueries?: string[][];
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await mutationFn(variables);
      if (!response.success && response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showSuccessToast !== false) {
        toast.success(options?.successMessage || 'Operation completed successfully');
      }

      // Invalidate queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      // Call custom success handler
      options?.onSuccess?.(data!, variables);
    },
    onError: (error: Error, variables) => {
      // Show error toast
      if (options?.showErrorToast !== false) {
        toast.error(error.message || 'An error occurred');
      }

      // Call custom error handler
      options?.onError?.(error, variables);
    },
  });
}

/**
 * Hook for optimistic updates
 */
export function useOptimisticUpdate<T>(queryKey: string[]) {
  const queryClient = useQueryClient();

  const updateOptimistically = (updater: (old: T | undefined) => T) => {
    queryClient.setQueryData(queryKey, updater);
  };

  const revertOptimisticUpdate = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  return { updateOptimistically, revertOptimisticUpdate };
}