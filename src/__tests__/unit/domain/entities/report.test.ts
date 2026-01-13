import { Report } from 'src/shared/domain/reporting/entities/report';
import { ReportStatus } from 'src/shared/domain/reporting/value-objects/report-status';
import { ReportConfig } from 'src/shared/domain/reporting/value-objects/report-config';
import { ReportLayout } from 'src/shared/domain/reporting/value-objects/report-layout';
import { ReportStyling } from 'src/shared/domain/reporting/value-objects/report-styling';
import { UniqueId } from 'src/shared/domain/value-objects/unique-id';
import { ReportFactory } from '../../../factories/report-factory';

describe('Report Entity', () => {
  // Helper function to create a valid config
  const createValidConfig = () => {
    const layout = ReportLayout.create({
      type: 'grid',
      components: [],
      grid: {
        columns: 12,
        rows: 10,
        gap: 16,
      },
    });

    const styling = ReportStyling.create({
      theme: 'light',
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      fontFamily: 'Inter',
      fontSize: 14,
    });

    return ReportConfig.create({
      title: 'Test Report',
      description: 'Test Description',
      filters: {},
      parameters: {},
      layout,
      styling,
    });
  };

  describe('Creation', () => {
    it('should create a report with valid data', () => {
      const config = createValidConfig();
      const reportData = {
        title: 'Test Report',
        description: 'Test Description',
        config,
        isPublic: false,
        createdBy: UniqueId.generate(),
      };

      const report = Report.create(reportData);

      expect(report.title).toBe(reportData.title);
      expect(report.description).toBe(reportData.description);
      expect(report.createdBy).toBe(reportData.createdBy);
      expect(report.status.isDraft()).toBe(true);
      expect(report.createdAt).toBeInstanceOf(Date);
      expect(report.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a report with minimal required data', () => {
      const config = createValidConfig();
      const reportData = {
        title: 'Minimal Report',
        config,
        isPublic: false,
        createdBy: UniqueId.generate(),
      };

      const report = Report.create(reportData);

      expect(report.title).toBe(reportData.title);
      expect(report.description).toBeUndefined();
      expect(report.createdBy).toBe(reportData.createdBy);
      expect(report.status.isDraft()).toBe(true);
    });

    it('should throw error when title is empty', () => {
      const reportData = {
        title: '',
        createdBy: UniqueId.generate(),
        status: ReportStatus.draft(),
      };

      expect(() => Report.create(reportData)).toThrow();
    });

    it('should throw error when title is too long', () => {
      const reportData = {
        title: 'a'.repeat(256), // Assuming max length is 255
        createdBy: UniqueId.generate(),
        status: ReportStatus.draft(),
      };

      expect(() => Report.create(reportData)).toThrow();
    });
  });

  describe('Status Management', () => {
    let report: Report;

    beforeEach(() => {
      report = ReportFactory.createDraft();
    });

    it('should publish a draft report', () => {
      report.publish();

      expect(report.status.equals(ReportStatus.published())).toBe(true);
      expect(report.publishedAt).toBeInstanceOf(Date);
    });

    it('should not publish an already published report', () => {
      report.publish();
      const firstPublishedAt = report.publishedAt;

      expect(() => report.publish()).toThrow();
      expect(report.publishedAt).toBe(firstPublishedAt);
    });

    it('should archive a published report', () => {
      report.publish();
      report.archive();

      expect(report.status.equals(ReportStatus.archived())).toBe(true);
      expect(report.archivedAt).toBeInstanceOf(Date);
    });

    it('should not archive a draft report', () => {
      expect(() => report.archive()).toThrow();
    });

    it('should restore an archived report', () => {
      report.publish();
      report.archive();
      report.restore();

      expect(report.status.equals(ReportStatus.published())).toBe(true);
      expect(report.archivedAt).toBeNull();
    });
  });

  describe('Content Management', () => {
    let report: Report;

    beforeEach(() => {
      report = ReportFactory.createDraft();
    });

    it('should update title', () => {
      const newTitle = 'Updated Title';
      report.updateTitle(newTitle);

      expect(report.title).toBe(newTitle);
      expect(report.updatedAt).toBeInstanceOf(Date);
    });

    it('should update description', () => {
      const newDescription = 'Updated Description';
      report.updateDescription(newDescription);

      expect(report.description).toBe(newDescription);
      expect(report.updatedAt).toBeInstanceOf(Date);
    });

    it('should update content', () => {
      const newContent = { sections: [{ title: 'Section 1', content: 'Content 1' }] };
      report.updateContent(newContent);

      expect(report.content).toEqual(newContent);
      expect(report.updatedAt).toBeInstanceOf(Date);
    });

    it('should not update content of published report', () => {
      report.publish();
      const originalContent = report.content;

      expect(() => report.updateContent({ new: 'content' })).toThrow();
      expect(report.content).toBe(originalContent);
    });
  });

  describe('Visibility Management', () => {
    let report: Report;

    beforeEach(() => {
      report = ReportFactory.createPublished();
    });

    it('should make report public', () => {
      report.makePublic();

      expect(report.isPublic).toBe(true);
    });

    it('should make report private', () => {
      report.makePublic();
      report.makePrivate();

      expect(report.isPublic).toBe(false);
    });

    it('should not make draft report public', () => {
      const draftReport = ReportFactory.createDraft();

      expect(() => draftReport.makePublic()).toThrow();
    });
  });

  describe('Template Management', () => {
    let report: Report;

    beforeEach(() => {
      report = ReportFactory.createDraft();
    });

    it('should set template', () => {
      const templateId = UniqueId.generate();
      report.setTemplate(templateId);

      expect(report.templateId).toBe(templateId);
    });

    it('should remove template', () => {
      const templateId = UniqueId.generate();
      report.setTemplate(templateId);
      report.removeTemplate();

      expect(report.templateId).toBeNull();
    });
  });

  describe('Organization Management', () => {
    let report: Report;

    beforeEach(() => {
      report = ReportFactory.createDraft();
    });

    it('should set organization', () => {
      const organizationId = UniqueId.generate();
      report.setOrganization(organizationId);

      expect(report.organizationId).toBe(organizationId);
    });

    it('should remove organization', () => {
      const organizationId = UniqueId.generate();
      report.setOrganization(organizationId);
      report.removeOrganization();

      expect(report.organizationId).toBeNull();
    });
  });

  describe('Metadata Management', () => {
    let report: Report;

    beforeEach(() => {
      report = ReportFactory.createDraft();
    });

    it('should add metadata', () => {
      const metadata = { key1: 'value1', key2: 'value2' };
      report.addMetadata(metadata);

      expect(report.metadata).toEqual(metadata);
    });

    it('should update existing metadata', () => {
      const initialMetadata = { key1: 'value1' };
      const additionalMetadata = { key2: 'value2' };
      
      report.addMetadata(initialMetadata);
      report.addMetadata(additionalMetadata);

      expect(report.metadata).toEqual({ ...initialMetadata, ...additionalMetadata });
    });

    it('should remove metadata key', () => {
      const metadata = { key1: 'value1', key2: 'value2' };
      report.addMetadata(metadata);
      report.removeMetadataKey('key1');

      expect(report.metadata).toEqual({ key2: 'value2' });
    });
  });

  describe('Validation', () => {
    it('should validate report data', () => {
      const validReport = ReportFactory.createDraft();
      expect(validReport.isValid()).toBe(true);
    });

    it('should invalidate report with empty title', () => {
      const report = ReportFactory.createDraft();
      // Assuming we can set invalid state for testing
      expect(() => report.updateTitle('')).toThrow();
    });
  });

  describe('Equality', () => {
    it('should be equal to another report with same id', () => {
      const id = UniqueId.generate();
      const report1 = ReportFactory.create({ id: id.value });
      const report2 = ReportFactory.create({ id: id.value });

      expect(report1.equals(report2)).toBe(true);
    });

    it('should not be equal to another report with different id', () => {
      const report1 = ReportFactory.createDraft();
      const report2 = ReportFactory.createDraft();

      expect(report1.equals(report2)).toBe(false);
    });
  });

  describe('Domain Events', () => {
    it('should raise ReportCreated event when created', () => {
      const report = ReportFactory.createDraft();
      const events = report.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('ReportCreated');
    });

    it('should raise ReportPublished event when published', () => {
      const report = ReportFactory.createDraft();
      report.clearEvents(); // Clear creation event
      
      report.publish();
      const events = report.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('ReportPublished');
    });

    it('should raise ReportArchived event when archived', () => {
      const report = ReportFactory.createPublished();
      report.clearEvents(); // Clear previous events
      
      report.archive();
      const events = report.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('ReportArchived');
    });
  });
});