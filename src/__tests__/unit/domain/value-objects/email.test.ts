import { Email } from 'src/shared/domain/value-objects/email';
import { ValueObjectFactory } from '../../../factories/value-object-factory';

describe('Email Value Object', () => {
  describe('Creation', () => {
    it('should create email with valid address', () => {
      const address = 'test@example.com';
      const email = new Email(address);

      expect(email.getValue()).toBe(address);
    });

    it('should create email using factory', () => {
      const email = ValueObjectFactory.createEmail();

      expect(email.getValue()).toBeDefined();
      expect(email.getValue()).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('should create multiple valid emails using factory', () => {
      const emails = ValueObjectFactory.createValidEmails();

      expect(emails.length).toBeGreaterThan(0);
      emails.forEach(email => {
        expect(email.getValue()).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });
  });

  describe('Validation', () => {
    it('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.org',
        'user+tag@example.co.uk',
        'user123@test-domain.com',
        'firstname.lastname@company.org',
        'user_name@domain-name.com',
        'a@b.co',
      ];

      validEmails.forEach(email => {
        expect(() => new Email(email)).not.toThrow();
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        '',
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        'user@example',
        'user name@example.com',
        'user@exam ple.com',
        null,
        undefined,
      ];

      invalidEmails.forEach(email => {
        expect(() => new Email(email as any)).toThrow();
      });
    });

    it('should reject emails with invalid characters', () => {
      const invalidEmails = [
        'user<>@example.com',
        'user[]@example.com',
        'user()@example.com',
        'user,@example.com',
        'user;@example.com',
        'user:@example.com',
      ];

      invalidEmails.forEach(email => {
        expect(() => new Email(email)).toThrow('Invalid email format');
      });
    });
  });

  describe('Equality', () => {
    it('should be equal when email addresses are the same', () => {
      const address = 'test@example.com';
      const email1 = new Email(address);
      const email2 = new Email(address);

      expect(email1.equals(email2)).toBe(true);
    });

    it('should be case-insensitive for domain part', () => {
      const email1 = new Email('user@EXAMPLE.COM');
      const email2 = new Email('user@example.com');

      expect(email1.equals(email2)).toBe(true);
    });

    it('should be case-sensitive for local part', () => {
      const email1 = new Email('User@example.com');
      const email2 = new Email('user@example.com');

      expect(email1.equals(email2)).toBe(false);
    });

    it('should not be equal when addresses are different', () => {
      const email1 = new Email('user1@example.com');
      const email2 = new Email('user2@example.com');

      expect(email1.equals(email2)).toBe(false);
    });

    it('should not be equal to null or undefined', () => {
      const email = new Email('test@example.com');

      expect(email.equals(null as any)).toBe(false);
      expect(email.equals(undefined as any)).toBe(false);
    });
  });

  describe('Domain Extraction', () => {
    it('should extract domain from email address', () => {
      const email = new Email('user@example.com');

      expect(email.getDomain()).toBe('example.com');
    });

    it('should extract domain from complex email', () => {
      const email = new Email('test.user+tag@sub.domain.co.uk');

      expect(email.getDomain()).toBe('sub.domain.co.uk');
    });
  });

  describe('Local Part Extraction', () => {
    it('should extract local part from email address', () => {
      const email = new Email('user@example.com');

      expect(email.getLocalPart()).toBe('user');
    });

    it('should extract local part from complex email', () => {
      const email = new Email('test.user+tag@example.com');

      expect(email.getLocalPart()).toBe('test.user+tag');
    });
  });

  describe('String Representation', () => {
    it('should return the email address when converted to string', () => {
      const address = 'test@example.com';
      const email = new Email(address);

      expect(email.toString()).toBe(address);
    });

    it('should work with template literals', () => {
      const address = 'test@example.com';
      const email = new Email(address);

      expect(`Email: ${email}`).toBe(`Email: ${address}`);
    });
  });

  describe('Immutability', () => {
    it('should not allow modification of internal value', () => {
      const address = 'test@example.com';
      const email = new Email(address);

      const retrievedValue = email.getValue();
      expect(retrievedValue).toBe(address);

      // Value should remain unchanged
      expect(email.getValue()).toBe(address);
    });
  });

  describe('Edge Cases', () => {
    it('should handle maximum length emails', () => {
      // RFC 5321 specifies maximum lengths
      const localPart = 'a'.repeat(64); // Max local part length
      const domain = 'b'.repeat(60) + '.com'; // Close to max domain length
      const longEmail = `${localPart}@${domain}`;
      
      const email = new Email(longEmail);
      expect(email.getValue()).toBe(longEmail);
    });

    it('should handle international domain names', () => {
      const email = new Email('user@xn--nxasmq6b.xn--j6w193g'); // IDN encoded
      expect(email.getValue()).toBe('user@xn--nxasmq6b.xn--j6w193g');
    });

    it('should handle plus addressing', () => {
      const email = new Email('user+tag+subtag@example.com');
      expect(email.getValue()).toBe('user+tag+subtag@example.com');
      expect(email.getLocalPart()).toBe('user+tag+subtag');
    });

    it('should handle quoted local parts', () => {
      const email = new Email('"user.name"@example.com');
      expect(email.getValue()).toBe('"user.name"@example.com');
    });
  });
});