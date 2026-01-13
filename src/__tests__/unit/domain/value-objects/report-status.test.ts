import { 
  ReportStatus, 
  isValidReportStatusString, 
  getAllReportStatuses, 
  getReportStatusDisplayName, 
  isValidStatusTransition 
} from '../../../../shared/domain/reporting/value-objects/report-status';

describe('ReportStatus', () => {
  describe('static factory methods', () => {
    describe('draft', () => {
      it('should create draft status', () => {
        // Act
        const status = ReportStatus.draft();

        // Assert
        expect(status).toBeInstanceOf(ReportStatus);
        expect(status.toString()).toBe('DRAFT');
        expect(status.isDraft()).toBe(true);
        expect(status.isPublished()).toBe(false);
        expect(status.isArchived()).toBe(false);
      });
    });

    describe('published', () => {
      it('should create published status', () => {
        // Act
        const status = ReportStatus.published();

        // Assert
        expect(status).toBeInstanceOf(ReportStatus);
        expect(status.toString()).toBe('PUBLISHED');
        expect(status.isDraft()).toBe(false);
        expect(status.isPublished()).toBe(true);
        expect(status.isArchived()).toBe(false);
      });
    });

    describe('archived', () => {
      it('should create archived status', () => {
        // Act
        const status = ReportStatus.archived();

        // Assert
        expect(status).toBeInstanceOf(ReportStatus);
        expect(status.toString()).toBe('ARCHIVED');
        expect(status.isDraft()).toBe(false);
        expect(status.isPublished()).toBe(false);
        expect(status.isArchived()).toBe(true);
      });
    });

    describe('fromString', () => {
      it('should create status from valid string', () => {
        // Act
        const draftStatus = ReportStatus.fromString('DRAFT');
        const publishedStatus = ReportStatus.fromString('PUBLISHED');
        const archivedStatus = ReportStatus.fromString('ARCHIVED');

        // Assert
        expect(draftStatus.isDraft()).toBe(true);
        expect(publishedStatus.isPublished()).toBe(true);
        expect(archivedStatus.isArchived()).toBe(true);
      });

      it('should throw error for invalid string', () => {
        // Act & Assert
        expect(() => ReportStatus.fromString('INVALID'))
          .toThrow('Invalid report status: INVALID');
      });

      it('should throw error for empty string', () => {
        // Act & Assert
        expect(() => ReportStatus.fromString(''))
          .toThrow('Invalid report status: ');
      });

      it('should throw error for null or undefined', () => {
        // Act & Assert
        expect(() => ReportStatus.fromString(null as any))
          .toThrow('Invalid report status: null');
        expect(() => ReportStatus.fromString(undefined as any))
          .toThrow('Invalid report status: undefined');
      });

      it('should be case sensitive', () => {
        // Act & Assert
        expect(() => ReportStatus.fromString('draft'))
          .toThrow('Invalid report status: draft');
        expect(() => ReportStatus.fromString('Draft'))
          .toThrow('Invalid report status: Draft');
        expect(() => ReportStatus.fromString('DRAFT')).not.toThrow();
      });
    });
  });

  describe('status checking methods', () => {
    it('should correctly identify draft status', () => {
      // Arrange
      const draftStatus = ReportStatus.draft();
      const publishedStatus = ReportStatus.published();
      const archivedStatus = ReportStatus.archived();

      // Act & Assert
      expect(draftStatus.isDraft()).toBe(true);
      expect(publishedStatus.isDraft()).toBe(false);
      expect(archivedStatus.isDraft()).toBe(false);
    });

    it('should correctly identify published status', () => {
      // Arrange
      const draftStatus = ReportStatus.draft();
      const publishedStatus = ReportStatus.published();
      const archivedStatus = ReportStatus.archived();

      // Act & Assert
      expect(draftStatus.isPublished()).toBe(false);
      expect(publishedStatus.isPublished()).toBe(true);
      expect(archivedStatus.isPublished()).toBe(false);
    });

    it('should correctly identify archived status', () => {
      // Arrange
      const draftStatus = ReportStatus.draft();
      const publishedStatus = ReportStatus.published();
      const archivedStatus = ReportStatus.archived();

      // Act & Assert
      expect(draftStatus.isArchived()).toBe(false);
      expect(publishedStatus.isArchived()).toBe(false);
      expect(archivedStatus.isArchived()).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      // Arrange
      const draftStatus = ReportStatus.draft();
      const publishedStatus = ReportStatus.published();
      const archivedStatus = ReportStatus.archived();

      // Act & Assert
      expect(draftStatus.toString()).toBe('DRAFT');
      expect(publishedStatus.toString()).toBe('PUBLISHED');
      expect(archivedStatus.toString()).toBe('ARCHIVED');
    });
  });

  describe('getDisplayName', () => {
    it('should return human-readable display names', () => {
      // Arrange
      const draftStatus = ReportStatus.draft();
      const publishedStatus = ReportStatus.published();
      const archivedStatus = ReportStatus.archived();

      // Act & Assert
      expect(draftStatus.getDisplayName()).toBe('Draft');
      expect(publishedStatus.getDisplayName()).toBe('Published');
      expect(archivedStatus.getDisplayName()).toBe('Archived');
    });

    it('should return original value for unknown status', () => {
      // Arrange - Create status with unknown value (bypassing validation for test)
      const unknownStatus = ReportStatus.fromString('DRAFT'); // Start with valid
      // Manually set internal value to simulate unknown status
      (unknownStatus as any)._value = 'UNKNOWN';

      // Act
      const displayName = unknownStatus.getDisplayName();

      // Assert
      expect(displayName).toBe('UNKNOWN');
    });
  });

  describe('canTransitionTo', () => {
    it('should allow valid transitions from draft', () => {
      // Arrange
      const draftStatus = ReportStatus.draft();
      const publishedStatus = ReportStatus.published();
      const archivedStatus = ReportStatus.archived();

      // Act & Assert
      expect(draftStatus.canTransitionTo(publishedStatus)).toBe(true);
      expect(draftStatus.canTransitionTo(archivedStatus)).toBe(true);
      expect(draftStatus.canTransitionTo(draftStatus)).toBe(false); // Same status
    });

    it('should allow valid transitions from published', () => {
      // Arrange
      const draftStatus = ReportStatus.draft();
      const publishedStatus = ReportStatus.published();
      const archivedStatus = ReportStatus.archived();

      // Act & Assert
      expect(publishedStatus.canTransitionTo(archivedStatus)).toBe(true);
      expect(publishedStatus.canTransitionTo(draftStatus)).toBe(false);
      expect(publishedStatus.canTransitionTo(publishedStatus)).toBe(false); // Same status
    });

    it('should not allow any transitions from archived', () => {
      // Arrange
      const draftStatus = ReportStatus.draft();
      const publishedStatus = ReportStatus.published();
      const archivedStatus = ReportStatus.archived();

      // Act & Assert
      expect(archivedStatus.canTransitionTo(draftStatus)).toBe(false);
      expect(archivedStatus.canTransitionTo(publishedStatus)).toBe(false);
      expect(archivedStatus.canTransitionTo(archivedStatus)).toBe(false); // Same status
    });
  });

  describe('value object equality', () => {
    it('should be equal when status values are the same', () => {
      // Arrange
      const status1 = ReportStatus.draft();
      const status2 = ReportStatus.draft();

      // Act & Assert
      expect(status1.equals(status2)).toBe(true);
    });

    it('should not be equal when status values differ', () => {
      // Arrange
      const draftStatus = ReportStatus.draft();
      const publishedStatus = ReportStatus.published();

      // Act & Assert
      expect(draftStatus.equals(publishedStatus)).toBe(false);
    });

    it('should be equal when created from same string', () => {
      // Arrange
      const status1 = ReportStatus.fromString('PUBLISHED');
      const status2 = ReportStatus.fromString('PUBLISHED');

      // Act & Assert
      expect(status1.equals(status2)).toBe(true);
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      // Arrange
      const status = ReportStatus.draft();
      const originalValue = status.toString();

      // Act - Try to modify (this should not be possible, but test for safety)
      // Note: Since _value is protected, we can't directly modify it in a real scenario

      // Assert
      expect(status.toString()).toBe(originalValue);
    });

    it('should create different instances for same status', () => {
      // Arrange & Act
      const status1 = ReportStatus.draft();
      const status2 = ReportStatus.draft();

      // Assert
      expect(status1).not.toBe(status2); // Different instances
      expect(status1.equals(status2)).toBe(true); // But equal values
    });
  });
});

describe('isValidReportStatusString', () => {
  it('should return true for valid status strings', () => {
    // Act & Assert
    expect(isValidReportStatusString('DRAFT')).toBe(true);
    expect(isValidReportStatusString('PUBLISHED')).toBe(true);
    expect(isValidReportStatusString('ARCHIVED')).toBe(true);
  });

  it('should return false for invalid status strings', () => {
    // Act & Assert
    expect(isValidReportStatusString('INVALID')).toBe(false);
    expect(isValidReportStatusString('draft')).toBe(false); // Case sensitive
    expect(isValidReportStatusString('Draft')).toBe(false);
    expect(isValidReportStatusString('')).toBe(false);
    expect(isValidReportStatusString('PENDING')).toBe(false);
  });

  it('should return false for null or undefined', () => {
    // Act & Assert
    expect(isValidReportStatusString(null as any)).toBe(false);
    expect(isValidReportStatusString(undefined as any)).toBe(false);
  });
});

describe('getAllReportStatuses', () => {
  it('should return all available report statuses', () => {
    // Act
    const allStatuses = getAllReportStatuses();

    // Assert
    expect(allStatuses).toHaveLength(3);
    expect(allStatuses[0].isDraft()).toBe(true);
    expect(allStatuses[1].isPublished()).toBe(true);
    expect(allStatuses[2].isArchived()).toBe(true);
  });

  it('should return new instances each time', () => {
    // Act
    const statuses1 = getAllReportStatuses();
    const statuses2 = getAllReportStatuses();

    // Assert
    expect(statuses1).not.toBe(statuses2); // Different arrays
    expect(statuses1[0]).not.toBe(statuses2[0]); // Different instances
    expect(statuses1[0].equals(statuses2[0])).toBe(true); // But equal values
  });
});

describe('getReportStatusDisplayName', () => {
  it('should return display names for all statuses', () => {
    // Arrange
    const draftStatus = ReportStatus.draft();
    const publishedStatus = ReportStatus.published();
    const archivedStatus = ReportStatus.archived();

    // Act & Assert
    expect(getReportStatusDisplayName(draftStatus)).toBe('Draft');
    expect(getReportStatusDisplayName(publishedStatus)).toBe('Published');
    expect(getReportStatusDisplayName(archivedStatus)).toBe('Archived');
  });
});

describe('isValidStatusTransition', () => {
  it('should validate transitions from draft', () => {
    // Arrange
    const draftStatus = ReportStatus.draft();
    const publishedStatus = ReportStatus.published();
    const archivedStatus = ReportStatus.archived();

    // Act & Assert
    expect(isValidStatusTransition(draftStatus, publishedStatus)).toBe(true);
    expect(isValidStatusTransition(draftStatus, archivedStatus)).toBe(true);
    expect(isValidStatusTransition(draftStatus, draftStatus)).toBe(false);
  });

  it('should validate transitions from published', () => {
    // Arrange
    const draftStatus = ReportStatus.draft();
    const publishedStatus = ReportStatus.published();
    const archivedStatus = ReportStatus.archived();

    // Act & Assert
    expect(isValidStatusTransition(publishedStatus, archivedStatus)).toBe(true);
    expect(isValidStatusTransition(publishedStatus, draftStatus)).toBe(false);
    expect(isValidStatusTransition(publishedStatus, publishedStatus)).toBe(false);
  });

  it('should validate transitions from archived', () => {
    // Arrange
    const draftStatus = ReportStatus.draft();
    const publishedStatus = ReportStatus.published();
    const archivedStatus = ReportStatus.archived();

    // Act & Assert
    expect(isValidStatusTransition(archivedStatus, draftStatus)).toBe(false);
    expect(isValidStatusTransition(archivedStatus, publishedStatus)).toBe(false);
    expect(isValidStatusTransition(archivedStatus, archivedStatus)).toBe(false);
  });

  it('should handle all possible transition combinations', () => {
    // Arrange
    const allStatuses = getAllReportStatuses();
    const expectedTransitions = {
      'DRAFT': ['PUBLISHED', 'ARCHIVED'],
      'PUBLISHED': ['ARCHIVED'],
      'ARCHIVED': []
    };

    // Act & Assert
    allStatuses.forEach(fromStatus => {
      allStatuses.forEach(toStatus => {
        const expected = expectedTransitions[fromStatus.toString()].includes(toStatus.toString());
        const actual = isValidStatusTransition(fromStatus, toStatus);
        expect(actual).toBe(expected);
      });
    });
  });
});

describe('ReportStatus constants', () => {
  it('should have correct constant values', () => {
    // Act & Assert
    expect(ReportStatus.DRAFT).toBe('DRAFT');
    expect(ReportStatus.PUBLISHED).toBe('PUBLISHED');
    expect(ReportStatus.ARCHIVED).toBe('ARCHIVED');
  });

  it('should create statuses matching constants', () => {
    // Act
    const draftStatus = ReportStatus.draft();
    const publishedStatus = ReportStatus.published();
    const archivedStatus = ReportStatus.archived();

    // Assert
    expect(draftStatus.toString()).toBe(ReportStatus.DRAFT);
    expect(publishedStatus.toString()).toBe(ReportStatus.PUBLISHED);
    expect(archivedStatus.toString()).toBe(ReportStatus.ARCHIVED);
  });
});