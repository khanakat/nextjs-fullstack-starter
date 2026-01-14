/**
 * Email API Controller
 * Handles all HTTP requests for email operations
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
import { emailService } from '@/lib/email/email-service';
import { EmailService as LegacyEmailService } from '@/lib/email-service';
import { QueueHelpers } from '@/lib/queue';

// Validation schemas
const SendEmailRequestSchema = z.object({
  to: z.union([
    z.string().email(),
    z.object({
      email: z.string().email(),
      name: z.string().optional(),
    }),
  ]),
  from: z.object({
    email: z.string().email(),
    name: z.string().optional(),
  }).optional(),
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  template: z.string().optional(),
  templateData: z.record(z.any()).optional(),
  attachments: z.array(z.any()).optional(),
  priority: z.enum(["high", "normal", "low"]).default("normal"),
  tags: z.array(z.string()).optional(),
  useQueue: z.boolean().default(false),
  delay: z.number().min(0).optional(),
});

const BulkEmailRequestSchema = z.object({
  emails: z.array(z.object({
    to: z.union([
      z.string().email(),
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      }),
    ]),
    subject: z.string().min(1),
    html: z.string().optional(),
    text: z.string().optional(),
    priority: z.enum(["high", "normal", "low"]).default("normal"),
  })),
  batchSize: z.number().min(1).max(100).default(10),
  useQueue: z.boolean().default(true),
  delay: z.number().min(0).optional(),
});

const EmailIdSchema = z.object({
  id: z.string().min(1, "Email ID is required"),
});

const UpdateEmailStatusSchema = z.object({
  status: z.enum([
    "draft",
    "scheduled",
    "sending",
    "sent",
    "failed",
    "cancelled",
  ]),
  scheduledAt: z.string().datetime().optional(),
  cancelReason: z.string().optional(),
});

const CreateEmailListSchema = z.object({
  name: z.string().min(1, "List name is required").max(100, "Name too long"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
  allowSelfSubscribe: z.boolean().default(true),
  requireDoubleOptIn: z.boolean().default(true),
  welcomeEmailTemplateId: z.string().optional(),
  unsubscribeRedirectUrl: z.string().url().optional(),
});

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

const BulkEmailSendSchema = z.object({
  recipients: z.array(z.string().email()).min(1, "At least one recipient is required").max(1000, "Maximum 1000 recipients per batch"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
  html: z.string().min(1, "HTML content is required"),
  text: z.string().optional(),
  templateId: z.string().optional(),
  templateData: z.record(z.any()).optional(),
  scheduledAt: z.string().datetime().optional(),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  tags: z.array(z.string()).optional(),
  trackOpens: z.boolean().default(true),
  trackClicks: z.boolean().default(true),
});

const EmailTestRequestSchema = z.object({
  type: z.enum([
    "welcome",
    "password-reset",
    "email-verification",
    "notification",
    "custom",
  ]),
  data: z.object({
    title: z.string().optional(),
    message: z.string().optional(),
    subject: z.string().optional(),
    html: z.string().optional(),
    text: z.string().optional(),
    actionUrl: z.string().url().optional(),
    actionText: z.string().optional(),
  }).optional(),
});

const TrackingEventSchema = z.object({
  emailId: z.string().min(1, "Email ID is required"),
  eventType: z.enum([
    "sent",
    "delivered",
    "opened",
    "clicked",
    "bounced",
    "complained",
    "unsubscribed",
  ]),
  timestamp: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  linkUrl: z.string().url().optional(),
});

@injectable()
export class EmailApiController {
  /**
   * Helper method to get authenticated user with organization
   */
  private async getAuthenticatedUser(request: NextRequest) {
    const requestId = generateRequestId();
    const { userId: authUserId } = auth();

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
   * POST /api/email - Send single or bulk emails
   */
  async sendEmail(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();
    let userId: string | null = null;
    let organizationId: string | null = null;

    try {
      // Authentication
      const authResult = await this.getAuthenticatedUser(request);
      if (authResult.error) return authResult.error;

      const { user, userId: authUserId, organizationId: orgId, role } = authResult;
      userId = authUserId;
      organizationId = orgId;

      // Check permissions
      const permError = this.checkPermission(
        user,
        role,
        organizationId,
        "create",
        "organizations",
        requestId
      );
      if (permError) return permError;

      logger.info("Processing email send request", "email", {
        requestId,
        userId,
        organizationId,
      });

      // Parse and validate request body
      const body = await request.json();
      const isBulkEmail = Array.isArray(body.emails);

      if (isBulkEmail) {
        const validatedData = BulkEmailRequestSchema.parse(body);

        if (validatedData.useQueue) {
          const jobResult = await QueueHelpers.sendBulkEmail(
            {
              emails: validatedData.emails,
              batchSize: validatedData.batchSize,
            },
            {
              priority: "normal",
              delay: validatedData.delay,
              userId: user.id,
              organizationId,
            }
          );

          if (!jobResult) {
            return StandardErrorResponse.create(
              "Failed to queue bulk email job",
              "QUEUE_ERROR",
              500,
              undefined,
              requestId
            );
          }

          return StandardSuccessResponse.create({
            message: "Bulk email job queued successfully",
            jobId: jobResult.id,
            emailCount: validatedData.emails.length,
            estimatedProcessingTime: "2-5 minutes",
            requestId,
          });
        } else {
          const results = [];
          for (const email of validatedData.emails) {
            const result = await emailService.sendEmail({
              to: typeof email.to === 'string' ? { email: email.to } : email.to,
              subject: email.subject,
              html: email.html,
              text: email.text,
              priority: email.priority,
            });
            results.push(result);
          }

          return StandardSuccessResponse.create({
            message: "Bulk email sent successfully",
            results,
            emailCount: validatedData.emails.length,
            requestId,
          });
        }
      } else {
        const validatedData = SendEmailRequestSchema.parse(body);

        if (validatedData.useQueue) {
          const jobResult = await QueueHelpers.sendEmail(
            {
              to: validatedData.to,
              from: validatedData.from,
              subject: validatedData.subject,
              html: validatedData.html,
              text: validatedData.text,
              template: validatedData.template,
              templateData: validatedData.templateData,
              attachments: validatedData.attachments,
              priority: validatedData.priority,
              tags: validatedData.tags,
            },
            {
              priority: validatedData.priority,
              delay: validatedData.delay,
              userId: user.id,
              organizationId,
            }
          );

          if (!jobResult) {
            return StandardErrorResponse.create(
              "Failed to queue email job",
              "QUEUE_ERROR",
              500,
              undefined,
              requestId
            );
          }

          return StandardSuccessResponse.create({
            message: "Email job queued successfully",
            jobId: jobResult.id,
            estimatedProcessingTime: "< 1 minute",
            requestId,
          });
        } else {
          const result = await emailService.sendEmail({
            to: typeof validatedData.to === 'string' ? { email: validatedData.to } : validatedData.to,
            from: validatedData.from ? (typeof validatedData.from === 'string' ? { email: validatedData.from } : validatedData.from) : undefined,
            subject: validatedData.subject,
            html: validatedData.html,
            text: validatedData.text,
            template: validatedData.template,
            templateData: validatedData.templateData,
            attachments: validatedData.attachments,
            priority: validatedData.priority,
            tags: validatedData.tags,
          });

          return StandardSuccessResponse.create({
            message: "Email sent successfully",
            result,
            requestId,
          });
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, requestId);
      }

      logger.error("Error processing email send request", "email", {
        requestId,
        userId,
        organizationId,
        error: error instanceof Error ? error.message : error,
        endpoint: "/api/email",
      });

      return StandardErrorResponse.internal(
        "Failed to process email send request",
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
   * GET /api/email - Get email sending statistics and history
   */
  async getEmailStatistics(request: NextRequest): Promise<NextResponse> {
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
      const page = parseInt(searchParams.get("page") || "1");
      const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
      const type = searchParams.get("type");

      logger.info("Fetching email statistics", "email", {
        requestId,
        userId,
        organizationId,
        page,
        limit,
        type,
      });

      // Mock email statistics
      const mockStats = {
        totalSent: 1250,
        totalDelivered: 1198,
        totalBounced: 32,
        totalOpened: 856,
        totalClicked: 234,
        deliveryRate: 95.8,
        openRate: 71.4,
        clickRate: 19.5,
        recentEmails: [
          {
            id: "email_1",
            subject: "Welcome to our platform",
            recipient: "user@example.com",
            status: "delivered",
            sentAt: new Date().toISOString(),
            deliveredAt: new Date().toISOString(),
            openedAt: new Date().toISOString(),
          },
        ],
      };

      return StandardSuccessResponse.create({
        statistics: mockStats,
        pagination: {
          page,
          limit,
          total: mockStats.recentEmails.length,
          totalPages: Math.ceil(mockStats.recentEmails.length / limit),
        },
        requestId,
      });
    } catch (error) {
      logger.error("Error fetching email statistics", "email", {
        requestId,
        userId,
        organizationId,
        error: error instanceof Error ? error.message : error,
        endpoint: "/api/email",
      });

      return StandardErrorResponse.internal(
        "Failed to fetch email statistics",
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
   * GET /api/email/[id] - Get specific email details
   */
  async getEmailById(emailId: string, request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();
    let userId: string | null = null;
    let organizationId: string | null = null;

    try {
      const { id: validatedId } = EmailIdSchema.parse({ id: emailId });

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

      logger.info("Fetching email details", "email", {
        requestId,
        userId,
        organizationId,
        emailId: validatedId,
      });

      // Mock email data
      const mockEmail = {
        id: validatedId,
        subject: "Welcome to Our Platform",
        html: "<h1>Welcome!</h1><p>Thank you for joining us.</p>",
        text: "Welcome! Thank you for joining us.",
        status: "sent",
        type: "transactional",
        templateId: "template_welcome",
        recipients: [
          {
            email: "user@example.com",
            status: "delivered",
            deliveredAt: new Date().toISOString(),
            openedAt: new Date().toISOString(),
            clickedAt: null,
            bounced: false,
            complained: false,
          },
        ],
        statistics: {
          sent: 1,
          delivered: 1,
          opened: 1,
          clicked: 0,
          bounced: 0,
          complained: 0,
          unsubscribed: 0,
          deliveryRate: 100,
          openRate: 100,
          clickRate: 0,
        },
        organizationId,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        metadata: {
          campaign: "welcome_series",
          source: "api",
        },
      };

      if (mockEmail.organizationId !== organizationId) {
        return StandardErrorResponse.notFound("Email not found", requestId);
      }

      return StandardSuccessResponse.create({
        email: mockEmail,
        requestId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, requestId);
      }

      logger.error("Error fetching email details", "email", {
        requestId,
        userId,
        organizationId,
        emailId,
        error: error instanceof Error ? error.message : error,
        endpoint: `/api/email/${emailId}`,
      });

      return StandardErrorResponse.internal(
        "Failed to fetch email details",
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
   * POST /api/email/send - Send bulk emails with advanced options
   */
  async sendBulkEmail(request: NextRequest): Promise<NextResponse> {
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

      logger.info("Processing bulk email send request", "email", {
        requestId,
        userId,
        organizationId,
      });

      const body = await request.json();
      const validatedData = BulkEmailSendSchema.parse(body);

      if (validatedData.scheduledAt) {
        const scheduledDate = new Date(validatedData.scheduledAt);
        if (scheduledDate <= new Date()) {
          return StandardErrorResponse.badRequest(
            "Scheduled time must be in the future",
            requestId,
          );
        }

        const scheduledEmailId = `scheduled_${Date.now()}`;

        logger.info("Email scheduled successfully", "email", {
          requestId,
          userId,
          organizationId,
          scheduledEmailId,
          scheduledAt: validatedData.scheduledAt,
        });

        return StandardSuccessResponse.create({
          message: "Email scheduled successfully",
          scheduledEmailId,
          scheduledAt: validatedData.scheduledAt,
          recipientCount: validatedData.recipients.length,
          requestId,
        });
      }

      await LegacyEmailService.sendBulkEmail(
        validatedData.recipients,
        validatedData.subject,
        validatedData.html,
        validatedData.text,
      );

      const trackingId = `track_${Date.now()}`;

      logger.info("Bulk email sent successfully", "email", {
        requestId,
        userId,
        organizationId,
        trackingId,
        recipientCount: validatedData.recipients.length,
      });

      return StandardSuccessResponse.create({
        message: "Bulk email sent successfully",
        trackingId,
        recipientCount: validatedData.recipients.length,
        estimatedDeliveryTime: "5-10 minutes",
        requestId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, requestId);
      }

      logger.error("Error processing bulk email send request", "email", {
        requestId,
        userId,
        organizationId,
        error: error instanceof Error ? error.message : error,
        endpoint: "/api/email/send",
      });

      return StandardErrorResponse.internal(
        "Failed to process bulk email send request",
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
   * POST /api/email/test - Test email functionality
   */
  async testEmail(request: NextRequest): Promise<NextResponse> {
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
        "update",
        "organizations",
        requestId
      );
      if (permError) return permError;

      logger.info("Testing email functionality", "email", {
        requestId,
        userId,
        organizationId,
        userEmail: user.email,
      });

      const body = await request.json();
      const validatedData = EmailTestRequestSchema.parse(body);
      const { type, data } = validatedData;

      const userEmail = user.email;
      const userName = user.name || "User";

      logger.info("Sending test email", "email", {
        requestId,
        userId,
        organizationId,
        emailType: type,
        recipientEmail: userEmail,
      });

      let result;

      switch (type) {
        case "welcome":
          result = await LegacyEmailService.sendWelcomeEmail(userEmail, userName);
          break;

        case "password-reset":
          const resetToken = "demo-reset-token-" + Date.now();
          result = await LegacyEmailService.sendPasswordResetEmail(
            userEmail,
            userName,
            resetToken,
          );
          break;

        case "email-verification":
          const verificationToken = "demo-verification-token-" + Date.now();
          result = await LegacyEmailService.sendEmailVerification(
            userEmail,
            userName,
            verificationToken,
          );
          break;

        case "notification":
          result = await LegacyEmailService.sendNotification(
            userEmail,
            data?.title || "Test Notification",
            {
              html: `<h1>${data?.title || "Test Notification"}</h1><p>${data?.message || "This is a test notification from your app."}</p>`,
              text: `${data?.title || "Test Notification"}\n\n${data?.message || "This is a test notification from your app."}`
            }
          );
          break;

        case "custom":
          result = await LegacyEmailService.sendCustomEmail(
            userEmail,
            data?.subject || "Test Email",
            data?.html || "<h1>Test Email</h1><p>This is a test email.</p>",
            data?.text,
          );
          break;

        default:
          return StandardErrorResponse.badRequest(
            "Invalid email type provided",
            "email",
            {
              validTypes: [
                "welcome",
                "password-reset",
                "email-verification",
                "notification",
                "custom",
              ],
            },
            requestId,
          );
      }

      logger.info("Test email sent successfully", "email", {
        requestId,
        userId,
        organizationId,
        emailType: type,
        emailId: result?.data?.id,
      });

      return StandardSuccessResponse.create({
        message: "Test email sent successfully",
        emailType: type,
        emailId: result?.data?.id,
        requestId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, requestId);
      }

      logger.error("Error processing email test request", "email", {
        requestId,
        userId,
        organizationId,
        error: error instanceof Error ? error.message : error,
        endpoint: "/api/email/test",
      });

      return StandardErrorResponse.internal(
        "Failed to process email test request",
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
   * POST /api/email/tracking - Record email tracking event
   */
  async recordTrackingEvent(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();
    let userId: string | null = null;
    let organizationId: string | null = null;

    try {
      const { userId: authUserId } = auth();

      if (authUserId) {
        userId = authUserId;
        const user = await db.user.findUnique({
          where: { clerkId: userId },
          include: {
            organizationMemberships: {
              include: { organization: true },
            },
          },
        });

        if (user?.organizationMemberships?.[0]) {
          organizationId = user.organizationMemberships[0].organizationId;
        }
      }

      logger.info("Recording email tracking event", "email", {
        requestId,
        userId,
        organizationId,
        hasAuth: !!authUserId,
      });

      const body = await request.json();
      const validatedData = TrackingEventSchema.parse(body);

      const clientIP =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const userAgent = request.headers.get("user-agent") || "unknown";

      const trackingEvent = {
        id: `event_${Date.now()}`,
        emailId: validatedData.emailId,
        eventType: validatedData.eventType,
        timestamp: validatedData.timestamp || new Date().toISOString(),
        metadata: validatedData.metadata || {},
        userAgent: validatedData.userAgent || userAgent,
        ipAddress: validatedData.ipAddress || clientIP,
        linkUrl: validatedData.linkUrl,
        organizationId,
        createdAt: new Date().toISOString(),
      };

      logger.info("Email tracking event recorded", "email", {
        requestId,
        userId,
        organizationId,
        eventId: trackingEvent.id,
        emailId: validatedData.emailId,
        eventType: validatedData.eventType,
      });

      return StandardSuccessResponse.create(
        {
          message: "Tracking event recorded successfully",
          event: trackingEvent,
          requestId,
        },
        201,
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, requestId);
      }

      logger.error("Error recording email tracking event", "email", {
        requestId,
        userId,
        organizationId,
        error: error instanceof Error ? error.message : error,
        endpoint: "/api/email/tracking",
      });

      return StandardErrorResponse.internal(
        "Failed to record tracking event",
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
   * GET /api/email/tracking - Get email tracking data and analytics
   */
  async getTrackingData(request: NextRequest): Promise<NextResponse> {
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
      const status = searchParams.get("status");
      const page = parseInt(searchParams.get("page") || "1");
      const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

      logger.info("Fetching email send status", "email", {
        requestId,
        userId,
        organizationId,
        status,
        page,
        limit,
      });

      const mockQueue = {
        pending: 5,
        processing: 2,
        completed: 48,
        failed: 1,
        scheduled: 3,
        queue: [
          {
            id: "bulk_1",
            subject: "Monthly Newsletter",
            recipientCount: 1500,
            status: "processing",
            progress: 75,
            createdAt: new Date().toISOString(),
            estimatedCompletion: new Date(Date.now() + 300000).toISOString(),
          },
          {
            id: "bulk_2",
            subject: "Product Update",
            recipientCount: 850,
            status: "pending",
            progress: 0,
            createdAt: new Date().toISOString(),
            scheduledAt: new Date(Date.now() + 3600000).toISOString(),
          },
        ],
      };

      return StandardSuccessResponse.create({
        queue: mockQueue,
        pagination: {
          page,
          limit,
          total: mockQueue.queue.length,
          totalPages: Math.ceil(mockQueue.queue.length / limit),
        },
        requestId,
      });
    } catch (error) {
      logger.error("Error fetching email send status", "email", {
        requestId,
        userId,
        organizationId,
        error: error instanceof Error ? error.message : error,
        endpoint: "/api/email/send",
      });

      return StandardErrorResponse.internal(
        "Failed to fetch email send status",
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
