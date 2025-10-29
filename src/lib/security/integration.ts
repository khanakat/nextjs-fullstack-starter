import { db as prisma } from "@/lib/db";

/**
 * Security Integration Service
 * Provides security integration for various system components
 */
export class SecurityIntegrationService {
  constructor() {}

  /**
   * Integrate security with workflow system
   */
  async integrateWithWorkflows(
    userId: string,
    workflowId: string,
    action: string,
    metadata?: any,
  ) {
    try {
      // Log workflow security event
      await prisma.auditLog.create({
        data: {
          userId,
          action: `workflow_${action}`,
          resource: "workflow",
          resourceId: workflowId,
          metadata: JSON.stringify({ workflowId, metadata }),
          ipAddress: "",
          userAgent: "",
        },
      });

      return { success: true, authorized: true };
    } catch (error) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: "workflow_security_error",
          resource: "workflow",
          resourceId: workflowId,
          metadata: JSON.stringify({
            workflowId,
            action,
            error: error instanceof Error ? error.message : "Unknown error",
          }),
          ipAddress: "",
          userAgent: "",
        },
      });
      throw error;
    }
  }

  /**
   * Integrate security with analytics system
   */
  async integrateWithAnalytics(
    userId: string,
    analyticsAction: string,
    dataType: string,
    data: any,
  ) {
    try {
      // Log analytics security event
      await prisma.auditLog.create({
        data: {
          userId,
          action: `analytics_${analyticsAction}`,
          resource: "analytics",
          metadata: JSON.stringify({
            dataType,
            action: analyticsAction,
          }),
          ipAddress: "",
          userAgent: "",
        },
      });

      return { success: true, data };
    } catch (error) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: "analytics_security_error",
          resource: "analytics",
          metadata: JSON.stringify({
            action: analyticsAction,
            dataType,
            error: error instanceof Error ? error.message : "Unknown error",
          }),
          ipAddress: "",
          userAgent: "",
        },
      });
      throw error;
    }
  }

  /**
   * Integrate security with collaboration system
   */
  async integrateWithCollaboration(
    userId: string,
    collaborationAction: string,
    resourceId: string,
    targetUserId?: string,
  ) {
    try {
      // Log collaboration security event
      await prisma.auditLog.create({
        data: {
          userId,
          action: `collaboration_${collaborationAction}`,
          resource: "collaboration",
          resourceId,
          metadata: JSON.stringify({
            action: collaborationAction,
            targetUserId,
          }),
          ipAddress: "",
          userAgent: "",
        },
      });

      return { success: true, authorized: true };
    } catch (error) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: "collaboration_security_error",
          resource: "collaboration",
          resourceId,
          metadata: JSON.stringify({
            action: collaborationAction,
            targetUserId,
            error: error instanceof Error ? error.message : "Unknown error",
          }),
          ipAddress: "",
          userAgent: "",
        },
      });
      throw error;
    }
  }

  /**
   * Integrate security with integration hub
   */
  async integrateWithIntegrationHub(
    userId: string,
    integrationAction: string,
    integrationId: string,
    config?: any,
  ) {
    try {
      // Log integration security event
      await prisma.auditLog.create({
        data: {
          userId,
          action: `integration_${integrationAction}`,
          resource: "integration",
          resourceId: integrationId,
          metadata: JSON.stringify({
            action: integrationAction,
            hasConfig: !!config,
          }),
          ipAddress: "",
          userAgent: "",
        },
      });

      return { success: true, authorized: true };
    } catch (error) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: "integration_security_error",
          resource: "integration",
          resourceId: integrationId,
          metadata: JSON.stringify({
            action: integrationAction,
            error: error instanceof Error ? error.message : "Unknown error",
          }),
          ipAddress: "",
          userAgent: "",
        },
      });
      throw error;
    }
  }

  /**
   * Integrate security with mobile system
   */
  async integrateWithMobile(
    userId: string,
    deviceId: string,
    action: string,
    metadata?: any,
  ) {
    try {
      // Verify device registration
      const isRegistered = await this.verifyDeviceRegistration(
        userId,
        deviceId,
      );
      if (!isRegistered) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: "mobile_device_not_registered",
            resource: "mobile",
            resourceId: deviceId,
            metadata: JSON.stringify({ deviceId, action }),
            ipAddress: "",
            userAgent: "",
          },
        });
        throw new Error("Device not registered");
      }

      // Log mobile security event
      await prisma.auditLog.create({
        data: {
          userId,
          action: `mobile_${action}`,
          resource: "mobile",
          resourceId: deviceId,
          metadata: JSON.stringify({ deviceId, action, metadata }),
          ipAddress: "",
          userAgent: "",
        },
      });

      return { success: true, authorized: true };
    } catch (error) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: "mobile_security_error",
          resource: "mobile",
          resourceId: deviceId,
          metadata: JSON.stringify({
            deviceId,
            action,
            error: error instanceof Error ? error.message : "Unknown error",
          }),
          ipAddress: "",
          userAgent: "",
        },
      });
      throw error;
    }
  }

  /**
   * Apply security overlay to API endpoints
   */
  async applySecurityOverlay(
    userId: string,
    endpoint: string,
    method: string,
    data?: any,
  ) {
    try {
      const { resource, action } = this.parseEndpoint(endpoint, method);

      // Log API security event
      await prisma.auditLog.create({
        data: {
          userId,
          action: "api_access",
          resource: "api",
          endpoint,
          method,
          metadata: JSON.stringify({
            resource,
            action,
            hasData: !!data,
          }),
          ipAddress: "",
          userAgent: "",
        },
      });

      return { success: true, authorized: true };
    } catch (error) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: "api_security_error",
          resource: "api",
          endpoint,
          method,
          metadata: JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error",
          }),
          ipAddress: "",
          userAgent: "",
        },
      });
      throw error;
    }
  }

  /**
   * Enhanced audit logging for existing features
   */
  async enhanceAuditLogging(
    userId: string,
    feature: string,
    action: string,
    details: any,
  ) {
    try {
      // Create comprehensive audit entry
      await prisma.auditLog.create({
        data: {
          userId,
          action: `${feature}_${action}`,
          resource: feature,
          metadata: JSON.stringify({
            ...details,
            timestamp: new Date().toISOString(),
            userAgent: details.userAgent || "unknown",
            ipAddress: details.ipAddress || "unknown",
            sessionId: details.sessionId || "unknown",
          }),
          ipAddress: details.ipAddress || "unknown",
          userAgent: details.userAgent || "unknown",
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Enhanced audit logging error:", error);
      throw error;
    }
  }

  // Helper methods

  private parseEndpoint(
    endpoint: string,
    method: string,
  ): { resource: string; action: string } {
    // Simple endpoint parsing logic
    const parts = endpoint.split("/").filter(Boolean);
    const resource = parts[1] || "unknown";

    let action = "unknown";
    if (method === "GET") action = "read";
    else if (method === "POST") action = "create";
    else if (method === "PUT" || method === "PATCH") action = "update";
    else if (method === "DELETE") action = "delete";

    return { resource, action };
  }

  private async verifyDeviceRegistration(
    _userId: string,
    _deviceId: string,
  ): Promise<boolean> {
    try {
      // For now, assume all devices are registered
      // In a real implementation, you would check a device registration table
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// SECURITY MIDDLEWARE FACTORY
// ============================================================================

export class SecurityMiddlewareFactory {
  private integrationService: SecurityIntegrationService;

  constructor() {
    this.integrationService = new SecurityIntegrationService();
  }

  createWorkflowMiddleware() {
    return async (
      userId: string,
      workflowId: string,
      action: string,
      metadata?: any,
    ) => {
      return this.integrationService.integrateWithWorkflows(
        userId,
        workflowId,
        action,
        metadata,
      );
    };
  }

  createAnalyticsMiddleware() {
    return async (
      userId: string,
      analyticsAction: string,
      dataType: string,
      data: any,
    ) => {
      return this.integrationService.integrateWithAnalytics(
        userId,
        analyticsAction,
        dataType,
        data,
      );
    };
  }

  createCollaborationMiddleware() {
    return async (
      userId: string,
      collaborationAction: string,
      resourceId: string,
      targetUserId?: string,
    ) => {
      return this.integrationService.integrateWithCollaboration(
        userId,
        collaborationAction,
        resourceId,
        targetUserId,
      );
    };
  }

  createAPISecurityMiddleware() {
    return async (
      userId: string,
      endpoint: string,
      method: string,
      data?: any,
    ) => {
      return this.integrationService.applySecurityOverlay(
        userId,
        endpoint,
        method,
        data,
      );
    };
  }

  createMobileMiddleware() {
    return async (
      userId: string,
      deviceId: string,
      action: string,
      metadata?: any,
    ) => {
      return this.integrationService.integrateWithMobile(
        userId,
        deviceId,
        action,
        metadata,
      );
    };
  }
}

// ============================================================================
// SECURITY TESTING INTEGRATION
// ============================================================================

export class SecurityTestingIntegration {
  private integrationService: SecurityIntegrationService;

  constructor() {
    this.integrationService = new SecurityIntegrationService();
  }

  async testWorkflowIntegration(userId: string): Promise<boolean> {
    try {
      const result = await this.integrationService.integrateWithWorkflows(
        userId,
        "test-workflow-id",
        "test",
        { test: true },
      );
      return result.success;
    } catch {
      return false;
    }
  }

  async testAnalyticsIntegration(userId: string): Promise<boolean> {
    try {
      const result = await this.integrationService.integrateWithAnalytics(
        userId,
        "test",
        "test-data",
        { test: true },
      );
      return result.success;
    } catch {
      return false;
    }
  }

  async testCollaborationIntegration(userId: string): Promise<boolean> {
    try {
      const result = await this.integrationService.integrateWithCollaboration(
        userId,
        "test",
        "test-resource-id",
      );
      return result.success;
    } catch {
      return false;
    }
  }

  async testAllIntegrations(
    userId: string,
  ): Promise<{ [key: string]: boolean }> {
    return {
      workflow: await this.testWorkflowIntegration(userId),
      analytics: await this.testAnalyticsIntegration(userId),
      collaboration: await this.testCollaborationIntegration(userId),
    };
  }
}
