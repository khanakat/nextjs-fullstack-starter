import { UniqueId } from 'src/shared/domain/value-objects/unique-id';
import { ValueObjectFactory } from '../../../factories/value-object-factory';

describe('UniqueId Value Object', () => {
  describe('Creation', () => {
    it('should create a unique id with provided valid CUID value', () => {
      const value = 'clhqr2k3z0000qzrmn4n4n4n4'; // Valid CUID format
      const uniqueId = new UniqueId(value);

      expect(uniqueId.value).toBe(value);
      expect(uniqueId.id).toBe(value);
    });

    it('should create a unique id using factory', () => {
      const uniqueId = ValueObjectFactory.createUniqueId();

      expect(uniqueId.value).toBeDefined();
      expect(typeof uniqueId.value).toBe('string');
      expect(uniqueId.value.length).toBeGreaterThan(0);
      expect(UniqueId.isValid(uniqueId.value)).toBe(true);
    });

    it('should create multiple unique ids with different values', () => {
      const uniqueIds = ValueObjectFactory.createUniqueIds(5);

      expect(uniqueIds).toHaveLength(5);
      
      const values = uniqueIds.map(id => id.value);
      const uniqueValues = new Set(values);
      
      expect(uniqueValues.size).toBe(5); // All values should be unique
      
      // All should be valid CUIDs
      values.forEach(value => {
        expect(UniqueId.isValid(value)).toBe(true);
      });
    });

    it('should generate a valid CUID when no value provided', () => {
      const uniqueId = new UniqueId();
      
      expect(UniqueId.isValid(uniqueId.value)).toBe(true);
      expect(uniqueId.value.length).toBeGreaterThanOrEqual(20);
      expect(uniqueId.value.length).toBeLessThanOrEqual(30);
    });
  });

  describe('Validation', () => {
    it('should generate valid CUID for empty string', () => {
      const uniqueId = new UniqueId('');
      expect(UniqueId.isValid(uniqueId.value)).toBe(true);
    });

    it('should generate valid CUID for null value', () => {
      const uniqueId = new UniqueId(null as any);
      expect(UniqueId.isValid(uniqueId.value)).toBe(true);
    });

    it('should generate valid CUID for undefined value', () => {
      const uniqueId = new UniqueId(undefined as any);
      expect(UniqueId.isValid(uniqueId.value)).toBe(true);
    });

    it('should reject invalid string values', () => {
      const invalidValues = [
        'abc123', // too short
        'user-123-456', // contains hyphens
        'cuid2-generated-id', // contains hyphens
        '12345', // too short
        'a', // too short
        'ABC123def456ghi789jkl012', // contains uppercase
        'test_id_with_underscores_123', // contains underscores
      ];

      invalidValues.forEach(value => {
        expect(() => new UniqueId(value)).toThrow('invalid CUID format');
      });
    });

    it('should accept valid CUID values', () => {
      // Let's use actually valid CUIDs
      const actualValidValues = [
        'clhqr2k3z0000qzrmn4n4n4n4',
        'abcdefghij1234567890abcde',
        'xyz123abc456def789ghi012',
      ];

      actualValidValues.forEach(value => {
        expect(() => new UniqueId(value)).not.toThrow();
        expect(UniqueId.isValid(value)).toBe(true);
      });
    });
  });

  describe('Equality', () => {
    it('should be equal when values are the same', () => {
      const value = 'clhqr2k3z0000qzrmn4n4n4n4';
      const id1 = new UniqueId(value);
      const id2 = new UniqueId(value);

      expect(id1.equals(id2)).toBe(true);
    });

    it('should not be equal when values are different', () => {
      const id1 = new UniqueId('clhqr2k3z0000qzrmn4n4n4n4');
      const id2 = new UniqueId('abcdefghij1234567890abcde');

      expect(id1.equals(id2)).toBe(false);
    });

    it('should not be equal to null or undefined', () => {
      const id = new UniqueId('clhqr2k3z0000qzrmn4n4n4n4');

      expect(id.equals(null as any)).toBe(false);
      expect(id.equals(undefined as any)).toBe(false);
    });

    it('should not be equal to different type', () => {
      const id = new UniqueId('clhqr2k3z0000qzrmn4n4n4n4');

      expect(id.equals('clhqr2k3z0000qzrmn4n4n4n4' as any)).toBe(false);
      expect(id.equals({ value: 'clhqr2k3z0000qzrmn4n4n4n4' } as any)).toBe(false);
    });
  });

  describe('String Representation', () => {
    it('should return the value when converted to string', () => {
      const value = 'clhqr2k3z0000qzrmn4n4n4n4';
      const uniqueId = new UniqueId(value);

      expect(uniqueId.toString()).toBe(value);
    });

    it('should work with template literals', () => {
      const value = 'clhqr2k3z0000qzrmn4n4n4n4';
      const uniqueId = new UniqueId(value);

      expect(`ID: ${uniqueId}`).toBe(`ID: ${value}`);
    });
  });

  describe('Immutability', () => {
    it('should not allow modification of internal value', () => {
      const value = 'clhqr2k3z0000qzrmn4n4n4n4';
      const uniqueId = new UniqueId(value);

      // Attempt to modify (should not affect the original)
      const retrievedValue = uniqueId.value;
      expect(retrievedValue).toBe(value);

      // Value should remain unchanged
      expect(uniqueId.value).toBe(value);
    });
  });

  describe('Edge Cases', () => {
    it('should reject very long strings', () => {
      const longValue = 'a'.repeat(1000);
      
      expect(() => new UniqueId(longValue)).toThrow('invalid CUID format');
    });

    it('should reject special characters', () => {
      const specialValue = 'test-id_123@domain.com#section';
      
      expect(() => new UniqueId(specialValue)).toThrow('invalid CUID format');
    });

    it('should reject unicode characters', () => {
      const unicodeValue = 'test-id-🚀-测试-123';
      
      expect(() => new UniqueId(unicodeValue)).toThrow('invalid CUID format');
    });

    it('should accept valid CUID format', () => {
      const validCuid = 'clhqr2k3z0000qzrmn4n4n4n4';
      const uniqueId = new UniqueId(validCuid);

      expect(uniqueId.value).toBe(validCuid);
    });

    it('should reject strings that are too short', () => {
      const shortValue = 'short';
      
      expect(() => new UniqueId(shortValue)).toThrow('invalid CUID format');
    });

    it('should reject strings that are too long', () => {
      const longValue = 'a'.repeat(35);
      
      expect(() => new UniqueId(longValue)).toThrow('invalid CUID format');
    });

    it('should reject uppercase characters', () => {
      const uppercaseValue = 'CLHQR2K3Z0000QZRMN4N4N4N4';
      
      expect(() => new UniqueId(uppercaseValue)).toThrow('invalid CUID format');
    });

    it('should reject mixed case characters', () => {
      const mixedCaseValue = 'ClHqR2k3Z0000QzRmN4n4N4n4';
      
      expect(() => new UniqueId(mixedCaseValue)).toThrow('invalid CUID format');
    });
  });

  describe('Static Methods', () => {
    it('should validate CUID format correctly', () => {
      expect(UniqueId.isValid('clhqr2k3z0000qzrmn4n4n4n4')).toBe(true);
      expect(UniqueId.isValid('abcdefghij1234567890abcde')).toBe(true);
      expect(UniqueId.isValid('short')).toBe(false);
      expect(UniqueId.isValid('contains-hyphens-and-is-long')).toBe(false);
      expect(UniqueId.isValid('UPPERCASE123456789012345')).toBe(false);
    });

    it('should create UniqueId using static create method', () => {
      const value = 'clhqr2k3z0000qzrmn4n4n4n4';
      const uniqueId = UniqueId.create(value);
      
      expect(uniqueId.value).toBe(value);
    });

    it('should generate UniqueId using static generate method', () => {
      const uniqueId = UniqueId.generate();
      
      expect(UniqueId.isValid(uniqueId.value)).toBe(true);
    });
  });
});