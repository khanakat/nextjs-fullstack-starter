'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPosts, getPostById, getUserPosts, getPublishedPosts } from '@/actions/get-posts'
import type { PostWithAuthorAndTags, CreatePostData, UpdatePostData, PostFilters, PaginationParams } from '@/types'

// Query keys
const POSTS_QUERY_KEY = 'posts'

interface UsePostsParams extends PostFilters, PaginationParams {}

// Get posts with filtering and pagination
export function usePosts(params: UsePostsParams = {}) {
  return useQuery({
    queryKey: [POSTS_QUERY_KEY, 'list', params],
    queryFn: () => getPosts({
      userId: params.authorId,
      published: params.published,
      searchTerm: params.search,
      limit: params.pageSize || 10,
      offset: ((params.page || 1) - 1) * (params.pageSize || 10),
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get single post by ID
export function usePost(postId: string) {
  return useQuery({
    queryKey: [POSTS_QUERY_KEY, 'detail', postId],
    queryFn: () => getPostById(postId),
    enabled: !!postId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get user's posts
export function useUserPosts(userId: string) {
  return useQuery({
    queryKey: [POSTS_QUERY_KEY, 'user', userId],
    queryFn: () => getUserPosts(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Get published posts
export function usePublishedPosts(limit?: number) {
  return useQuery({
    queryKey: [POSTS_QUERY_KEY, 'published', limit],
    queryFn: () => getPublishedPosts(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Create post mutation
export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePostData) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create post')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY] })
    },
    onError: (error) => {
      console.error('Error creating post:', error)
    },
  })
}

// Update post mutation
export function useUpdatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdatePostData) => {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update post')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate specific post and lists
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY, 'detail', variables.id] })
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY, 'list'] })
    },
    onError: (error) => {
      console.error('Error updating post:', error)
    },
  })
}

// Delete post mutation
export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate all post queries
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY] })
    },
    onError: (error) => {
      console.error('Error deleting post:', error)
    },
  })
}

// Publish/unpublish post mutation
export function useTogglePostStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ postId, published }: { postId: string; published: boolean }) => {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ published }),
      })

      if (!response.ok) {
        throw new Error('Failed to update post status')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate specific post and lists
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY, 'detail', variables.postId] })
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY, 'list'] })
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY, 'published'] })
    },
    onError: (error) => {
      console.error('Error updating post status:', error)
    },
  })
}

// Optimistic updates for better UX
export function useOptimisticPostUpdate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdatePostData) => {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update post')
      }

      return response.json()
    },
    onMutate: async (newPost) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [POSTS_QUERY_KEY, 'detail', newPost.id] })

      // Snapshot previous value
      const previousPost = queryClient.getQueryData([POSTS_QUERY_KEY, 'detail', newPost.id])

      // Optimistically update to new value
      queryClient.setQueryData(
        [POSTS_QUERY_KEY, 'detail', newPost.id],
        (old: PostWithAuthorAndTags | undefined) =>
          old ? { ...old, ...newPost } : undefined
      )

      return { previousPost }
    },
    onError: (err, newPost, context) => {
      // Revert on error
      if (context?.previousPost) {
        queryClient.setQueryData(
          [POSTS_QUERY_KEY, 'detail', newPost.id],
          context.previousPost
        )
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY, 'detail', variables.id] })
    },
  })
}