/**
 * Email Templates API Controller
 * Handles HTTP requests for email template management
 */

import { injectable } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { generateRequestId } from '@/lib/utils';
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from '@/lib/standardized-error-responses';
import { handleZodError } from '@/lib/error-handlers';
import { hasPermission, type UserRole } from '@/lib/permissions';
import { db } from '@/lib/db';

const CreateEmailTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100, "Name too long"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
  html: z.string().min(1, "HTML content is required"),
  text: z.string().optional(),
  category: z.enum([
    "welcome",
    "notification",
    "marketing",
    "transactional",
    "newsletter",
  ]),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
});

@injectable()
export class EmailTemplatesApiController {
  /**
   * Helper method to get authenticated user with organization
   */
  private async getAuthenticatedUser(request: NextRequest) {
    const requestId = generateRequestId();
    const { userId: authUserId } = await auth();

    if (!authUserId) {
      return {
        error: StandardErrorResponse.unauthorized(
          "Authentication required",
          requestId,
        ),
      };
    }

    const user = await db.user.findUnique({
      where: { clerkId: authUserId },
      include: {
        organizationMemberships: {
          include: { organization: true },
        },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return {
        error: StandardErrorResponse.forbidden(
          "Organization membership required",
          requestId,
        ),
      };
    }

    return {
      user,
      userId: authUserId,
      organizationId: user.organizationMemberships[0].organizationId,
      role: user.organizationMemberships[0].role as UserRole,
    };
  }

  /**
   * Helper method to check permissions
   */
  private checkPermission(
    user: any,
    role: UserRole,
    organizationId: string,
    action: string,
    resource: string,
    requestId: string
  ) {
    const userWithRole = {
      id: user.id,
      email: user.email,
      role,
      organizationId,
    };

    if (!hasPermission(userWithRole, action as any, resource as any)) {
      return StandardErrorResponse.forbidden(
        `Insufficient permissions to ${action} ${resource}`,
        requestId,
      );
    }

    return null;
  }

  /**
   * POST /api/email/templates - Create a new email template
   */
  async createEmailTemplate(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();
    let userId: string | null = null;
    let organizationId: string | null = null;

    try {
      const authResult = await this.getAuthenticatedUser(request);
      if (authResult.error) return authResult.error;

      const { user, userId: authUserId, organizationId: orgId, role } = authResult;
      userId = authUserId;
      organizationId = orgId;

      const permError = this.checkPermission(
        user,
        role,
        organizationId,
        "create",
        "organizations",
        requestId
      );
      if (permError) return permError;

      logger.info("Creating email template", "email", {
        requestId,
        userId,
        organizationId,
      });

      const body = await request.json();
      const validatedData = CreateEmailTemplateSchema.parse(body);

      // Mock implementation
      const templateId = `template_${Date.now()}`;
      const template = {
        id: templateId,
        ...validatedData,
        organizationId,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      logger.info("Email template created successfully", "email", {
        requestId,
        userId,
        organizationId,
        templateId,
        templateName: validatedData.name,
        category: validatedData.category,
      });

      return StandardSuccessResponse.create(
        {
          message: "Email template created successfully",
          template,
          requestId,
        },
        201,
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, requestId);
      }

      logger.error("Error creating email template", "email", {
        requestId,
        userId,
        organizationId,
        error: error instanceof Error ? error.message : error,
        endpoint: "/api/email/templates",
      });

      return StandardErrorResponse.internal(
        "Failed to create email template",
        process.env.NODE_ENV === "development"
          ? {
              originalError: error instanceof Error ? error.message : error,
            }
          : undefined,
        requestId,
      );
    }
  }

  /**
   * GET /api/email/templates - Get email templates
   */
  async getEmailTemplates(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();
    let userId: string | null = null;
    let organizationId: string | null = null;

    try {
      const authResult = await this.getAuthenticatedUser(request);
      if (authResult.error) return authResult.error;

      const { user, userId: authUserId, organizationId: orgId, role } = authResult;
      userId = authUserId;
      organizationId = orgId;

      const permError = this.checkPermission(
        user,
        role,
        organizationId,
        "read",
        "organizations",
        requestId
      );
      if (permError) return permError;

      const { searchParams } = new URL(request.url);
      const category = searchParams.get("category");
      const isActive = searchParams.get("isActive");
      const page = parseInt(searchParams.get("page") || "1");
      const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
      const search = searchParams.get("search");

      logger.info("Fetching email templates", "email", {
        requestId,
        userId,
        organizationId,
        category,
        isActive,
        page,
        limit,
        search,
      });

      // Mock email templates data
      const mockTemplates = [
        {
          id: "template_1",
          name: "Welcome Email",
          subject: "Welcome to {{company_name}}!",
          category: "welcome",
          isActive: true,
          variables: ["company_name", "user_name", "login_url"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 1250,
        },
        {
          id: "template_2",
          name: "Password Reset",
          subject: "Reset your password",
          category: "transactional",
          isActive: true,
          variables: ["user_name", "reset_url", "expiry_time"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 89,
        },
        {
          id: "template_3",
          name: "Monthly Newsletter",
          subject: "Your monthly update from {{company_name}}",
          category: "newsletter",
          isActive: true,
          variables: ["company_name", "month", "highlights"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 456,
        },
      ];

      // Apply filters
      let filteredTemplates = mockTemplates;
      if (category) {
        filteredTemplates = filteredTemplates.filter(
          (t) => t.category === category,
        );
      }
      if (isActive !== null) {
        filteredTemplates = filteredTemplates.filter(
          (t) => t.isActive === (isActive === "true"),
        );
      }
      if (search) {
        filteredTemplates = filteredTemplates.filter(
          (t) =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.subject.toLowerCase().includes(search.toLowerCase()),
        );
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const paginatedTemplates = filteredTemplates.slice(
        startIndex,
        startIndex + limit,
      );

      return StandardSuccessResponse.create({
        templates: paginatedTemplates,
        pagination: {
          page,
          limit,
          total: filteredTemplates.length,
          totalPages: Math.ceil(filteredTemplates.length / limit),
        },
        filters: {
          category,
          isActive,
          search,
        },
        requestId,
      });
    } catch (error) {
      logger.error("Error fetching email templates", "email", {
        requestId,
        userId,
        organizationId,
        error: error instanceof Error ? error.message : error,
        endpoint: "/api/email/templates",
      });

      return StandardErrorResponse.internal(
        "Failed to fetch email templates",
        process.env.NODE_ENV === "development"
          ? {
              originalError: error instanceof Error ? error.message : error,
            }
          : undefined,
        requestId,
      );
    }
  }
}
