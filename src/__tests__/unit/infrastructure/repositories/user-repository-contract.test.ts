import { IUserRepository } from '../../../../slices/user-management/domain/repositories/user-repository';
import { User, UserRole } from '../../../../slices/user-management/domain/entities/user';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { Email } from '../../../../shared/domain/value-objects/email';
import { UserFactory } from '../../../factories/user-factory';

/**
 * Mock User Repository Implementation for Testing
 * Tests the repository interface contract without external dependencies
 */
class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: UniqueId): Promise<User | null> {
    return this.users.get(id.id) || null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    return Array.from(this.users.values())
      .find(user => user.email === email.email) || null;
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    return Array.from(this.users.values())
      .find(user => user.clerkId === clerkId) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return Array.from(this.users.values())
      .find(user => user.username === username) || null;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id.id, user);
  }

  async delete(id: UniqueId): Promise<void> {
    this.users.delete(id.id);
  }

  async exists(id: UniqueId): Promise<boolean> {
    return this.users.has(id.id);
  }

  async existsByEmail(email: Email): Promise<boolean> {
    return Array.from(this.users.values())
      .some(user => user.email === email.email);
  }

  async existsByUsername(username: string): Promise<boolean> {
    return Array.from(this.users.values())
      .some(user => user.username === username);
  }

  async findMany(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let users = Array.from(this.users.values());

    // Apply filters
    if (params.search) {
      const search = params.search.toLowerCase();
      users = users.filter(user => 
        user.name?.toLowerCase().includes(search) ||
        user.username?.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    }

    if (params.role) {
      users = users.filter(user => user.role === params.role);
    }

    // Apply pagination
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const total = users.length;
    const totalPages = Math.ceil(total / (limit === 0 ? 1 : limit));
    const skip = (page - 1) * limit;
    const paginatedUsers = limit === 0 ? [] : users.slice(skip, skip + limit);

    return {
      users: paginatedUsers,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Helper methods for testing
  clear(): void {
    this.users.clear();
  }

  getAll(): User[] {
    return Array.from(this.users.values());
  }
}

describe('User Repository Contract', () => {
  let repository: IUserRepository;
  let mockUser: User;

  beforeEach(() => {
    repository = new MockUserRepository();
    mockUser = UserFactory.create({
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      role: UserRole.USER,
    });
  });

  describe('Basic CRUD Operations', () => {
    it('should save and retrieve user by ID', async () => {
      await repository.save(mockUser);
      
      const retrieved = await repository.findById(mockUser.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id.id).toBe(mockUser.id.id);
      expect(retrieved?.email).toBe(mockUser.email);
      expect(retrieved?.name).toBe(mockUser.name);
    });

    it('should return null when user not found by ID', async () => {
      const nonExistentId = UniqueId.generate();
      
      const result = await repository.findById(nonExistentId);
      
      expect(result).toBeNull();
    });

    it('should delete user', async () => {
      await repository.save(mockUser);
      
      await repository.delete(mockUser.id);
      
      const retrieved = await repository.findById(mockUser.id);
      expect(retrieved).toBeNull();
    });

    it('should check if user exists', async () => {
      expect(await repository.exists(mockUser.id)).toBe(false);
      
      await repository.save(mockUser);
      
      expect(await repository.exists(mockUser.id)).toBe(true);
    });
  });

  describe('Find by Email', () => {
    it('should find user by email', async () => {
      await repository.save(mockUser);
      
      const email = new Email('test@example.com');
      const result = await repository.findByEmail(email);
      
      expect(result).toBeDefined();
      expect(result?.email).toBe(email.email);
    });

    it('should return null when user not found by email', async () => {
      const email = new Email('nonexistent@example.com');
      
      const result = await repository.findByEmail(email);
      
      expect(result).toBeNull();
    });

    it('should check if user exists by email', async () => {
      const email = new Email('test@example.com');
      
      expect(await repository.existsByEmail(email)).toBe(false);
      
      await repository.save(mockUser);
      
      expect(await repository.existsByEmail(email)).toBe(true);
    });
  });

  describe('Find by Clerk ID', () => {
    it('should find user by clerk ID', async () => {
      await repository.save(mockUser);
      
      const result = await repository.findByClerkId(mockUser.clerkId!);
      
      expect(result).toBeDefined();
      expect(result?.clerkId).toBe(mockUser.clerkId);
    });

    it('should return null when user not found by clerk ID', async () => {
      const result = await repository.findByClerkId('non-existent');
      
      expect(result).toBeNull();
    });
  });

  describe('Find by Username', () => {
    it('should find user by username', async () => {
      await repository.save(mockUser);
      
      const result = await repository.findByUsername('testuser');
      
      expect(result).toBeDefined();
      expect(result?.username).toBe('testuser');
    });

    it('should return null when user not found by username', async () => {
      const result = await repository.findByUsername('nonexistent');
      
      expect(result).toBeNull();
    });

    it('should check if user exists by username', async () => {
      expect(await repository.existsByUsername('testuser')).toBe(false);
      
      await repository.save(mockUser);
      
      expect(await repository.existsByUsername('testuser')).toBe(true);
    });
  });

  describe('Pagination and Search', () => {
    beforeEach(async () => {
      // Create multiple test users
      const users = [
        UserFactory.create({ email: 'admin@example.com', name: 'Admin User', username: 'admin', role: UserRole.ADMIN }),
        UserFactory.create({ email: 'user1@example.com', name: 'User One', username: 'user1', role: UserRole.USER }),
        UserFactory.create({ email: 'user2@example.com', name: 'User Two', username: 'user2', role: UserRole.USER }),
        UserFactory.create({ email: 'moderator@example.com', name: 'Moderator', username: 'mod', role: UserRole.MODERATOR }),
      ];

      for (const user of users) {
        await repository.save(user);
      }
    });

    it('should return paginated results with default parameters', async () => {
      const result = await repository.findMany({});
      
      expect(result.users).toHaveLength(4);
      expect(result.total).toBe(4);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should handle pagination parameters', async () => {
      const result = await repository.findMany({
        page: 1,
        limit: 2,
      });
      
      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(4);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('should filter by search term', async () => {
      const result = await repository.findMany({
        search: 'admin',
      });
      
      expect(result.users).toHaveLength(1);
      expect(result.users[0].username).toBe('admin');
      expect(result.total).toBe(1);
    });

    it('should filter by role', async () => {
      const result = await repository.findMany({
        role: UserRole.USER,
      });
      
      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
      result.users.forEach(user => {
        expect(user.role).toBe(UserRole.USER);
      });
    });

    it('should combine search and role filters', async () => {
      const result = await repository.findMany({
        search: 'user',
        role: UserRole.USER,
      });
      
      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should return empty results when no matches', async () => {
      const result = await repository.findMany({
        search: 'nonexistent',
      });
      
      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle second page of results', async () => {
      const result = await repository.findMany({
        page: 2,
        limit: 2,
      });
      
      expect(result.users).toHaveLength(2);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(2);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain user data integrity after save', async () => {
      const originalUser = UserFactory.create({
        email: 'integrity@example.com',
        name: 'Integrity Test',
        username: 'integrity',
        role: UserRole.ADMIN,
        bio: 'Test bio',
        location: 'Test location',
        website: 'https://test.com',
      });

      await repository.save(originalUser);
      
      const retrieved = await repository.findById(originalUser.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id.id).toBe(originalUser.id.id);
      expect(retrieved?.email).toBe(originalUser.email);
      expect(retrieved?.name).toBe(originalUser.name);
      expect(retrieved?.username).toBe(originalUser.username);
      expect(retrieved?.role).toBe(originalUser.role);
      expect(retrieved?.bio).toBe(originalUser.bio);
      expect(retrieved?.location).toBe(originalUser.location);
      expect(retrieved?.website).toBe(originalUser.website);
    });

    it('should update existing user when saving with same ID', async () => {
      await repository.save(mockUser);
      
      // Update user properties
      mockUser.updateName('Updated Name');
      
      await repository.save(mockUser);
      
      const retrieved = await repository.findById(mockUser.id);
      expect(retrieved?.name).toBe('Updated Name');
    });

    it('should handle multiple users with different properties', async () => {
      const users = [
        UserFactory.create({ email: 'user1@test.com', role: UserRole.USER }),
        UserFactory.create({ email: 'admin@test.com', role: UserRole.ADMIN }),
        UserFactory.create({ email: 'mod@test.com', role: UserRole.MODERATOR }),
      ];

      for (const user of users) {
        await repository.save(user);
      }

      for (const user of users) {
        const retrieved = await repository.findById(user.id);
        expect(retrieved).toBeDefined();
        expect(retrieved?.email).toBe(user.email);
        expect(retrieved?.role).toBe(user.role);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty search string', async () => {
      await repository.save(mockUser);
      
      const result = await repository.findMany({
        search: '',
      });
      
      expect(result.users).toHaveLength(1);
    });

    it('should handle case-insensitive search', async () => {
      await repository.save(mockUser);
      
      const result = await repository.findMany({
        search: 'TEST',
      });
      
      expect(result.users).toHaveLength(1);
    });

    it('should handle page beyond available results', async () => {
      await repository.save(mockUser);
      
      const result = await repository.findMany({
        page: 10,
        limit: 5,
      });
      
      expect(result.users).toHaveLength(0);
      expect(result.page).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should handle zero limit gracefully', async () => {
      await repository.save(mockUser);
      
      const result = await repository.findMany({
        limit: 0,
      });
      
      expect(result.users).toHaveLength(0);
    });
  });
});