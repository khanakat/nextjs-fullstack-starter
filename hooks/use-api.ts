import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, queryOptions } from "@/lib/react-query";
import axios from "axios";

/**
 * API Client Configuration
 */
export const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for auth tokens
api.interceptors.request.use(
  (config: any) => {
    // Add auth token if available (Clerk or NextAuth)
    // This will depend on your auth provider
    const token = typeof window !== "undefined" ? localStorage.getItem("__session") || "" : "";
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: any) => {
    return response;
  },
  (error: any) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Redirect to login or refresh token
      if (typeof window !== "undefined") {
        window.location.href = "/sign-in";
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Post Hooks
 */
export function usePosts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  published?: boolean;
  featured?: boolean;
  categoryId?: string;
  authorId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.postsSearch(params),
    queryFn: async () => {
      const { data } = await api.get("/posts", { params });
      return data;
    },
    ...queryOptions.user,
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: queryKeys.post(id),
    queryFn: async () => {
      const { data } = await api.get(`/posts/${id}`);
      return data;
    },
    enabled: !!id,
    ...queryOptions.user,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postData: any) => {
      const { data } = await api.post("/posts", postData);
      return data;
    },
    onSuccess: () => {
      // Invalidate posts queries
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
}

export function useUpdatePost(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postData: any) => {
      const { data } = await api.patch(`/posts/${id}`, postData);
      return data;
    },
    onSuccess: () => {
      // Invalidate specific post and posts list
      queryClient.invalidateQueries({ queryKey: queryKeys.post(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
}

export function useDeletePost(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/posts/${id}`);
    },
    onSuccess: () => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: queryKeys.post(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
}

/**
 * User Hooks
 */
export function useUsers(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const { data } = await api.get("/users", { params });
      return data;
    },
    ...queryOptions.user,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}`);
      return data;
    },
    enabled: !!id,
    ...queryOptions.user,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data } = await api.get("/auth/me");
      return data;
    },
    ...queryOptions.user,
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: any) => {
      const { data } = await api.patch(`/users/${id}`, userData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user(id) });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

/**
 * Category Hooks
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const { data } = await api.get("/categories");
      return data;
    },
    ...queryOptions.static,
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: queryKeys.category(id),
    queryFn: async () => {
      const { data } = await api.get(`/categories/${id}`);
      return data;
    },
    enabled: !!id,
    ...queryOptions.static,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (categoryData: any) => {
      const { data } = await api.post("/categories", categoryData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

/**
 * Comment Hooks
 */
export function useComments(postId: string) {
  return useQuery({
    queryKey: queryKeys.comments(postId),
    queryFn: async () => {
      const { data } = await api.get(`/posts/${postId}/comments`);
      return data;
    },
    enabled: !!postId,
    ...queryOptions.user,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (commentData: any) => {
      const { data } = await api.post("/comments", commentData);
      return data;
    },
    onSuccess: (data) => {
      // Invalidate comments for the specific post
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.comments(data.postId) 
      });
    },
  });
}

/**
 * Tag Hooks
 */
export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags,
    queryFn: async () => {
      const { data } = await api.get("/tags");
      return data;
    },
    ...queryOptions.static,
  });
}

/**
 * Notification Hooks
 */
export function useNotifications(userId: string) {
  return useQuery({
    queryKey: queryKeys.notifications(userId),
    queryFn: async () => {
      const { data } = await api.get(`/notifications?userId=${userId}`);
      return data;
    },
    enabled: !!userId,
    ...queryOptions.realtime,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.notifications("") // Will need actual user ID
      });
    },
  });
}

/**
 * File Upload Hook
 */
export function useFileUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const { data } = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      return data;
    },
  });
}

/**
 * Settings Hooks
 */
export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: async () => {
      const { data } = await api.get("/settings");
      return data;
    },
    ...queryOptions.static,
  });
}

export function useSetting(key: string) {
  return useQuery({
    queryKey: queryKeys.setting(key),
    queryFn: async () => {
      const { data } = await api.get(`/settings/${key}`);
      return data;
    },
    enabled: !!key,
    ...queryOptions.static,
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data } = await api.patch(`/settings/${key}`, { value });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });
}