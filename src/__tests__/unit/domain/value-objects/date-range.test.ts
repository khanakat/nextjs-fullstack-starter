import { DateRange } from 'src/shared/domain/value-objects/date-range';
import { ValidationError } from 'src/shared/domain/exceptions/validation-error';

describe('DateRange', () => {
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-01-31');

  describe('constructor', () => {
    it('should create a valid DateRange instance', () => {
      const dateRange = new DateRange(startDate, endDate);

      expect(dateRange.startDate).toEqual(startDate);
      expect(dateRange.endDate).toEqual(endDate);
    });

    it('should throw error when start date is after end date', () => {
      const invalidStartDate = new Date('2024-02-01');
      const invalidEndDate = new Date('2024-01-01');

      expect(() => new DateRange(invalidStartDate, invalidEndDate)).toThrow(ValidationError);
      expect(() => new DateRange(invalidStartDate, invalidEndDate)).toThrow('start date must be before end date');
    });

    it('should throw error when start date equals end date', () => {
      const sameDate = new Date('2024-01-01');

      expect(() => new DateRange(sameDate, sameDate)).toThrow(ValidationError);
      expect(() => new DateRange(sameDate, sameDate)).toThrow('start date must be before end date');
    });
  });

  describe('static create method', () => {
    it('should create DateRange using static method', () => {
      const dateRange = DateRange.create(startDate, endDate);

      expect(dateRange.startDate).toEqual(startDate);
      expect(dateRange.endDate).toEqual(endDate);
    });

    it('should validate dates in static create method', () => {
      const invalidStartDate = new Date('2024-02-01');
      const invalidEndDate = new Date('2024-01-01');

      expect(() => DateRange.create(invalidStartDate, invalidEndDate)).toThrow(ValidationError);
    });
  });

  describe('createFromStrings', () => {
    it('should create DateRange from string dates', () => {
      const dateRange = DateRange.createFromStrings('2024-01-01', '2024-01-31');

      expect(dateRange.startDate).toEqual(new Date('2024-01-01'));
      expect(dateRange.endDate).toEqual(new Date('2024-01-31'));
    });

    it('should validate string dates', () => {
      expect(() => DateRange.createFromStrings('2024-02-01', '2024-01-01')).toThrow(ValidationError);
    });

    it('should handle ISO date strings', () => {
      const dateRange = DateRange.createFromStrings('2024-01-01T00:00:00Z', '2024-01-31T23:59:59Z');

      expect(dateRange.startDate).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(dateRange.endDate).toEqual(new Date('2024-01-31T23:59:59Z'));
    });

    it('should throw error for invalid date strings', () => {
      expect(() => DateRange.createFromStrings('invalid-date', '2024-01-31')).toThrow();
      expect(() => DateRange.createFromStrings('2024-01-01', 'invalid-date')).toThrow();
    });
  });

  describe('durationInDays', () => {
    it('should calculate duration for same month', () => {
      const dateRange = new DateRange(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(dateRange.durationInDays).toBe(30);
    });

    it('should calculate duration across months', () => {
      const dateRange = new DateRange(
        new Date('2024-01-15'),
        new Date('2024-02-15')
      );

      expect(dateRange.durationInDays).toBe(31);
    });

    it('should calculate duration for one day', () => {
      const dateRange = new DateRange(
        new Date('2024-01-01T00:00:00'),
        new Date('2024-01-01T23:59:59')
      );

      expect(dateRange.durationInDays).toBe(1);
    });

    it('should calculate duration across leap year', () => {
      const dateRange = new DateRange(
        new Date('2024-02-28'),
        new Date('2024-03-01')
      );

      expect(dateRange.durationInDays).toBe(2); // 2024 is a leap year
    });

    it('should handle timezone differences', () => {
      const dateRange = new DateRange(
        new Date('2024-01-01T23:00:00Z'),
        new Date('2024-01-02T01:00:00Z')
      );

      expect(dateRange.durationInDays).toBe(1);
    });
  });

  describe('contains', () => {
    let dateRange: DateRange;

    beforeEach(() => {
      dateRange = new DateRange(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
    });

    it('should return true for date within range', () => {
      const dateInRange = new Date('2024-01-15');

      expect(dateRange.contains(dateInRange)).toBe(true);
    });

    it('should return true for start date', () => {
      const startDate = new Date('2024-01-01');

      expect(dateRange.contains(startDate)).toBe(true);
    });

    it('should return true for end date', () => {
      const endDate = new Date('2024-01-31');

      expect(dateRange.contains(endDate)).toBe(true);
    });

    it('should return false for date before range', () => {
      const dateBefore = new Date('2023-12-31');

      expect(dateRange.contains(dateBefore)).toBe(false);
    });

    it('should return false for date after range', () => {
      const dateAfter = new Date('2024-02-01');

      expect(dateRange.contains(dateAfter)).toBe(false);
    });

    it('should handle time components correctly', () => {
      const dateRange = new DateRange(
        new Date('2024-01-01T10:00:00'),
        new Date('2024-01-01T20:00:00')
      );

      expect(dateRange.contains(new Date('2024-01-01T15:00:00'))).toBe(true);
      expect(dateRange.contains(new Date('2024-01-01T05:00:00'))).toBe(false);
      expect(dateRange.contains(new Date('2024-01-01T22:00:00'))).toBe(false);
    });
  });

  describe('overlaps', () => {
    let baseRange: DateRange;

    beforeEach(() => {
      baseRange = new DateRange(
        new Date('2024-01-10'),
        new Date('2024-01-20')
      );
    });

    it('should return true for overlapping ranges', () => {
      const overlappingRange = new DateRange(
        new Date('2024-01-15'),
        new Date('2024-01-25')
      );

      expect(baseRange.overlaps(overlappingRange)).toBe(true);
      expect(overlappingRange.overlaps(baseRange)).toBe(true);
    });

    it('should return true for contained ranges', () => {
      const containedRange = new DateRange(
        new Date('2024-01-12'),
        new Date('2024-01-18')
      );

      expect(baseRange.overlaps(containedRange)).toBe(true);
      expect(containedRange.overlaps(baseRange)).toBe(true);
    });

    it('should return true for containing ranges', () => {
      const containingRange = new DateRange(
        new Date('2024-01-05'),
        new Date('2024-01-25')
      );

      expect(baseRange.overlaps(containingRange)).toBe(true);
      expect(containingRange.overlaps(baseRange)).toBe(true);
    });

    it('should return true for touching ranges at start', () => {
      const touchingRange = new DateRange(
        new Date('2024-01-05'),
        new Date('2024-01-10')
      );

      expect(baseRange.overlaps(touchingRange)).toBe(true);
      expect(touchingRange.overlaps(baseRange)).toBe(true);
    });

    it('should return true for touching ranges at end', () => {
      const touchingRange = new DateRange(
        new Date('2024-01-20'),
        new Date('2024-01-25')
      );

      expect(baseRange.overlaps(touchingRange)).toBe(true);
      expect(touchingRange.overlaps(baseRange)).toBe(true);
    });

    it('should return false for non-overlapping ranges before', () => {
      const beforeRange = new DateRange(
        new Date('2024-01-01'),
        new Date('2024-01-09')
      );

      expect(baseRange.overlaps(beforeRange)).toBe(false);
      expect(beforeRange.overlaps(baseRange)).toBe(false);
    });

    it('should return false for non-overlapping ranges after', () => {
      const afterRange = new DateRange(
        new Date('2024-01-21'),
        new Date('2024-01-31')
      );

      expect(baseRange.overlaps(afterRange)).toBe(false);
      expect(afterRange.overlaps(baseRange)).toBe(false);
    });

    it('should return true for identical ranges', () => {
      const identicalRange = new DateRange(
        new Date('2024-01-10'),
        new Date('2024-01-20')
      );

      expect(baseRange.overlaps(identicalRange)).toBe(true);
      expect(identicalRange.overlaps(baseRange)).toBe(true);
    });
  });

  describe('value object equality', () => {
    it('should be equal for same date ranges', () => {
      const range1 = new DateRange(startDate, endDate);
      const range2 = new DateRange(new Date(startDate), new Date(endDate));

      expect(range1.equals(range2)).toBe(true);
    });

    it('should not be equal for different start dates', () => {
      const range1 = new DateRange(startDate, endDate);
      const range2 = new DateRange(new Date('2024-01-02'), endDate);

      expect(range1.equals(range2)).toBe(false);
    });

    it('should not be equal for different end dates', () => {
      const range1 = new DateRange(startDate, endDate);
      const range2 = new DateRange(startDate, new Date('2024-02-01'));

      expect(range1.equals(range2)).toBe(false);
    });

    it('should not be equal to null or undefined', () => {
      const range = new DateRange(startDate, endDate);

      expect(range.equals(null as any)).toBe(false);
      expect(range.equals(undefined as any)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle millisecond precision', () => {
      const start = new Date('2024-01-01T12:00:00.000Z');
      const end = new Date('2024-01-01T12:00:00.001Z');
      const dateRange = new DateRange(start, end);

      expect(dateRange.durationInDays).toBe(1);
    });

    it('should handle different timezones', () => {
      const start = new Date('2024-01-01T00:00:00-08:00'); // PST
      const end = new Date('2024-01-01T00:00:00-05:00');   // EST (3 hours earlier in UTC)
      
      expect(() => new DateRange(start, end)).toThrow(ValidationError);
    });

    it('should handle leap year February', () => {
      const start = new Date('2024-02-28');
      const end = new Date('2024-03-01');
      const dateRange = new DateRange(start, end);

      expect(dateRange.durationInDays).toBe(2); // 2024 is a leap year
    });

    it('should handle year boundaries', () => {
      const start = new Date('2023-12-31T00:00:00Z');
      const end = new Date('2024-01-01T00:00:00Z');
      const dateRange = new DateRange(start, end);

      expect(dateRange.durationInDays).toBe(1);
      expect(dateRange.contains(new Date('2023-12-31T23:59:59Z'))).toBe(true);
      expect(dateRange.contains(new Date('2024-01-01T00:00:00Z'))).toBe(true);
    });

    it('should handle very large date ranges', () => {
      const start = new Date('1900-01-01');
      const end = new Date('2100-12-31');
      const dateRange = new DateRange(start, end);

      expect(dateRange.durationInDays).toBeGreaterThan(70000);
      expect(dateRange.contains(new Date('2024-01-01'))).toBe(true);
    });
  });
});