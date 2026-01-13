import { useState, useEffect, useCallback } from 'react';
import { UserDto, UserProfileDto } from '../../application/dtos/user-dto';
import { PaginatedResultDto } from '@/shared/application/base/dto';

interface UseUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

interface UseUsersResult {
  users: UserDto[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing users list
 */
export function useUsers(params: UseUsersParams = {}): UseUsersResult {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.role) searchParams.set('role', params.role);

      const response = await fetch(`/api/users?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data: PaginatedResultDto<UserDto> = await response.json();
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [params.page, params.limit, params.search, params.role]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    pagination,
    refetch: fetchUsers,
  };
}

interface UseUserParams {
  userId: string;
}

interface UseUserResult {
  user: UserDto | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing single user
 */
export function useUser({ userId }: UseUserParams): UseUserResult {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const userData: UserDto = await response.json();
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [fetchUser, userId]);

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
  };
}

interface CreateUserParams {
  clerkId: string;
  email: string;
  name?: string;
  username?: string;
  imageUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  role?: string;
}

interface UpdateUserParams {
  name?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  imageUrl?: string;
}

interface UseUserMutationsResult {
  createUser: (params: CreateUserParams) => Promise<UserDto>;
  updateUser: (userId: string, params: UpdateUserParams) => Promise<UserDto>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for user mutations (create, update)
 */
export function useUserMutations(): UseUserMutationsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = async (params: CreateUserParams): Promise<UserDto> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, params: UpdateUserParams): Promise<UserDto> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createUser,
    updateUser,
    loading,
    error,
  };
}