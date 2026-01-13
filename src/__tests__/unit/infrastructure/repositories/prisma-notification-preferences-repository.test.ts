import { PrismaClient } from '@prisma/client';
import { PrismaNotificationPreferencesRepository } from '../../../../../slices/notifications/infrastructure/repositories/prisma-notification-preferences-repository';
import { NotificationPreferences, CategoryPreference } from '../../../../../shared/domain/notifications/value-objects/notification-preferences';
import { NotificationCategory } from '../../../../../shared/domain/notifications/entities/notification';
import { ChannelType } from '../../../../../shared/domain/notifications/value-objects/notification-channel';

// Mock Prisma Client
const mockPrisma = {
  notificationPreferences: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

describe('PrismaNotificationPreferencesRepository', () => {
  let repository: PrismaNotificationPreferencesRepository;
  let mockPreferences: NotificationPreferences;
  let mockPrismaData: any;

  beforeEach(() => {
    repository = new PrismaNotificationPreferencesRepository(mockPrisma);
    jest.clearAllMocks();

    // Create mock domain objects
    const categoryPreferences: CategoryPreference[] = [
      {
        category: NotificationCategory.SYSTEM,
        enabled: true,
        channels: [ChannelType.EMAIL, ChannelType.IN_APP],
      },
      {
        category: NotificationCategory.REPORT,
        enabled: true,
        channels: [ChannelType.EMAIL],
      },
      {
        category: NotificationCategory.USER,
        enabled: false,
        channels: [],
      },
      {
        category: NotificationCategory.SECURITY,
        enabled: true,
        channels: [ChannelType.EMAIL, ChannelType.SMS, ChannelType.IN_APP],
      },
    ];

    mockPreferences = NotificationPreferences.create(
      'user-123',
      true,
      categoryPreferences,
      [ChannelType.EMAIL, ChannelType.IN_APP],
      {
        enabled: true,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'UTC',
      },
      {
        enabled: true,
        frequency: 'daily',
        time: '09:00',
        includeCategories: [NotificationCategory.SYSTEM, NotificationCategory.REPORT],
      },
      'en',
      'UTC'
    );

    // Mock Prisma data
    mockPrismaData = {
      userId: mockPreferences.userId,
      globalEnabled: mockPreferences.globalEnabled,
      categoryPreferences: mockPreferences.categoryPreferences,
      defaultChannels: mockPreferences.defaultChannels,
      quietHours: mockPreferences.quietHours,
      emailDigest: mockPreferences.emailDigest,
      language: mockPreferences.language,
      timezone: mockPreferences.timezone,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('save', () => {
    it('should save notification preferences using upsert', async () => {
      mockPrisma.notificationPreferences.upsert = jest.fn().mockResolvedValue(mockPrismaData);

      await repository.save(mockPreferences);

      expect(mockPrisma.notificationPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: mockPreferences.userId },
        create: expect.objectContaining({
          userId: mockPreferences.userId,
          globalEnabled: mockPreferences.globalEnabled,
          categoryPreferences: mockPreferences.categoryPreferences,
          defaultChannels: mockPreferences.defaultChannels,
          quietHours: mockPreferences.quietHours,
          emailDigest: mockPreferences.emailDigest,
          language: mockPreferences.language,
          timezone: mockPreferences.timezone,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
        update: expect.objectContaining({
          userId: mockPreferences.userId,
          globalEnabled: mockPreferences.globalEnabled,
          categoryPreferences: mockPreferences.categoryPreferences,
          defaultChannels: mockPreferences.defaultChannels,
          quietHours: mockPreferences.quietHours,
          emailDigest: mockPreferences.emailDigest,
          language: mockPreferences.language,
          timezone: mockPreferences.timezone,
          updatedAt: expect.any(Date),
        }),
      });
    });

    it('should handle save errors', async () => {
      const error = new Error('Save failed');
      mockPrisma.notificationPreferences.upsert = jest.fn().mockRejectedValue(error);

      await expect(repository.save(mockPreferences)).rejects.toThrow('Save failed');
    });

    it('should save preferences with minimal configuration', async () => {
      const minimalPreferences = NotificationPreferences.create(
        'user-456',
        false,
        [],
        [],
        undefined,
        undefined,
        'en',
        'UTC'
      );

      mockPrisma.notificationPreferences.upsert = jest.fn().mockResolvedValue({});

      await repository.save(minimalPreferences);

      expect(mockPrisma.notificationPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-456' },
        create: expect.objectContaining({
          userId: 'user-456',
          globalEnabled: false,
          categoryPreferences: [],
          defaultChannels: [],
          quietHours: undefined,
          emailDigest: undefined,
          language: 'en',
          timezone: 'UTC',
        }),
        update: expect.objectContaining({
          userId: 'user-456',
          globalEnabled: false,
          categoryPreferences: [],
          defaultChannels: [],
          quietHours: undefined,
          emailDigest: undefined,
          language: 'en',
          timezone: 'UTC',
        }),
      });
    });
  });

  describe('findByUserId', () => {
    it('should return notification preferences when found', async () => {
      mockPrisma.notificationPreferences.findUnique = jest.fn().mockResolvedValue(mockPrismaData);

      const result = await repository.findByUserId('user-123');

      expect(result).toBeDefined();
      expect(result?.userId).toBe('user-123');
      expect(result?.globalEnabled).toBe(true);
      expect(result?.categoryPreferences).toEqual(mockPreferences.categoryPreferences);
      expect(mockPrisma.notificationPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should return null when preferences not found', async () => {
      mockPrisma.notificationPreferences.findUnique = jest.fn().mockResolvedValue(null);

      const result = await repository.findByUserId('non-existent-user');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockPrisma.notificationPreferences.findUnique = jest.fn().mockRejectedValue(error);

      await expect(repository.findByUserId('user-123')).rejects.toThrow('Database connection failed');
    });

    it('should correctly map complex preferences from database', async () => {
      const complexData = {
        ...mockPrismaData,
        categoryPreferences: [
          {
            category: NotificationCategory.SYSTEM,
            enabled: true,
            channels: [ChannelType.EMAIL, ChannelType.IN_APP, ChannelType.PUSH],
          },
          {
            category: NotificationCategory.SECURITY,
            enabled: true,
            channels: [ChannelType.EMAIL, ChannelType.SMS],
          },
        ],
        quietHours: {
          enabled: true,
          startTime: '23:00',
          endTime: '07:00',
          timezone: 'America/New_York',
        },
        emailDigest: {
          enabled: true,
          frequency: 'weekly',
          time: '10:00',
          includeCategories: [NotificationCategory.REPORT],
        },
      };

      mockPrisma.notificationPreferences.findUnique = jest.fn().mockResolvedValue(complexData);

      const result = await repository.findByUserId('user-123');

      expect(result).toBeDefined();
      expect(result?.categoryPreferences).toHaveLength(2);
      expect(result?.quietHours?.enabled).toBe(true);
      expect(result?.emailDigest?.frequency).toBe('weekly');
    });
  });

  describe('deleteByUserId', () => {
    it('should delete notification preferences by userId', async () => {
      mockPrisma.notificationPreferences.delete = jest.fn().mockResolvedValue(mockPrismaData);

      await repository.deleteByUserId('user-123');

      expect(mockPrisma.notificationPreferences.delete).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should handle delete errors', async () => {
      const error = new Error('Delete failed');
      mockPrisma.notificationPreferences.delete = jest.fn().mockRejectedValue(error);

      await expect(repository.deleteByUserId('user-123')).rejects.toThrow('Delete failed');
    });

    it('should handle deleting non-existent preferences', async () => {
      const notFoundError = new Error('Record not found');
      mockPrisma.notificationPreferences.delete = jest.fn().mockRejectedValue(notFoundError);

      await expect(repository.deleteByUserId('non-existent-user')).rejects.toThrow('Record not found');
    });
  });

  describe('exists', () => {
    it('should return true when preferences exist', async () => {
      mockPrisma.notificationPreferences.count = jest.fn().mockResolvedValue(1);

      const result = await repository.exists('user-123');

      expect(result).toBe(true);
      expect(mockPrisma.notificationPreferences.count).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should return false when preferences do not exist', async () => {
      mockPrisma.notificationPreferences.count = jest.fn().mockResolvedValue(0);

      const result = await repository.exists('non-existent-user');

      expect(result).toBe(false);
    });

    it('should handle count errors', async () => {
      const error = new Error('Count failed');
      mockPrisma.notificationPreferences.count = jest.fn().mockRejectedValue(error);

      await expect(repository.exists('user-123')).rejects.toThrow('Count failed');
    });
  });

  describe('findUsersWithEmailDigestEnabled', () => {
    it('should return users with email digest enabled', async () => {
      const mockUsers = [mockPrismaData, { ...mockPrismaData, userId: 'user-456' }];
      mockPrisma.notificationPreferences.findMany = jest.fn().mockResolvedValue(mockUsers);

      const result = await repository.findUsersWithEmailDigestEnabled();

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user-123');
      expect(result[1].userId).toBe('user-456');
      expect(mockPrisma.notificationPreferences.findMany).toHaveBeenCalledWith({
        where: {
          globalEnabled: true,
          emailDigest: {
            path: ['enabled'],
            equals: true,
          },
        },
      });
    });

    it('should return empty array when no users have email digest enabled', async () => {
      mockPrisma.notificationPreferences.findMany = jest.fn().mockResolvedValue([]);

      const result = await repository.findUsersWithEmailDigestEnabled();

      expect(result).toHaveLength(0);
    });

    it('should handle query errors', async () => {
      const error = new Error('Query failed');
      mockPrisma.notificationPreferences.findMany = jest.fn().mockRejectedValue(error);

      await expect(repository.findUsersWithEmailDigestEnabled()).rejects.toThrow('Query failed');
    });
  });

  describe('findUsersByDigestFrequency', () => {
    it('should return users with daily digest frequency', async () => {
      const dailyUsers = [
        { ...mockPrismaData, emailDigest: { enabled: true, frequency: 'daily' } },
        { ...mockPrismaData, userId: 'user-456', emailDigest: { enabled: true, frequency: 'daily' } },
      ];
      mockPrisma.notificationPreferences.findMany = jest.fn().mockResolvedValue(dailyUsers);

      const result = await repository.findUsersByDigestFrequency('daily');

      expect(result).toHaveLength(2);
      expect(mockPrisma.notificationPreferences.findMany).toHaveBeenCalledWith({
        where: {
          globalEnabled: true,
          emailDigest: {
            path: ['enabled'],
            equals: true,
          },
          AND: {
            emailDigest: {
              path: ['frequency'],
              equals: 'daily',
            },
          },
        },
      });
    });

    it('should return users with weekly digest frequency', async () => {
      const weeklyUsers = [
        { ...mockPrismaData, emailDigest: { enabled: true, frequency: 'weekly' } },
      ];
      mockPrisma.notificationPreferences.findMany = jest.fn().mockResolvedValue(weeklyUsers);

      const result = await repository.findUsersByDigestFrequency('weekly');

      expect(result).toHaveLength(1);
      expect(mockPrisma.notificationPreferences.findMany).toHaveBeenCalledWith({
        where: {
          globalEnabled: true,
          emailDigest: {
            path: ['enabled'],
            equals: true,
          },
          AND: {
            emailDigest: {
              path: ['frequency'],
              equals: 'weekly',
            },
          },
        },
      });
    });

    it('should return empty array when no users match frequency', async () => {
      mockPrisma.notificationPreferences.findMany = jest.fn().mockResolvedValue([]);

      const result = await repository.findUsersByDigestFrequency('daily');

      expect(result).toHaveLength(0);
    });

    it('should handle query errors', async () => {
      const error = new Error('Query failed');
      mockPrisma.notificationPreferences.findMany = jest.fn().mockRejectedValue(error);

      await expect(repository.findUsersByDigestFrequency('weekly')).rejects.toThrow('Query failed');
    });
  });

  describe('domain mapping', () => {
    it('should correctly map all preference fields', async () => {
      const fullData = {
        userId: 'user-789',
        globalEnabled: false,
        categoryPreferences: [
          {
            category: NotificationCategory.SYSTEM,
            enabled: false,
            channels: [],
          },
        ],
        defaultChannels: [ChannelType.IN_APP],
        quietHours: {
          enabled: false,
          startTime: '00:00',
          endTime: '00:00',
          timezone: 'UTC',
        },
        emailDigest: {
          enabled: false,
          frequency: 'daily',
          time: '08:00',
          includeCategories: [],
        },
        language: 'es',
        timezone: 'Europe/Madrid',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.notificationPreferences.findUnique = jest.fn().mockResolvedValue(fullData);

      const result = await repository.findByUserId('user-789');

      expect(result).toBeDefined();
      expect(result?.userId).toBe('user-789');
      expect(result?.globalEnabled).toBe(false);
      expect(result?.categoryPreferences).toHaveLength(1);
      expect(result?.defaultChannels).toEqual([ChannelType.IN_APP]);
      expect(result?.quietHours?.enabled).toBe(false);
      expect(result?.emailDigest?.enabled).toBe(false);
      expect(result?.language).toBe('es');
      expect(result?.timezone).toBe('Europe/Madrid');
    });

    it('should handle null and undefined values gracefully', async () => {
      const sparseData = {
        userId: 'user-sparse',
        globalEnabled: true,
        categoryPreferences: null,
        defaultChannels: null,
        quietHours: null,
        emailDigest: null,
        language: null,
        timezone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.notificationPreferences.findUnique = jest.fn().mockResolvedValue(sparseData);

      const result = await repository.findByUserId('user-sparse');

      expect(result).toBeDefined();
      expect(result?.userId).toBe('user-sparse');
      expect(result?.globalEnabled).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network timeout');
      mockPrisma.notificationPreferences.findUnique = jest.fn().mockRejectedValue(networkError);

      await expect(repository.findByUserId('user-123')).rejects.toThrow('Network timeout');
    });

    it('should handle constraint violations on save', async () => {
      const constraintError = new Error('Unique constraint violation');
      mockPrisma.notificationPreferences.upsert = jest.fn().mockRejectedValue(constraintError);

      await expect(repository.save(mockPreferences)).rejects.toThrow('Unique constraint violation');
    });

    it('should handle foreign key violations', async () => {
      const fkError = new Error('Foreign key constraint failed');
      mockPrisma.notificationPreferences.upsert = jest.fn().mockRejectedValue(fkError);

      await expect(repository.save(mockPreferences)).rejects.toThrow('Foreign key constraint failed');
    });

    it('should handle malformed data gracefully', async () => {
      const malformedData = {
        userId: 'user-123',
        globalEnabled: 'not-a-boolean', // Invalid type
        categoryPreferences: 'not-an-array', // Invalid type
        defaultChannels: mockPreferences.defaultChannels,
        quietHours: mockPreferences.quietHours,
        emailDigest: mockPreferences.emailDigest,
        language: mockPreferences.language,
        timezone: mockPreferences.timezone,
      };

      mockPrisma.notificationPreferences.findUnique = jest.fn().mockResolvedValue(malformedData);

      // The domain object creation should handle or throw appropriate errors
      await expect(repository.findByUserId('user-123')).rejects.toThrow();
    });
  });
});