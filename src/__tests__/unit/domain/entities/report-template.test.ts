import { ReportTemplate, TemplateType, TemplateCategory } from '../../../../shared/domain/reporting/entities/report-template';
import { ReportTemplateFactory } from '../../../factories/report-template-factory';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';
import { BusinessRuleViolationError } from '../../../../shared/domain/exceptions/business-rule-violation-error';

describe('ReportTemplate Entity', () => {
  describe('Creation', () => {
    it('should create a valid report template', () => {
      const template = ReportTemplateFactory.create();

      expect(template).toBeInstanceOf(ReportTemplate);
      expect(template.id).toBeInstanceOf(UniqueId);
      expect(template.name).toBe('Test Report Template');
      expect(template.type).toBe(TemplateType.ANALYTICS);
      expect(template.category).toBe(TemplateCategory.STANDARD);
      expect(template.isActive).toBe(true);
      expect(template.usageCount).toBe(0);
      expect(template.tags).toEqual(['test', 'analytics']);
    });

    it('should create a system template', () => {
      const template = ReportTemplateFactory.createSystemTemplate();

      expect(template.isSystem).toBe(true);
      expect(template.name).toBe('System Analytics Template');
      expect(template.tags).toContain('system');
    });

    it('should create different template types', () => {
      const dashboardTemplate = ReportTemplateFactory.createDashboardTemplate();
      const financialTemplate = ReportTemplateFactory.createFinancialTemplate();
      const operationalTemplate = ReportTemplateFactory.createOperationalTemplate();

      expect(dashboardTemplate.type).toBe(TemplateType.DASHBOARD);
      expect(financialTemplate.type).toBe(TemplateType.FINANCIAL);
      expect(operationalTemplate.type).toBe(TemplateType.OPERATIONAL);
    });

    it('should throw ValidationError for invalid name', () => {
      expect(() => {
        ReportTemplateFactory.create({ name: '' });
      }).toThrow(ValidationError);

      expect(() => {
        ReportTemplateFactory.create({ name: 'a'.repeat(256) });
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid description', () => {
      expect(() => {
        ReportTemplateFactory.create({ description: 'a'.repeat(1001) });
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid tags', () => {
      expect(() => {
        ReportTemplateFactory.create({ tags: ['a'.repeat(51)] });
      }).toThrow(ValidationError);

      expect(() => {
        ReportTemplateFactory.create({ tags: Array(11).fill('tag') });
      }).toThrow(ValidationError);
    });
  });

  describe('Business Methods', () => {
    let template: ReportTemplate;

    beforeEach(() => {
      template = ReportTemplateFactory.create();
    });

    it('should update name successfully', () => {
      const newName = 'Updated Template Name';
      template.updateName(newName);

      expect(template.name).toBe(newName);
      expect(template.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw ValidationError when updating with invalid name', () => {
      expect(() => {
        template.updateName('');
      }).toThrow(ValidationError);

      expect(() => {
        template.updateName('a'.repeat(256));
      }).toThrow(ValidationError);
    });

    it('should update description successfully', () => {
      const newDescription = 'Updated description';
      template.updateDescription(newDescription);

      expect(template.description).toBe(newDescription);
    });

    it('should clear description when set to undefined', () => {
      template.updateDescription(undefined);
      expect(template.description).toBeUndefined();
    });

    it('should add tags successfully', () => {
      const initialTagsCount = template.tags.length;
      template.addTag('new-tag');

      expect(template.tags).toHaveLength(initialTagsCount + 1);
      expect(template.tags).toContain('new-tag');
    });

    it('should not add duplicate tags', () => {
      const existingTag = template.tags[0];
      const initialTagsCount = template.tags.length;
      
      template.addTag(existingTag);

      expect(template.tags).toHaveLength(initialTagsCount);
    });

    it('should remove tags successfully', () => {
      const tagToRemove = template.tags[0];
      const initialTagsCount = template.tags.length;
      
      template.removeTag(tagToRemove);

      expect(template.tags).toHaveLength(initialTagsCount - 1);
      expect(template.tags).not.toContain(tagToRemove);
    });

    it('should increment usage count', () => {
      const initialCount = template.usageCount;
      template.incrementUsage();

      expect(template.usageCount).toBe(initialCount + 1);
    });

    it('should activate template', () => {
      template.deactivate();
      expect(template.isActive).toBe(false);

      template.activate();
      expect(template.isActive).toBe(true);
    });

    it('should deactivate template', () => {
      expect(template.isActive).toBe(true);
      
      template.deactivate();
      expect(template.isActive).toBe(false);
    });

    it('should throw BusinessRuleViolationError when trying to deactivate system template', () => {
      const systemTemplate = ReportTemplateFactory.createSystemTemplate();

      expect(() => {
        systemTemplate.deactivate();
      }).toThrow(BusinessRuleViolationError);
    });

    it('should update preview image URL', () => {
      const newImageUrl = 'https://example.com/new-preview.jpg';
      template.updatePreviewImage(newImageUrl);

      expect(template.previewImageUrl).toBe(newImageUrl);
    });

    it('should clear preview image URL', () => {
      template.updatePreviewImage(undefined);
      expect(template.previewImageUrl).toBeUndefined();
    });
  });

  describe('Domain Events', () => {
    it('should raise ReportTemplateCreatedEvent on creation', () => {
      const template = ReportTemplateFactory.create();
      const events = template.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('ReportTemplateCreatedEvent');
    });

    it('should raise ReportTemplateUpdatedEvent on name update', () => {
      const template = ReportTemplateFactory.create();
      template.clearEvents(); // Clear creation event

      template.updateName('New Name');
      const events = template.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('ReportTemplateUpdatedEvent');
    });

    it('should raise ReportTemplateUsedEvent on usage increment', () => {
      const template = ReportTemplateFactory.create();
      template.clearEvents(); // Clear creation event

      template.incrementUsage();
      const events = template.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('ReportTemplateUsedEvent');
    });
  });

  describe('Business Rules', () => {
    it('should enforce maximum tag limit', () => {
      const template = ReportTemplateFactory.create({ tags: [] });

      // Add 10 tags (maximum allowed)
      for (let i = 0; i < 10; i++) {
        template.addTag(`tag-${i}`);
      }

      expect(template.tags).toHaveLength(10);

      // Adding 11th tag should throw error
      expect(() => {
        template.addTag('tag-11');
      }).toThrow(BusinessRuleViolationError);
    });

    it('should enforce tag length limit', () => {
      const template = ReportTemplateFactory.create();

      expect(() => {
        template.addTag('a'.repeat(51));
      }).toThrow(ValidationError);
    });

    it('should prevent modification of system templates by non-system users', () => {
      const systemTemplate = ReportTemplateFactory.createSystemTemplate();

      expect(() => {
        systemTemplate.updateName('Modified System Template');
      }).toThrow(BusinessRuleViolationError);
    });

    it('should allow system users to modify system templates', () => {
      const systemTemplate = ReportTemplateFactory.createSystemTemplate();

      expect(() => {
        systemTemplate.updateNameAsSystem('Modified System Template');
      }).not.toThrow();

      expect(systemTemplate.name).toBe('Modified System Template');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tags array', () => {
      const template = ReportTemplateFactory.create({ tags: [] });
      expect(template.tags).toEqual([]);
    });

    it('should handle undefined organization ID', () => {
      const template = ReportTemplateFactory.create({ organizationId: undefined });
      expect(template.organizationId).toBeUndefined();
    });

    it('should handle minimal configuration', () => {
      const template = ReportTemplateFactory.createWithMinimalConfig();
      
      expect(template.name).toBe('Minimal Template');
      expect(template.tags).toEqual([]);
      expect(template.description).toBeUndefined();
    });

    it('should maintain immutability of tags array', () => {
      const template = ReportTemplateFactory.create();
      const tags = template.tags;
      
      tags.push('new-tag');
      
      expect(template.tags).not.toContain('new-tag');
    });
  });

  describe('Validation', () => {
    it('should validate template configuration on creation', () => {
      expect(() => {
        ReportTemplateFactory.create({ name: null as any });
      }).toThrow(ValidationError);
    });

    it('should validate business rules consistently', () => {
      const template1 = ReportTemplateFactory.create();
      const template2 = ReportTemplateFactory.create();

      // Both templates should follow the same business rules
      expect(() => template1.addTag('a'.repeat(51))).toThrow(ValidationError);
      expect(() => template2.addTag('a'.repeat(51))).toThrow(ValidationError);
    });
  });
});