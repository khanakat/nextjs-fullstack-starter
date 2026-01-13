import { ReportPermissionService, Permission, Role, UserContext, AccessCheckResult } from '../../../../shared/domain/reporting/services/report-permission-service';
import { Report } from '../../../../shared/domain/reporting/entities/report';
import { ScheduledReport } from '../../../../shared/domain/reporting/entities/scheduled-report';
import { ReportTemplate } from '../../../../shared/domain/reporting/entities/report-template';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ReportFactory } from '../../../factories/report-factory';
import { ScheduledReportFactory } from '../../../factories/scheduled-report-factory';
import { ReportTemplateFactory } from '../../../factories/report-template-factory';

describe('ReportPermissionService', () => {
  const mockUserId = UniqueId.create('user-123');
  const mockOrganizationId = UniqueId.create('org-456');
  const mockOtherUserId = UniqueId.create('user-789');
  const mockOtherOrganizationId = UniqueId.create('org-999');

  let mockUserContext: UserContext;
  let mockSystemAdminContext: UserContext;
  let mockReport: Report;
  let mockScheduledReport: ScheduledReport;
  let mockTemplate: ReportTemplate;

  beforeEach(() => {
    mockUserContext = {
      userId: mockUserId,
      organizationId: mockOrganizationId,
      isSystemAdmin: false,
      permissions: [Permission.READ, Permission.WRITE],
      roles: [Role.EDITOR],
    };

    mockSystemAdminContext = {
      userId: mockUserId,
      organizationId: mockOrganizationId,
      isSystemAdmin: true,
      permissions: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN],
      roles: [Role.ADMIN],
    };

    mockReport = ReportFactory.create({
      id: UniqueId.create('report-123'),
      createdBy: mockUserId,
      organizationId: mockOrganizationId,
      isPublic: false,
      sharedWith: [],
    });

    mockScheduledReport = ScheduledReportFactory.create({
      id: UniqueId.create('scheduled-123'),
      createdBy: mockUserId,
      organizationId: mockOrganizationId,
    });

    mockTemplate = ReportTemplateFactory.create({
      id: UniqueId.create('template-123'),
      createdBy: mockUserId,
      organizationId: mockOrganizationId,
      isSystemTemplate: false,
      isActive: true,
    });
  });

  describe('canAccessReport', () => {
    it('should allow system admin to access any report', () => {
      // Arrange
      const otherUserReport = ReportFactory.create({
        createdBy: mockOtherUserId,
        organizationId: mockOtherOrganizationId,
      });

      // Act
      const result = ReportPermissionService.canAccessReport(mockSystemAdminContext, otherUserReport);

      // Assert
      expect(result.hasAccess).toBe(true);
      expect(result.reason).toBe('System admin has access to all reports');
    });

    it('should allow owner to access their own report', () => {
      // Act
      const result = ReportPermissionService.canAccessReport(mockUserContext, mockReport);

      // Assert
      expect(result.hasAccess).toBe(true);
      expect(result.reason).toBe('User is the owner of the report');
    });

    it('should allow access to public reports', () => {
      // Arrange
      const publicReport = ReportFactory.create({
        createdBy: mockOtherUserId,
        organizationId: mockOtherOrganizationId,
        isPublic: true,
      });

      // Act
      const result = ReportPermissionService.canAccessReport(mockUserContext, publicReport);

      // Assert
      expect(result.hasAccess).toBe(true);
      expect(result.reason).toBe('Report is public');
    });

    it('should allow access to reports in same organization', () => {
      // Arrange
      const orgReport = ReportFactory.create({
        createdBy: mockOtherUserId,
        organizationId: mockOrganizationId,
      });

      // Act
      const result = ReportPermissionService.canAccessReport(mockUserContext, orgReport);

      // Assert
      expect(result.hasAccess).toBe(true);
      expect(result.reason).toBe('Report belongs to user\'s organization');
    });

    it('should allow access to shared reports', () => {
      // Arrange
      const sharedReport = ReportFactory.create({
        createdBy: mockOtherUserId,
        organizationId: mockOtherOrganizationId,
        sharedWith: [{ userId: mockUserId, permissions: [Permission.READ] }],
      });

      // Act
      const result = ReportPermissionService.canAccessReport(mockUserContext, sharedReport);

      // Assert
      expect(result.hasAccess).toBe(true);
      expect(result.reason).toBe('Report is shared with user');
    });

    it('should deny access to private reports from other organizations', () => {
      // Arrange
      const privateReport = ReportFactory.create({
        createdBy: mockOtherUserId,
        organizationId: mockOtherOrganizationId,
        isPublic: false,
        sharedWith: [],
      });

      // Act
      const result = ReportPermissionService.canAccessReport(mockUserContext, privateReport);

      // Assert
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('No access to this report');
    });
  });

  describe('canPerformAction', () => {
    it('should allow owner to perform any action', () => {
      // Act
      const result = ReportPermissionService.canPerformAction(mockUserContext, mockReport, 'DELETE');

      // Assert
      expect(result.canPerform).toBe(true);
      expect(result.reason).toBe('User is the owner of the report');
    });

    it('should check specific permissions for shared reports', () => {
      // Arrange
      const sharedReport = ReportFactory.create({
        createdBy: mockOtherUserId,
        organizationId: mockOtherOrganizationId,
        sharedWith: [{ userId: mockUserId, permissions: [Permission.READ] }],
      });

      // Act
      const readResult = ReportPermissionService.canPerformAction(mockUserContext, sharedReport, 'READ');
      const writeResult = ReportPermissionService.canPerformAction(mockUserContext, sharedReport, 'WRITE');

      // Assert
      expect(readResult.canPerform).toBe(true);
      expect(writeResult.canPerform).toBe(false);
    });

    it('should enforce business rules for specific actions', () => {
      // Arrange
      const draftReport = ReportFactory.create({
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
        isPublished: false,
      });

      const publishedReport = ReportFactory.create({
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
        isPublished: true,
      });

      // Act
      const publishDraftResult = ReportPermissionService.canPerformAction(mockUserContext, draftReport, 'PUBLISH');
      const publishPublishedResult = ReportPermissionService.canPerformAction(mockUserContext, publishedReport, 'PUBLISH');

      // Assert
      expect(publishDraftResult.canPerform).toBe(true);
      expect(publishPublishedResult.canPerform).toBe(false);
      expect(publishPublishedResult.reason).toBe('Report is already published');
    });

    it('should require admin permission to delete published reports', () => {
      // Arrange
      const publishedReport = ReportFactory.create({
        createdBy: mockOtherUserId,
        organizationId: mockOrganizationId,
        isPublished: true,
      });

      const regularUserContext = {
        ...mockUserContext,
        permissions: [Permission.READ, Permission.WRITE],
      };

      // Act
      const result = ReportPermissionService.canPerformAction(regularUserContext, publishedReport, 'DELETE');

      // Assert
      expect(result.canPerform).toBe(false);
      expect(result.reason).toBe('Only admins can delete published reports');
    });

    it('should require published report for scheduling', () => {
      // Arrange
      const draftReport = ReportFactory.create({
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
        isPublished: false,
      });

      // Act
      const result = ReportPermissionService.canPerformAction(mockUserContext, draftReport, 'SCHEDULE');

      // Assert
      expect(result.canPerform).toBe(false);
      expect(result.reason).toBe('Only published reports can be scheduled');
    });
  });

  describe('canAccessTemplate', () => {
    it('should allow system admin to access any template', () => {
      // Arrange
      const otherTemplate = ReportTemplateFactory.create({
        createdBy: mockOtherUserId,
        organizationId: mockOtherOrganizationId,
      });

      // Act
      const result = ReportPermissionService.canAccessTemplate(mockSystemAdminContext, otherTemplate);

      // Assert
      expect(result.hasAccess).toBe(true);
      expect(result.reason).toBe('System admin has access to all templates');
    });

    it('should allow access to system templates', () => {
      // Arrange
      const systemTemplate = ReportTemplateFactory.create({
        isSystemTemplate: true,
        isActive: true,
      });

      // Act
      const result = ReportPermissionService.canAccessTemplate(mockUserContext, systemTemplate);

      // Assert
      expect(result.hasAccess).toBe(true);
      expect(result.reason).toBe('System template is accessible to all users');
    });

    it('should allow owner to access their template', () => {
      // Act
      const result = ReportPermissionService.canAccessTemplate(mockUserContext, mockTemplate);

      // Assert
      expect(result.hasAccess).toBe(true);
      expect(result.reason).toBe('User is the owner of the template');
    });

    it('should allow access to templates in same organization', () => {
      // Arrange
      const orgTemplate = ReportTemplateFactory.create({
        createdBy: mockOtherUserId,
        organizationId: mockOrganizationId,
        isActive: true,
      });

      // Act
      const result = ReportPermissionService.canAccessTemplate(mockUserContext, orgTemplate);

      // Assert
      expect(result.hasAccess).toBe(true);
      expect(result.reason).toBe('Template belongs to user\'s organization');
    });

    it('should deny access to inactive system templates', () => {
      // Arrange
      const inactiveSystemTemplate = ReportTemplateFactory.create({
        isSystemTemplate: true,
        isActive: false,
      });

      // Act
      const result = ReportPermissionService.canAccessTemplate(mockUserContext, inactiveSystemTemplate);

      // Assert
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('Template is not active');
    });

    it('should deny access to templates from other organizations', () => {
      // Arrange
      const otherOrgTemplate = ReportTemplateFactory.create({
        createdBy: mockOtherUserId,
        organizationId: mockOtherOrganizationId,
        isSystemTemplate: false,
      });

      // Act
      const result = ReportPermissionService.canAccessTemplate(mockUserContext, otherOrgTemplate);

      // Assert
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('No access to this template');
    });
  });

  describe('canAccessScheduledReport', () => {
    it('should allow system admin to access any scheduled report', () => {
      // Arrange
      const otherScheduledReport = ScheduledReportFactory.create({
        createdBy: mockOtherUserId,
        organizationId: mockOtherOrganizationId,
      });

      // Act
      const result = ReportPermissionService.canAccessScheduledReport(mockSystemAdminContext, otherScheduledReport);

      // Assert
      expect(result.hasAccess).toBe(true);
      expect(result.reason).toBe('System admin has access to all scheduled reports');
    });

    it('should allow owner to access their scheduled report', () => {
      // Act
      const result = ReportPermissionService.canAccessScheduledReport(mockUserContext, mockScheduledReport);

      // Assert
      expect(result.hasAccess).toBe(true);
      expect(result.reason).toBe('User is the owner of the scheduled report');
    });

    it('should allow access to scheduled reports in same organization', () => {
      // Arrange
      const orgScheduledReport = ScheduledReportFactory.create({
        createdBy: mockOtherUserId,
        organizationId: mockOrganizationId,
      });

      // Act
      const result = ReportPermissionService.canAccessScheduledReport(mockUserContext, orgScheduledReport);

      // Assert
      expect(result.hasAccess).toBe(true);
      expect(result.reason).toBe('Scheduled report belongs to user\'s organization');
    });

    it('should deny access to scheduled reports from other organizations', () => {
      // Arrange
      const otherOrgScheduledReport = ScheduledReportFactory.create({
        createdBy: mockOtherUserId,
        organizationId: mockOtherOrganizationId,
      });

      // Act
      const result = ReportPermissionService.canAccessScheduledReport(mockUserContext, otherOrgScheduledReport);

      // Assert
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('No access to this scheduled report');
    });
  });

  describe('getEffectivePermissions', () => {
    it('should return all permissions for system admin', () => {
      // Act
      const permissions = ReportPermissionService.getEffectivePermissions(mockSystemAdminContext, mockReport);

      // Assert
      expect(permissions).toContain(Permission.READ);
      expect(permissions).toContain(Permission.WRITE);
      expect(permissions).toContain(Permission.DELETE);
      expect(permissions).toContain(Permission.ADMIN);
      expect(permissions).toContain(Permission.SHARE);
      expect(permissions).toContain(Permission.EXPORT);
    });

    it('should return all permissions for owner', () => {
      // Act
      const permissions = ReportPermissionService.getEffectivePermissions(mockUserContext, mockReport);

      // Assert
      expect(permissions).toContain(Permission.READ);
      expect(permissions).toContain(Permission.WRITE);
      expect(permissions).toContain(Permission.DELETE);
      expect(permissions).toContain(Permission.ADMIN);
      expect(permissions).toContain(Permission.SHARE);
      expect(permissions).toContain(Permission.EXPORT);
    });

    it('should return read-only permissions for public reports', () => {
      // Arrange
      const publicReport = ReportFactory.create({
        createdBy: mockOtherUserId,
        organizationId: mockOtherOrganizationId,
        isPublic: true,
      });

      // Act
      const permissions = ReportPermissionService.getEffectivePermissions(mockUserContext, publicReport);

      // Assert
      expect(permissions).toContain(Permission.READ);
      expect(permissions).not.toContain(Permission.WRITE);
      expect(permissions).not.toContain(Permission.DELETE);
      expect(permissions).not.toContain(Permission.ADMIN);
    });

    it('should return specific permissions for shared reports', () => {
      // Arrange
      const sharedReport = ReportFactory.create({
        createdBy: mockOtherUserId,
        organizationId: mockOtherOrganizationId,
        sharedWith: [{ userId: mockUserId, permissions: [Permission.READ, Permission.EXPORT] }],
      });

      // Act
      const permissions = ReportPermissionService.getEffectivePermissions(mockUserContext, sharedReport);

      // Assert
      expect(permissions).toContain(Permission.READ);
      expect(permissions).toContain(Permission.EXPORT);
      expect(permissions).not.toContain(Permission.WRITE);
      expect(permissions).not.toContain(Permission.DELETE);
    });

    it('should return organization-level permissions', () => {
      // Arrange
      const orgReport = ReportFactory.create({
        createdBy: mockOtherUserId,
        organizationId: mockOrganizationId,
      });

      // Act
      const permissions = ReportPermissionService.getEffectivePermissions(mockUserContext, orgReport);

      // Assert
      expect(permissions).toContain(Permission.READ);
      expect(permissions).toContain(Permission.WRITE);
      expect(permissions).not.toContain(Permission.DELETE);
      expect(permissions).not.toContain(Permission.ADMIN);
    });
  });

  describe('canCreateReportInOrganization', () => {
    it('should allow system admin to create reports in any organization', () => {
      // Act
      const result = ReportPermissionService.canCreateReportInOrganization(
        mockSystemAdminContext,
        mockOtherOrganizationId
      );

      // Assert
      expect(result.canCreate).toBe(true);
      expect(result.reason).toBe('System admin can create reports in any organization');
    });

    it('should allow user to create reports in their organization', () => {
      // Act
      const result = ReportPermissionService.canCreateReportInOrganization(
        mockUserContext,
        mockOrganizationId
      );

      // Assert
      expect(result.canCreate).toBe(true);
      expect(result.reason).toBe('User belongs to the organization');
    });

    it('should deny creation in other organizations', () => {
      // Act
      const result = ReportPermissionService.canCreateReportInOrganization(
        mockUserContext,
        mockOtherOrganizationId
      );

      // Assert
      expect(result.canCreate).toBe(false);
      expect(result.reason).toBe('User does not belong to the organization');
    });

    it('should check for create permissions in organization', () => {
      // Arrange
      const limitedUserContext = {
        ...mockUserContext,
        permissions: [Permission.READ],
      };

      // Act
      const result = ReportPermissionService.canCreateReportInOrganization(
        limitedUserContext,
        mockOrganizationId
      );

      // Assert
      expect(result.canCreate).toBe(false);
      expect(result.reason).toBe('User lacks create permissions in the organization');
    });
  });

  describe('validateSharingRequest', () => {
    it('should allow owner to share their report', () => {
      // Arrange
      const sharingRequest = {
        targetUserId: mockOtherUserId,
        permissions: [Permission.READ],
      };

      // Act
      const result = ReportPermissionService.validateSharingRequest(
        mockUserContext,
        mockReport,
        sharingRequest
      );

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should deny sharing by non-owners without share permission', () => {
      // Arrange
      const otherUserReport = ReportFactory.create({
        createdBy: mockOtherUserId,
        organizationId: mockOrganizationId,
      });

      const limitedUserContext = {
        ...mockUserContext,
        permissions: [Permission.READ],
      };

      const sharingRequest = {
        targetUserId: mockOtherUserId,
        permissions: [Permission.READ],
      };

      // Act
      const result = ReportPermissionService.validateSharingRequest(
        limitedUserContext,
        otherUserReport,
        sharingRequest
      );

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('User does not have permission to share this report');
    });

    it('should warn when granting admin permissions', () => {
      // Arrange
      const sharingRequest = {
        targetUserId: mockOtherUserId,
        permissions: [Permission.ADMIN],
      };

      // Act
      const result = ReportPermissionService.validateSharingRequest(
        mockUserContext,
        mockReport,
        sharingRequest
      );

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Granting admin permissions gives full control over the report');
    });

    it('should warn when sharing with many users', () => {
      // Arrange
      const sharingRequest = {
        targetUserIds: Array(15).fill(0).map((_, i) => UniqueId.create(`user-${i}`)),
        permissions: [Permission.READ],
      };

      // Act
      const result = ReportPermissionService.validateSharingRequest(
        mockUserContext,
        mockReport,
        sharingRequest
      );

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Sharing with many users (15) - consider making the report public instead');
    });

    it('should prevent granting permissions user does not have', () => {
      // Arrange
      const limitedUserContext = {
        ...mockUserContext,
        permissions: [Permission.READ, Permission.WRITE],
      };

      const sharingRequest = {
        targetUserId: mockOtherUserId,
        permissions: [Permission.DELETE],
      };

      // Act
      const result = ReportPermissionService.validateSharingRequest(
        limitedUserContext,
        mockReport,
        sharingRequest
      );

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot grant DELETE permission - user does not have this permission');
    });
  });

  describe('canExportReport', () => {
    it('should allow export with export permission', () => {
      // Arrange
      const userWithExportPermission = {
        ...mockUserContext,
        permissions: [Permission.READ, Permission.EXPORT],
      };

      // Act
      const result = ReportPermissionService.canExportReport(userWithExportPermission, mockReport, 'PDF');

      // Assert
      expect(result.canExport).toBe(true);
    });

    it('should deny export without export permission', () => {
      // Arrange
      const userWithoutExportPermission = {
        ...mockUserContext,
        permissions: [Permission.READ],
      };

      // Act
      const result = ReportPermissionService.canExportReport(userWithoutExportPermission, mockReport, 'PDF');

      // Assert
      expect(result.canExport).toBe(false);
      expect(result.reason).toBe('User does not have export permission');
    });

    it('should require write permission for Excel exports', () => {
      // Arrange
      const userWithReadAndExport = {
        ...mockUserContext,
        permissions: [Permission.READ, Permission.EXPORT],
      };

      // Act
      const result = ReportPermissionService.canExportReport(userWithReadAndExport, mockReport, 'EXCEL');

      // Assert
      expect(result.canExport).toBe(false);
      expect(result.reason).toBe('Excel export requires write permission');
    });

    it('should allow Excel export with write permission', () => {
      // Arrange
      const userWithWritePermission = {
        ...mockUserContext,
        permissions: [Permission.READ, Permission.WRITE, Permission.EXPORT],
      };

      // Act
      const result = ReportPermissionService.canExportReport(userWithWritePermission, mockReport, 'EXCEL');

      // Assert
      expect(result.canExport).toBe(true);
    });
  });
});