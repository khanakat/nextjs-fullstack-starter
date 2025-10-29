"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, ReactNode } from "react";

/**
 * React Query Configuration
 */
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Time before data is considered stale
        staleTime: 60 * 1000, // 1 minute
        // Time before inactive queries are garbage collected
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        // Retry failed requests
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus (can be disabled per query)
        refetchOnWindowFocus: false,
        // Refetch on reconnect
        refetchOnReconnect: true,
        // Refetch on mount if data is stale
        refetchOnMount: true,
      },
      mutations: {
        // Retry failed mutations
        retry: 1,
        // Retry delay
        retryDelay: 1000,
      },
    },
  });
};

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Query Provider Component
 * Wraps the app with React Query context
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Create a client instance per render to avoid state sharing between requests
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}

/**
 * Query Keys for consistent caching
 */
export const queryKeys = {
  // User queries
  users: ["users"] as const,
  user: (id: string) => ["users", id] as const,
  userProfile: (id: string) => ["users", id, "profile"] as const,
  userPosts: (id: string, params?: any) =>
    ["users", id, "posts", params] as const,

  // Post queries
  posts: ["posts"] as const,
  post: (id: string) => ["posts", id] as const,
  postsByCategory: (categoryId: string, params?: any) =>
    ["posts", "category", categoryId, params] as const,
  postsByTag: (tagId: string, params?: any) =>
    ["posts", "tag", tagId, params] as const,
  postsByAuthor: (authorId: string, params?: any) =>
    ["posts", "author", authorId, params] as const,
  postsSearch: (params: any) => ["posts", "search", params] as const,

  // Comment queries
  comments: (postId: string) => ["posts", postId, "comments"] as const,
  comment: (id: string) => ["comments", id] as const,

  // Category queries
  categories: ["categories"] as const,
  category: (id: string) => ["categories", id] as const,
  categoriesWithCounts: ["categories", "with-counts"] as const,

  // Tag queries
  tags: ["tags"] as const,
  tag: (id: string) => ["tags", id] as const,
  tagsWithCounts: ["tags", "with-counts"] as const,

  // Notification queries
  notifications: (userId: string) => ["notifications", userId] as const,
  notificationsUnread: (userId: string) =>
    ["notifications", userId, "unread"] as const,

  // Settings queries
  settings: ["settings"] as const,
  setting: (key: string) => ["settings", key] as const,

  // Analytics/Stats queries
  stats: ["stats"] as const,
  userStats: (userId: string) => ["stats", "user", userId] as const,
  postStats: (postId: string) => ["stats", "post", postId] as const,

  // Media queries
  media: ["media"] as const,
  userMedia: (userId: string) => ["media", "user", userId] as const,
} as const;

/**
 * Common query options
 */
export const queryOptions = {
  // Quick queries (for autocomplete, search suggestions)
  quick: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  },

  // Static data (rarely changes)
  static: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },

  // User-specific data
  user: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },

  // Real-time data
  realtime: {
    staleTime: 0, // Always considered stale
    gcTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  },

  // Infinite query defaults
  infinite: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    getNextPageParam: (lastPage: any) => {
      return lastPage?.pagination?.hasNext
        ? lastPage.pagination.page + 1
        : undefined;
    },
    initialPageParam: 1,
  },
} as const;

/**
 * Mutation options for common operations
 */
export const mutationOptions = {
  // Optimistic updates
  optimistic: {
    // Example: Update cache immediately, rollback on error
    onMutate: async (_variables: any) => {
      // Cancel outgoing refetches
      // Update cache optimistically
      // Return context for rollback
    },
    onError: (_error: any, _variables: any, _context: any) => {
      // Rollback optimistic update
    },
    onSettled: () => {
      // Always refetch after mutation
    },
  },

  // Standard mutations with invalidation
  standard: {
    onSuccess: (_data: any, _variables: any) => {
      // Invalidate relevant queries
    },
    onError: (error: any) => {
      // Handle error (show toast, etc.)
      console.error("Mutation error:", error);
    },
  },
} as const;
