import { User, UserRole } from 'src/slices/user-management/domain/entities/user';
import { Email } from 'src/shared/domain/value-objects/email';
import { UniqueId } from 'src/shared/domain/value-objects/unique-id';
import { UserFactory } from '../../../factories/user-factory';

describe('User Entity', () => {
  describe('Creation', () => {
    it('should create a user with valid data', () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.USER,
      };

      const user = User.create(userData);

      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.role).toBe(userData.role);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.isActive).toBe(true);
    });

    it('should create a user with minimal required data', () => {
      const userData = {
        email: 'minimal@example.com',
        name: 'Minimal User',
      };

      const user = User.create(userData);

      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.role).toBe(UserRole.USER); // Default role
    });

    it('should throw error when email is invalid', () => {
      const userData = {
        email: 'invalid-email',
        name: 'Test User',
      };

      expect(() => User.create(userData)).toThrow();
    });

    it('should throw error when name is empty', () => {
      const userData = {
        email: 'test@example.com',
        name: '',
      };

      expect(() => User.create(userData)).toThrow();
    });
  });

  describe('Profile Management', () => {
    let user: User;

    beforeEach(() => {
      user = UserFactory.create();
    });

    it('should update name', () => {
      const newName = 'Updated Name';
      user.updateName(newName);

      expect(user.name).toBe(newName);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should update email', () => {
      const newEmail = 'updated@example.com';
      user.updateEmail(newEmail);

      expect(user.email).toBe(newEmail);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should not update to invalid email', () => {
      const originalEmail = user.email;
      
      expect(() => user.updateEmail('invalid-email')).toThrow();
      expect(user.email).toBe(originalEmail);
    });

    it('should update avatar', () => {
      const avatarUrl = 'https://example.com/avatar.jpg';
      user.updateAvatar(avatarUrl);

      expect(user.avatar).toBe(avatarUrl);
    });

    it('should remove avatar', () => {
      user.updateAvatar('https://example.com/avatar.jpg');
      user.removeAvatar();

      expect(user.avatar).toBeNull();
    });
  });

  describe('Role Management', () => {
    let user: User;

    beforeEach(() => {
      user = UserFactory.create({ role: UserRole.USER });
    });

    it('should promote user to admin', () => {
      user.promoteToAdmin();

      expect(user.role).toBe(UserRole.ADMIN);
      expect(user.isAdmin()).toBe(true);
    });

    it('should demote admin to user', () => {
      user.promoteToAdmin();
      user.demoteToUser();

      expect(user.role).toBe(UserRole.USER);
      expect(user.isAdmin()).toBe(false);
    });

    it('should assign moderator role', () => {
      user.assignRole(UserRole.MODERATOR);

      expect(user.role).toBe(UserRole.MODERATOR);
      expect(user.isModerator()).toBe(true);
    });

    it('should check if user has permission', () => {
      expect(user.hasPermission('read')).toBe(true);
      expect(user.hasPermission('write')).toBe(true);
      expect(user.hasPermission('admin')).toBe(false);

      user.promoteToAdmin();
      expect(user.hasPermission('admin')).toBe(true);
    });
  });

  describe('Account Status Management', () => {
    let user: User;

    beforeEach(() => {
      user = UserFactory.create();
    });

    it('should deactivate user', () => {
      user.deactivate();

      expect(user.isActive).toBe(false);
      expect(user.deactivatedAt).toBeInstanceOf(Date);
    });

    it('should reactivate user', () => {
      user.deactivate();
      user.reactivate();

      expect(user.isActive).toBe(true);
      expect(user.deactivatedAt).toBeNull();
    });

    it('should suspend user', () => {
      const reason = 'Violation of terms';
      const until = new Date(Date.now() + 86400000); // 24 hours
      
      user.suspend(reason, until);

      expect(user.isSuspended()).toBe(true);
      expect(user.suspendedAt).toBeInstanceOf(Date);
      expect(user.suspendedUntil).toBe(until);
      expect(user.suspensionReason).toBe(reason);
    });

    it('should unsuspend user', () => {
      const reason = 'Violation of terms';
      const until = new Date(Date.now() + 86400000);
      
      user.suspend(reason, until);
      user.unsuspend();

      expect(user.isSuspended()).toBe(false);
      expect(user.suspendedAt).toBeNull();
      expect(user.suspendedUntil).toBeNull();
      expect(user.suspensionReason).toBeNull();
    });

    it('should check if suspension has expired', () => {
      const pastDate = new Date(Date.now() - 86400000); // 24 hours ago
      user.suspend('Test', pastDate);

      expect(user.isSuspensionExpired()).toBe(true);
    });
  });

  describe('Password Management', () => {
    let user: User;

    beforeEach(() => {
      user = UserFactory.create();
    });

    it('should update password', () => {
      const newPassword = 'newSecurePassword123!';
      user.updatePassword(newPassword);

      expect(user.passwordHash).toBeDefined();
      expect(user.passwordUpdatedAt).toBeInstanceOf(Date);
    });

    it('should verify correct password', () => {
      const password = 'testPassword123!';
      user.updatePassword(password);

      expect(user.verifyPassword(password)).toBe(true);
    });

    it('should not verify incorrect password', () => {
      const password = 'testPassword123!';
      user.updatePassword(password);

      expect(user.verifyPassword('wrongPassword')).toBe(false);
    });

    it('should require password change', () => {
      user.requirePasswordChange();

      expect(user.passwordChangeRequired).toBe(true);
    });

    it('should clear password change requirement after update', () => {
      user.requirePasswordChange();
      user.updatePassword('newPassword123!');

      expect(user.passwordChangeRequired).toBe(false);
    });
  });

  describe('Email Verification', () => {
    let user: User;

    beforeEach(() => {
      user = UserFactory.create();
    });

    it('should verify email', () => {
      user.verifyEmail();

      expect(user.emailVerified).toBe(true);
      expect(user.emailVerifiedAt).toBeInstanceOf(Date);
    });

    it('should unverify email when email is updated', () => {
      user.verifyEmail();
      user.updateEmail('newemail@example.com');

      expect(user.emailVerified).toBe(false);
      expect(user.emailVerifiedAt).toBeNull();
    });
  });

  describe('Login Tracking', () => {
    let user: User;

    beforeEach(() => {
      user = UserFactory.create();
    });

    it('should record login', () => {
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0...';
      
      user.recordLogin(ipAddress, userAgent);

      expect(user.lastLoginAt).toBeInstanceOf(Date);
      expect(user.lastLoginIp).toBe(ipAddress);
      expect(user.lastLoginUserAgent).toBe(userAgent);
      expect(user.loginCount).toBe(1);
    });

    it('should increment login count on subsequent logins', () => {
      user.recordLogin('192.168.1.1', 'Mozilla/5.0...');
      user.recordLogin('192.168.1.2', 'Chrome/90.0...');

      expect(user.loginCount).toBe(2);
    });
  });

  describe('Preferences Management', () => {
    let user: User;

    beforeEach(() => {
      user = UserFactory.create();
    });

    it('should update preferences', () => {
      const preferences = {
        theme: 'dark',
        language: 'es',
        notifications: true,
      };
      
      user.updatePreferences(preferences);

      expect(user.preferences).toEqual(preferences);
    });

    it('should merge preferences', () => {
      const initialPreferences = { theme: 'light', language: 'en' };
      const newPreferences = { notifications: true };
      
      user.updatePreferences(initialPreferences);
      user.updatePreferences(newPreferences);

      expect(user.preferences).toEqual({
        theme: 'light',
        language: 'en',
        notifications: true,
      });
    });

    it('should get preference value', () => {
      user.updatePreferences({ theme: 'dark' });

      expect(user.getPreference('theme')).toBe('dark');
      expect(user.getPreference('nonexistent')).toBeUndefined();
    });
  });

  describe('Validation', () => {
    it('should validate user data', () => {
      const validUser = UserFactory.create();
      expect(validUser.isValid()).toBe(true);
    });

    it('should invalidate user with invalid email', () => {
      expect(() => {
        UserFactory.create({ email: 'invalid-email' });
      }).toThrow();
    });

    it('should invalidate user with empty name', () => {
      expect(() => {
        UserFactory.create({ name: '' });
      }).toThrow();
    });
  });

  describe('Equality', () => {
    it('should be equal to another user with same id', () => {
      const id = UniqueId.generate();
      const user1 = UserFactory.create({ id: id.value });
      const user2 = UserFactory.create({ id: id.value });

      expect(user1.equals(user2)).toBe(true);
    });

    it('should not be equal to another user with different id', () => {
      const user1 = UserFactory.create();
      const user2 = UserFactory.create();

      expect(user1.equals(user2)).toBe(false);
    });
  });

  describe('Domain Events', () => {
    it('should raise UserCreated event when created', () => {
      const user = UserFactory.create();
      const events = user.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('UserCreated');
    });

    it('should raise UserRoleChanged event when role is updated', () => {
      const user = UserFactory.create({ role: UserRole.USER });
      user.clearEvents(); // Clear creation event
      
      user.promoteToAdmin();
      const events = user.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('UserRoleChanged');
    });

    it('should raise UserDeactivated event when deactivated', () => {
      const user = UserFactory.create();
      user.clearEvents(); // Clear creation event
      
      user.deactivate();
      const events = user.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('UserDeactivated');
    });

    it('should raise UserSuspended event when suspended', () => {
      const user = UserFactory.create();
      user.clearEvents(); // Clear creation event
      
      user.suspend('Test reason', new Date(Date.now() + 86400000));
      const events = user.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('UserSuspended');
    });

    it('should raise EmailVerified event when email is verified', () => {
      const user = UserFactory.create();
      user.clearEvents(); // Clear creation event
      
      user.verifyEmail();
      const events = user.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('EmailVerified');
    });
  });
});