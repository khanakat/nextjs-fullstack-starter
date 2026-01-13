import { PrismaUserRepository } from '../../../../slices/user-management/infrastructure/repositories/prisma-user-repository';
import { User, UserRole } from '@/slices/user-management/domain/entities/user';
import { UniqueId } from '@/shared/domain/value-objects/unique-id';
import { Email } from '@/shared/domain/value-objects/email';
import { UserFactory } from '@/__tests__/factories/user-factory';

// Mock PrismaClient
const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
};

describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;
  let mockUser: User;
  let mockUserData: any;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PrismaUserRepository(mockPrismaClient as any);
    
    mockUser = UserFactory.create({
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      role: UserRole.USER,
    });

    mockUserData = {
      id: mockUser.id.id,
      clerkId: mockUser.clerkId,
      email: mockUser.email,
      name: mockUser.name,
      username: mockUser.username,
      imageUrl: mockUser.imageUrl,
      bio: mockUser.bio,
      location: mockUser.location,
      website: mockUser.website,
      role: mockUser.role,
      createdAt: mockUser.createdAt,
      updatedAt: mockUser.updatedAt,
    };
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUserData);

      const result = await repository.findById(mockUser.id);

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id.id },
      });
      expect(result).toBeInstanceOf(User);
      expect(result?.id.id).toBe(mockUser.id.id);
      expect(result?.email).toBe(mockUser.email);
    });

    it('should return null when user not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById(new UniqueId('c1234567890abcdef'));

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockPrismaClient.user.findUnique.mockRejectedValue(error);

      await expect(repository.findById(mockUser.id)).rejects.toThrow(error);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUserData);

      const email = new Email('test@example.com');
      const result = await repository.findByEmail(email);

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: email.email },
      });
      expect(result).toBeInstanceOf(User);
      expect(result?.email).toBe(email.email);
    });

    it('should return null when user not found by email', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const email = new Email('nonexistent@example.com');
      const result = await repository.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('findByClerkId', () => {
    it('should return user when found by clerk ID', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUserData);

      const result = await repository.findByClerkId('clerk_123');

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: 'clerk_123' },
      });
      expect(result).toBeInstanceOf(User);
    });

    it('should return null when user not found by clerk ID', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByClerkId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should return user when found by username', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUserData);

      const result = await repository.findByUsername('testuser');

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(result).toBeInstanceOf(User);
    });

    it('should return null when user not found by username', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should save new user', async () => {
      mockPrismaClient.user.upsert.mockResolvedValue(mockUserData);

      await repository.save(mockUser);

      expect(mockPrismaClient.user.upsert).toHaveBeenCalledWith({
        where: { id: mockUser.id.id },
        create: {
          id: mockUser.id.id,
          clerkId: mockUser.clerkId,
          email: mockUser.email,
          name: mockUser.name,
          username: mockUser.username,
          imageUrl: mockUser.imageUrl,
          bio: mockUser.bio,
          location: mockUser.location,
          website: mockUser.website,
          role: mockUser.role,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
        update: {
          clerkId: mockUser.clerkId,
          email: mockUser.email,
          name: mockUser.name,
          username: mockUser.username,
          imageUrl: mockUser.imageUrl,
          bio: mockUser.bio,
          location: mockUser.location,
          website: mockUser.website,
          role: mockUser.role,
          updatedAt: mockUser.updatedAt,
        },
      });
    });

    it('should update existing user', async () => {
      const updatedUser = UserFactory.create({
        id: mockUser.id.id,
        email: 'updated@example.com',
        name: 'Updated User',
      });

      mockPrismaClient.user.upsert.mockResolvedValue({
        ...mockUserData,
        email: 'updated@example.com',
        name: 'Updated User',
      });

      await repository.save(updatedUser);

      expect(mockPrismaClient.user.upsert).toHaveBeenCalledWith({
        where: { id: updatedUser.id.id },
        create: expect.objectContaining({
          email: 'updated@example.com',
          name: 'Updated User',
        }),
        update: expect.objectContaining({
          email: 'updated@example.com',
          name: 'Updated User',
        }),
      });
    });

    it('should handle save errors', async () => {
      const error = new Error('Unique constraint violation');
      mockPrismaClient.user.upsert.mockRejectedValue(error);

      await expect(repository.save(mockUser)).rejects.toThrow(error);
    });
  });

  describe('delete', () => {
    it('should delete user by ID', async () => {
      mockPrismaClient.user.delete.mockResolvedValue(mockUserData);

      await repository.delete(mockUser.id);

      expect(mockPrismaClient.user.delete).toHaveBeenCalledWith({
        where: { id: mockUser.id.id },
      });
    });

    it('should handle delete errors', async () => {
      const error = new Error('User not found');
      mockPrismaClient.user.delete.mockRejectedValue(error);

      await expect(repository.delete(mockUser.id)).rejects.toThrow(error);
    });
  });

  describe('exists', () => {
    it('should return true when user exists', async () => {
      mockPrismaClient.user.count.mockResolvedValue(1);

      const result = await repository.exists(mockUser.id);

      expect(mockPrismaClient.user.count).toHaveBeenCalledWith({
        where: { id: mockUser.id.id },
      });
      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      mockPrismaClient.user.count.mockResolvedValue(0);

      const result = await repository.exists(new UniqueId('c1234567890abcdef'));

      expect(result).toBe(false);
    });
  });

  describe('existsByEmail', () => {
    it('should return true when user exists by email', async () => {
      mockPrismaClient.user.count.mockResolvedValue(1);

      const email = new Email('test@example.com');
      const result = await repository.existsByEmail(email);

      expect(mockPrismaClient.user.count).toHaveBeenCalledWith({
        where: { email: email.email },
      });
      expect(result).toBe(true);
    });

    it('should return false when user does not exist by email', async () => {
      mockPrismaClient.user.count.mockResolvedValue(0);

      const email = new Email('nonexistent@example.com');
      const result = await repository.existsByEmail(email);

      expect(result).toBe(false);
    });
  });

  describe('existsByUsername', () => {
    it('should return true when user exists by username', async () => {
      mockPrismaClient.user.count.mockResolvedValue(1);

      const result = await repository.existsByUsername('testuser');

      expect(mockPrismaClient.user.count).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(result).toBe(true);
    });

    it('should return false when user does not exist by username', async () => {
      mockPrismaClient.user.count.mockResolvedValue(0);

      const result = await repository.existsByUsername('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('findMany', () => {
    const mockUsersData = [
      { ...mockUserData, id: 'c1234567890abcdef', email: 'user1@example.com', name: 'User 1' },
      { ...mockUserData, id: 'c234567890abcdef1', email: 'user2@example.com', name: 'User 2' },
      { ...mockUserData, id: 'c34567890abcdef12', email: 'user3@example.com', name: 'User 3' },
    ];

    it('should return paginated users with default parameters', async () => {
      mockPrismaClient.user.count.mockResolvedValue(3);
      mockPrismaClient.user.findMany.mockResolvedValue(mockUsersData);

      const result = await repository.findMany({});

      expect(mockPrismaClient.user.count).toHaveBeenCalledWith({ where: {} });
      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      expect(result.users).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should handle pagination parameters', async () => {
      mockPrismaClient.user.count.mockResolvedValue(25);
      mockPrismaClient.user.findMany.mockResolvedValue(mockUsersData.slice(0, 2));

      const result = await repository.findMany({
        page: 2,
        limit: 5,
      });

      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 5, // (page - 1) * limit = (2 - 1) * 5
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(5);
    });

    it('should handle search parameters', async () => {
      mockPrismaClient.user.count.mockResolvedValue(1);
      mockPrismaClient.user.findMany.mockResolvedValue([mockUsersData[0]]);

      const result = await repository.findMany({
        search: 'john',
      });

      expect(mockPrismaClient.user.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'john', mode: 'insensitive' } },
            { username: { contains: 'john', mode: 'insensitive' } },
            { email: { contains: 'john', mode: 'insensitive' } },
          ],
        },
      });

      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'john', mode: 'insensitive' } },
            { username: { contains: 'john', mode: 'insensitive' } },
            { email: { contains: 'john', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle role filter', async () => {
      mockPrismaClient.user.count.mockResolvedValue(2);
      mockPrismaClient.user.findMany.mockResolvedValue(mockUsersData.slice(0, 2));

      const result = await repository.findMany({
        role: UserRole.ADMIN,
      });

      expect(mockPrismaClient.user.count).toHaveBeenCalledWith({
        where: { role: UserRole.ADMIN },
      });

      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
        where: { role: UserRole.ADMIN },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle combined search and role filter', async () => {
      mockPrismaClient.user.count.mockResolvedValue(1);
      mockPrismaClient.user.findMany.mockResolvedValue([mockUsersData[0]]);

      const result = await repository.findMany({
        search: 'admin',
        role: UserRole.ADMIN,
      });

      expect(mockPrismaClient.user.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'admin', mode: 'insensitive' } },
            { username: { contains: 'admin', mode: 'insensitive' } },
            { email: { contains: 'admin', mode: 'insensitive' } },
          ],
          role: UserRole.ADMIN,
        },
      });
    });

    it('should handle empty results', async () => {
      mockPrismaClient.user.count.mockResolvedValue(0);
      mockPrismaClient.user.findMany.mockResolvedValue([]);

      const result = await repository.findMany({});

      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle database errors in findMany', async () => {
      const error = new Error('Database query failed');
      mockPrismaClient.user.count.mockRejectedValue(error);

      await expect(repository.findMany({})).rejects.toThrow(error);
    });
  });

  describe('Domain Mapping', () => {
    it('should correctly map domain entity to persistence data', async () => {
      const user = UserFactory.create({
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        role: UserRole.ADMIN,
        bio: 'Test bio',
        location: 'Test location',
        website: 'https://test.com',
      });

      mockPrismaClient.user.upsert.mockResolvedValue({});

      await repository.save(user);

      const expectedPersistenceData = {
        id: user.id.id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        username: user.username,
        imageUrl: user.imageUrl,
        bio: user.bio,
        location: user.location,
        website: user.website,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      expect(mockPrismaClient.user.upsert).toHaveBeenCalledWith({
        where: { id: user.id.id },
        create: expectedPersistenceData,
        update: {
          ...expectedPersistenceData,
          id: undefined,
          createdAt: undefined,
        },
      });
    });

    it('should correctly map persistence data to domain entity', async () => {
      const persistenceData = {
        id: 'clhqr2k3z0000qzrmn4n4n4n4',
        clerkId: 'clerk_123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        imageUrl: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        location: 'Test location',
        website: 'https://test.com',
        role: UserRole.USER,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(persistenceData);

      const result = await repository.findById(new UniqueId('clhqr2k3z0000qzrmn4n4n4n4'));

      expect(result).toBeInstanceOf(User);
      expect(result?.id.id).toBe(persistenceData.id);
      expect(result?.clerkId).toBe(persistenceData.clerkId);
      expect(result?.email).toBe(persistenceData.email);
      expect(result?.name).toBe(persistenceData.name);
      expect(result?.username).toBe(persistenceData.username);
      expect(result?.imageUrl).toBe(persistenceData.imageUrl);
      expect(result?.bio).toBe(persistenceData.bio);
      expect(result?.location).toBe(persistenceData.location);
      expect(result?.website).toBe(persistenceData.website);
      expect(result?.role).toBe(persistenceData.role);
      expect(result?.createdAt).toEqual(persistenceData.createdAt);
      expect(result?.updatedAt).toEqual(persistenceData.updatedAt);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.name = 'TimeoutError';
      mockPrismaClient.user.findUnique.mockRejectedValue(timeoutError);

      await expect(repository.findById(mockUser.id)).rejects.toThrow('Connection timeout');
    });

    it('should handle constraint violations', async () => {
      const constraintError = new Error('Unique constraint failed');
      constraintError.name = 'P2002';
      mockPrismaClient.user.upsert.mockRejectedValue(constraintError);

      await expect(repository.save(mockUser)).rejects.toThrow('Unique constraint failed');
    });

    it('should handle foreign key violations', async () => {
      const fkError = new Error('Foreign key constraint failed');
      fkError.name = 'P2003';
      mockPrismaClient.user.delete.mockRejectedValue(fkError);

      await expect(repository.delete(mockUser.id)).rejects.toThrow('Foreign key constraint failed');
    });
  });
});