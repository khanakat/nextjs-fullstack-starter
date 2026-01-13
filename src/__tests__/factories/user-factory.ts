import { User, UserRole } from 'src/slices/user-management/domain/entities/user';
import { UniqueId } from 'src/shared/domain/value-objects/unique-id';
import { Email } from 'src/shared/domain/value-objects/email';
import { createId } from '@paralleldrive/cuid2';

/**
 * Factory for creating User test instances
 */
export class UserFactory {
  static create(overrides: Partial<{
    id: string;
    email: string;
    name: string;
    username: string;
    role: UserRole;
    isActive: boolean;
    lastLoginAt: Date;
    createdAt: Date;
    updatedAt: Date;
    organizationId: string;
  }> = {}): User {
    const defaultData = {
      id: overrides.id || createId(),
      email: 'test@example.com',
      name: 'Test User',
      username: overrides.username || `testuser_${Math.random().toString(36).slice(2, 8)}`,
      role: UserRole.VIEWER,
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      organizationId: overrides.organizationId,
      ...overrides,
    };
    // Create user and attach organizationId directly for tests expecting it on the user object
    const user: any = User.create(
      {
        email: new Email(defaultData.email),
        name: defaultData.name,
        username: defaultData.username,
        role: defaultData.role,
      },
      new UniqueId(defaultData.id)
    );
    if (defaultData.organizationId) {
      user.organizationId = defaultData.organizationId;
    }
    return user as User;
  }

  static createMany(count: number, overrides: Partial<any> = {}): User[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        id: createId(),
        email: `test${index + 1}@example.com`,
        name: `Test User ${index + 1}`,
        username: overrides.username || `testuser_${index + 1}`,
        ...overrides,
      })
    );
  }

  static createAdmin(overrides: Partial<any> = {}): User {
    return UserFactory.create({
      role: UserRole.ADMIN,
      name: 'Admin User',
      email: 'admin@example.com',
      username: overrides.username || 'admin_user',
      ...overrides,
    });
  }

  static createModerator(overrides: Partial<any> = {}): User {
    return UserFactory.create({
      role: UserRole.MANAGER,
      email: 'manager@example.com',
      name: 'Manager User',
      username: overrides.username || 'manager_user',
      ...overrides,
    });
  }

  static createViewer(overrides: Partial<any> = {}): User {
    return UserFactory.create({
      role: UserRole.VIEWER,
      email: 'viewer@example.com',
      name: 'Viewer User',
      username: overrides.username || 'viewer_user',
      ...overrides,
    });
  }

  static createOwner(overrides: Partial<any> = {}): User {
    return UserFactory.create({
      role: UserRole.OWNER,
      email: 'owner@example.com',
      name: 'Owner User',
      username: overrides.username || 'owner_user',
      ...overrides,
    });
  }
}

// Basic smoke test to keep Jest happy when running all __tests__ files directly
describe('UserFactory', () => {
  it('creates a user with an id and username', () => {
    const user = UserFactory.create();
    expect(user.id).toBeDefined();
    expect(typeof (user as any).username).toBe('string');
  });
});
