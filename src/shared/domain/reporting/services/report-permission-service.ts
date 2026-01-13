import { UniqueId } from '../../value-objects/unique-id';
import { Report } from '../entities/report';
import { ReportTemplate } from '../entities/report-template';
import { ScheduledReport } from '../entities/scheduled-report';
import { BusinessRuleViolationError } from '../../exceptions/business-rule-violation-error';

export enum Permission {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  PUBLISH = 'PUBLISH',
  SCHEDULE = 'SCHEDULE',
  SHARE = 'SHARE',
  EXPORT = 'EXPORT',
  ADMIN = 'ADMIN',
}

export enum Role {
  VIEWER = 'VIEWER',
  EDITOR = 'EDITOR',
  PUBLISHER = 'PUBLISHER',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
}

export interface UserContext {
  userId: UniqueId;
  organizationId?: UniqueId;
  roles: Role[];
  permissions: Permission[];
  isSystemAdmin: boolean;
}

export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: string;
  requiredPermission?: Permission;
  suggestedAction?: string;
}

// Specialized result types for specific operations used in tests
export interface ActionCheckResult {
  canPerform: boolean;
  reason?: string;
  requiredPermission?: Permission;
  suggestedAction?: string;
}

export interface CreateCheckResult {
  canCreate: boolean;
  reason?: string;
}

export interface ExportCheckResult {
  canExport: boolean;
  reason?: string;
  requiredPermission?: Permission;
  suggestedAction?: string;
}

/**
 * Domain service for report permission and access control
 * Handles complex business logic for authorization
 */
export class ReportPermissionService {
  private static readonly ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [Role.VIEWER]: [Permission.READ, Permission.EXPORT],
    [Role.EDITOR]: [Permission.READ, Permission.WRITE, Permission.EXPORT],
    [Role.PUBLISHER]: [Permission.READ, Permission.WRITE, Permission.PUBLISH, Permission.EXPORT, Permission.SHARE],
    [Role.ADMIN]: [Permission.READ, Permission.WRITE, Permission.PUBLISH, Permission.DELETE, Permission.SCHEDULE, Permission.SHARE, Permission.EXPORT],
    [Role.OWNER]: Object.values(Permission),
  };

  /**
   * Check if user can access a report
   */
  public static canAccessReport(user: UserContext, report: Report): AccessCheckResult {
    // System admins have full access
    if (user.isSystemAdmin) {
      return { hasAccess: true, reason: 'System admin has access to all reports' };
    }

    // Owner has full access
    if (report.isCreatedBy(user.userId)) {
      return { hasAccess: true, reason: 'User is the owner of the report' };
    }

    // Public reports can be read by anyone
    if (report.isPublic) {
      return { hasAccess: true, reason: 'Report is public' };
    }

    // Organization members can access organization reports
    if (report.organizationId && user.organizationId && 
        report.belongsToOrganization(user.organizationId) &&
        this.hasPermission(user, Permission.READ)) {
      return { hasAccess: true, reason: "Report belongs to user's organization" };
    }

    // Shared reports access
    const sharedPerms = this.getSharedPermissions(report, user.userId);
    if (sharedPerms.includes(Permission.READ)) {
      return { hasAccess: true, reason: 'Report is shared with user' };
    }

    return {
      hasAccess: false,
      reason: 'No access to this report',
      requiredPermission: Permission.READ,
      suggestedAction: 'Request access from the report owner or organization admin',
    };
  }

  /**
   * Check if user can perform a specific action on a report
   */
  public static canPerformAction(
    user: UserContext,
    report: Report,
    action: Permission
  ): ActionCheckResult {
    // First check basic access
    const accessCheck = this.canAccessReport(user, report);
    if (!accessCheck.hasAccess) {
      return { canPerform: false, reason: accessCheck.reason };
    }

    // Business rules first (override even for owner/admin where appropriate)
    const ruleCheck = this.checkActionSpecificRules(report, user, action);
    if (!ruleCheck.hasAccess) {
      return { canPerform: false, reason: ruleCheck.reason, suggestedAction: ruleCheck.suggestedAction };
    }

    // System admins can do anything
    if (user.isSystemAdmin) {
      return { canPerform: true };
    }

    // Owner can do anything
    if (report.isCreatedBy(user.userId)) {
      return { canPerform: true, reason: 'User is the owner of the report' };
    }

    // If report is shared, respect shared permissions explicitly
    const sharedPerms = this.getSharedPermissions(report, user.userId);
    if (sharedPerms.length > 0) {
      return {
        canPerform: sharedPerms.includes(action),
        reason: sharedPerms.includes(action) ? undefined : undefined,
      };
    }

    // Check specific permission
    if (!this.hasPermission(user, action)) {
      return {
        canPerform: false,
        reason: `User does not have ${action} permission`,
        requiredPermission: action,
        suggestedAction: this.getSuggestedActionForPermission(action),
      };
    }

    return { canPerform: true };
  }

  /**
   * Check if user can access a report template
   */
  public static canAccessTemplate(user: UserContext, template: ReportTemplate): AccessCheckResult {
    // System admins have full access
    if (user.isSystemAdmin) {
      return { hasAccess: true, reason: 'System admin has access to all templates' };
    }

    // System templates are accessible to all users
    if (template.isSystem) {
      if (template.isActive) {
        return { hasAccess: true, reason: 'System template is accessible to all users' };
      } else {
        return { hasAccess: false, reason: 'Template is not active' };
      }
    }

    // Owner has full access
    if (template.isCreatedBy(user.userId)) {
      return { hasAccess: true, reason: 'User is the owner of the template' };
    }

    // Organization members can access organization templates
    if (template.organizationId && user.organizationId && 
        template.belongsToOrganization(user.organizationId)) {
      return { hasAccess: true, reason: "Template belongs to user's organization" };
    }

    return {
      hasAccess: false,
      reason: 'No access to this template',
      suggestedAction: 'Use system templates or create your own template',
    };
  }

  /**
   * Check if user can access a scheduled report
   */
  public static canAccessScheduledReport(
    user: UserContext,
    scheduledReport: ScheduledReport
  ): AccessCheckResult {
    // System admins have full access
    if (user.isSystemAdmin) {
      return { hasAccess: true, reason: 'System admin has access to all scheduled reports' };
    }

    // Owner has full access
    if (scheduledReport.isCreatedBy(user.userId)) {
      return { hasAccess: true, reason: 'User is the owner of the scheduled report' };
    }

    // Organization members can access organization scheduled reports
    if (scheduledReport.organizationId && user.organizationId && 
        scheduledReport.belongsToOrganization(user.organizationId) &&
        this.hasPermission(user, Permission.READ)) {
      return { hasAccess: true, reason: "Scheduled report belongs to user's organization" };
    }

    return {
      hasAccess: false,
      reason: 'No access to this scheduled report',
      requiredPermission: Permission.READ,
      suggestedAction: 'Request access from the scheduled report owner or organization admin',
    };
  }

  /**
   * Get effective permissions for a user on a specific report
   */
  public static getEffectivePermissions(user: UserContext, report: Report): Permission[] {
    const accessCheck = this.canAccessReport(user, report);
    if (!accessCheck.hasAccess) {
      return [];
    }

    // System admins have all permissions
    if (user.isSystemAdmin) {
      return Object.values(Permission);
    }

    // Owner has all permissions
    if (report.isCreatedBy(user.userId)) {
      return Object.values(Permission);
    }

    // For public reports, return user's general permissions
    if (report.isPublic) {
      return [Permission.READ];
    }

    // For organization reports, return intersection of user permissions and organization access
    if (report.organizationId && user.organizationId && 
        report.belongsToOrganization(user.organizationId)) {
      // Limit to READ/WRITE for organization-level access
      const orgAllowed = new Set([Permission.READ, Permission.WRITE]);
      return this.getUserPermissions(user).filter(p => orgAllowed.has(p));
    }

    // Shared reports: return explicit shared permissions
    const sharedPerms = this.getSharedPermissions(report, user.userId);
    if (sharedPerms.length > 0) {
      return sharedPerms;
    }

    return [];
  }

  /**
   * Check if user can create reports in an organization
   */
  public static canCreateReportInOrganization(
    user: UserContext,
    organizationId?: UniqueId
  ): CreateCheckResult {
    if (!organizationId) {
      // Personal reports - user can always create
      return { canCreate: true, reason: 'User can create personal reports' };
    }

    if (user.isSystemAdmin) {
      return { canCreate: true, reason: 'System admin can create reports in any organization' };
    }

    if (!user.organizationId || !user.organizationId.equals(organizationId)) {
      return { canCreate: false, reason: 'User does not belong to the organization' };
    }

    // Require explicit write permission (not just role-derived)
    if (!user.permissions.includes(Permission.WRITE)) {
      return { canCreate: false, reason: 'User lacks create permissions in the organization' };
    }

    return { canCreate: true, reason: 'User belongs to the organization' };
  }

  /**
   * Validate sharing permissions
   */
  public static validateSharingRequest(
    user: UserContext,
    report: Report,
    request: { targetUserId?: UniqueId; targetUserIds?: UniqueId[]; permissions: Permission[] }
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if user can share the report
    const isOwner = report.isCreatedBy(user.userId);
    const hasSharePermission = this.hasPermission(user, Permission.SHARE);
    if (!isOwner && !hasSharePermission) {
      errors.push('User does not have permission to share this report');
      return { isValid: false, errors, warnings };
    }

    // Validate permissions being granted
    // User can only grant permissions they explicitly have (direct or via role),
    // ownership does not implicitly grant sharable permissions
    const userPermissions = this.getUserPermissions(user);
    const requestedPermissions = request.permissions || [];
    requestedPermissions.forEach(p => {
      if (p === Permission.ADMIN) {
        // Allow, but warn below
        return;
      }
      if (!userPermissions.includes(p)) {
        errors.push(`Cannot grant ${p} permission - user does not have this permission`);
      }
    });

    // Check for potential security issues
    if (requestedPermissions.includes(Permission.ADMIN)) {
      warnings.push('Granting admin permissions gives full control over the report');
    }

    const targets = request.targetUserIds || (request.targetUserId ? [request.targetUserId] : []);
    if (targets.length > 10) {
      warnings.push(`Sharing with many users (${targets.length}) - consider making the report public instead`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check export permissions with format restrictions
   */
  public static canExportReport(
    user: UserContext,
    report: Report,
    format: 'PDF' | 'EXCEL' | 'CSV'
  ): ExportCheckResult {
    // Export requires explicit export permission, regardless of role/ownership
    if (!user.permissions.includes(Permission.EXPORT)) {
      return { canExport: false, reason: 'User does not have export permission' };
    }

    // Excel export requires explicit write permission
    if (format === 'EXCEL' && !user.permissions.includes(Permission.WRITE)) {
      return {
        canExport: false,
        reason: 'Excel export requires write permission',
        requiredPermission: Permission.WRITE,
        suggestedAction: 'Use PDF or CSV export, or request write access',
      };
    }

    return { canExport: true };
  }

  // Private helper methods
  private static hasPermission(user: UserContext, permission: Permission): boolean {
    // Direct permission check
    if (user.permissions.includes(permission)) {
      return true;
    }

    // Role-based permission check
    return user.roles.some(role => 
      this.ROLE_PERMISSIONS[role]?.includes(permission)
    );
  }

  private static getUserPermissions(user: UserContext): Permission[] {
    const permissions = new Set(user.permissions);
    
    user.roles.forEach(role => {
      this.ROLE_PERMISSIONS[role]?.forEach(permission => {
        permissions.add(permission);
      });
    });

    return Array.from(permissions);
  }

  private static checkActionSpecificRules(
    report: Report,
    user: UserContext,
    action: Permission
  ): AccessCheckResult {
    switch (action) {
      case Permission.PUBLISH:
        if (report.isPublished()) {
          return {
            hasAccess: false,
            reason: 'Report is already published',
            suggestedAction: 'Create a new version or update the existing published report',
          };
        }
        break;

      case Permission.DELETE:
        if (report.isPublished() && !user.roles.includes(Role.ADMIN)) {
          return {
            hasAccess: false,
            reason: 'Only admins can delete published reports',
            suggestedAction: 'Archive the report instead or contact an admin',
          };
        }
        break;

      case Permission.SCHEDULE:
        if (!report.isPublished()) {
          return {
            hasAccess: false,
            reason: 'Only published reports can be scheduled',
            suggestedAction: 'Publish the report first',
          };
        }
        break;
    }

    return { hasAccess: true };
  }

  private static getSuggestedActionForPermission(permission: Permission): string {
    switch (permission) {
      case Permission.READ:
        return 'Request read access from the report owner';
      case Permission.WRITE:
        return 'Request edit access from the report owner or admin';
      case Permission.PUBLISH:
        return 'Request publish permissions from an admin';
      case Permission.DELETE:
        return 'Request delete permissions from an admin';
      case Permission.SCHEDULE:
        return 'Request scheduling permissions from an admin';
      case Permission.SHARE:
        return 'Request sharing permissions from the report owner';
      case Permission.EXPORT:
        return 'Request export permissions from an admin';
      case Permission.ADMIN:
        return 'Contact a system administrator';
      default:
        return 'Contact an administrator for access';
    }
  }

  private static getSharedPermissions(report: Report, userId: UniqueId): Permission[] {
    const sharedWith = (report as any).sharedWith as Array<{ userId: any; permissions: Permission[] }> | undefined;
    if (!Array.isArray(sharedWith)) return [];
    const entry = sharedWith.find(item => {
      const target = item.userId;
      if (!target) return false;
      if (typeof target === 'string') {
        return target === userId.id;
      }
      if (target instanceof UniqueId) {
        return target.equals(userId);
      }
      if (typeof target === 'object' && typeof (target as any).id === 'string') {
        return (target as any).id === userId.id;
      }
      return false;
    });
    return entry?.permissions || [];
  }
}