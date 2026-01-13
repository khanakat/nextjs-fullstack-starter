import { Resend } from "resend";
import nodemailer from "nodemailer";
// import { SendGrid } from "@sendgrid/mail"; // Commented out - incorrect import
// import { Mailgun } from "mailgun.js";
// import formData from "form-data"; // Commented out - not used
import { queueService } from "@/lib/services/queue";
import { logger } from "@/lib/logger";

// ============================================================================
// EMAIL PROVIDER TYPES
// ============================================================================

export type EmailProvider = "resend" | "sendgrid" | "mailgun" | "smtp";

// ============================================================================
// EMAIL PROVIDER INITIALIZATION
// ============================================================================

// Initialize Resend
let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

// Initialize SendGrid
// let sendgrid: typeof SendGrid | null = null;
// if (process.env.SENDGRID_API_KEY) {
//   sendgrid = SendGrid;
//   sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
// }

// Initialize Mailgun
let mailgun: any = null;
// if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
//   const mg = new Mailgun(formData);
//   mailgun = mg.client({
//     username: "api",
//     key: process.env.MAILGUN_API_KEY,
//     url: process.env.MAILGUN_BASE_URL || "https://api.mailgun.net",
//   });
// }

// ============================================================================
// EMAIL CONFIGURATION
// ============================================================================

export const emailConfig = {
  // Provider selection (fallback order)
  provider: (process.env.EMAIL_PROVIDER as EmailProvider) || "resend",
  fallbackProviders: ["resend", "sendgrid", "mailgun"] as EmailProvider[],

  // Default settings
  from: process.env.EMAIL_FROM || "onboarding@yourdomain.com",
  replyTo: process.env.EMAIL_REPLY_TO || "support@yourdomain.com",

  // Queue configuration
  useQueue: process.env.EMAIL_USE_QUEUE === "true",
  retryAttempts: parseInt(process.env.EMAIL_RETRY_ATTEMPTS || "3"),
  retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY || "5000"), // 5 seconds

  // Provider-specific settings
  resend: {
    apiKey: process.env.RESEND_API_KEY,
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
  },
  mailgun: {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    baseUrl: process.env.MAILGUN_BASE_URL || "https://api.mailgun.net",
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  },
} as const;

// ============================================================================
// TYPES
// ============================================================================

export type EmailType =
  | "welcome"
  | "password-reset"
  | "email-verification"
  | "notification"
  | "newsletter"
  | "report"
  | "system-alert"
  | "usage-alert"
  | "scheduled-report";

export type EmailPriority = "low" | "normal" | "high" | "critical";

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailJobData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
  from?: string;
  replyTo?: string;
  type: EmailType;
  priority: EmailPriority;
  metadata?: Record<string, any>;
  provider?: EmailProvider;
}

// ============================================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================================

async function sendWithResend(emailData: EmailJobData): Promise<any> {
  if (!resend) {
    throw new Error("Resend is not configured");
  }

  const { to, subject, html, text, from, replyTo, attachments } = emailData;

  const result = await resend.emails.send({
    from: from!,
    to,
    subject,
    html,
    text,
    replyTo,
    attachments:
      attachments?.map((file) => ({
        filename: file.filename,
        content: file.content,
        contentType: file.contentType,
      })) || undefined,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result;
}

async function sendWithSendGrid(_emailData: EmailJobData): Promise<any> {
  // SendGrid functionality disabled
  throw new Error("SendGrid is not configured");
}

async function sendWithMailgun(emailData: EmailJobData): Promise<any> {
  if (!mailgun) {
    throw new Error("Mailgun is not configured");
  }

  const { to, subject, html, text, from, replyTo, attachments } = emailData;

  const messageData = {
    from: from!,
    to: Array.isArray(to) ? to.join(",") : to,
    subject,
    html,
    text,
    "h:Reply-To": replyTo,
    attachment:
      attachments?.map((file) => ({
        filename: file.filename,
        data: file.content,
        contentType: file.contentType,
      })) || undefined,
  };

  const result = await mailgun.messages.create(
    emailConfig.mailgun.domain!,
    messageData,
  );
  return result;
}

async function sendWithSMTP(emailData: EmailJobData): Promise<any> {
  const { host, port, secure, user, password } = emailConfig.smtp;

  if (!host || !user || !password) {
    throw new Error("SMTP is not configured");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass: password,
    },
  });

  const { to, subject, html, text, from, replyTo, attachments } = emailData;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
    replyTo,
    attachments:
      attachments?.map((file) => ({
        filename: file.filename,
        content: file.content,
        contentType: file.contentType,
      })) || undefined,
  });

  return { id: info.messageId };
}

// ============================================================================
// PROVIDER SELECTION AND FALLBACK
// ============================================================================

function getAvailableProviders(): EmailProvider[] {
  const available: EmailProvider[] = [];

  if (resend) available.push("resend");
  // if (sendgrid) available.push("sendgrid"); // SendGrid disabled
  if (mailgun) available.push("mailgun");
  if (emailConfig.smtp.host) available.push("smtp");

  return available;
}

async function sendWithProvider(
  provider: EmailProvider,
  emailData: EmailJobData,
): Promise<any> {
  switch (provider) {
    case "resend":
      return await sendWithResend(emailData);
    case "sendgrid":
      return await sendWithSendGrid(emailData);
    case "mailgun":
      return await sendWithMailgun(emailData);
    case "smtp":
      return await sendWithSMTP(emailData);
    default:
      throw new Error(`Unknown email provider: ${provider}`);
  }
}

// ============================================================================
// MAIN EMAIL SENDING FUNCTION
// ============================================================================

export async function sendEmail({
  to,
  subject,
  html,
  text,
  attachments,
  from = emailConfig.from,
  replyTo = emailConfig.replyTo,
  type = "notification",
  priority = "normal",
  useQueue = emailConfig.useQueue,
  retries = emailConfig.retryAttempts,
  metadata = {},
  provider,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  type?: EmailType;
  priority?: EmailPriority;
  useQueue?: boolean;
  retries?: number;
  metadata?: Record<string, any>;
  provider?: EmailProvider;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}): Promise<any> {
  const emailData: EmailJobData = {
    to,
    subject,
    html,
    text,
    attachments,
    from,
    replyTo,
    type,
    priority,
    metadata,
    provider,
  };

  // Log email attempt
  logger.info("Email send requested", "email", {
    to: Array.isArray(to) ? to.length + " recipients" : to,
    subject,
    type,
    priority,
    provider: provider || emailConfig.provider,
    useQueue,
  });

  if (useQueue) {
    // Add to queue for background processing
    const jobId = await queueService.addJob("email", emailData, {
      priority: getPriorityValue(priority),
      attempts: retries,
      backoff: {
        type: "exponential",
        delay: emailConfig.retryDelay,
      },
    });

    logger.info("Email queued for processing", "email", {
      jobId,
      to: Array.isArray(to) ? to.length + " recipients" : to,
      subject,
      type,
      priority,
    });

    return { jobId, queued: true };
  } else {
    // Send immediately
    return await sendEmailDirect(emailData, retries);
  }
}

// ============================================================================
// DIRECT EMAIL SENDING WITH FALLBACK
// ============================================================================

async function sendEmailDirect(
  emailData: EmailJobData,
  retries: number,
): Promise<any> {
  const availableProviders = getAvailableProviders();

  if (availableProviders.length === 0) {
    const error = new Error(
      "No email providers are configured. Please add API keys to your environment variables.",
    );
    logger.error("No email providers available", { error: error.message });
    throw error;
  }

  // Determine provider order (preferred provider first, then fallbacks)
  const preferredProvider = emailData.provider || emailConfig.provider;
  const providerOrder = [
    preferredProvider,
    ...emailConfig.fallbackProviders.filter(
      (p) => p !== preferredProvider && availableProviders.includes(p),
    ),
  ].filter((p) => availableProviders.includes(p));

  const { to, subject, type, metadata } = emailData;
  let lastError: Error | null = null;

  // Try each provider in order
  for (const provider of providerOrder) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.info("Attempting to send email", "email", {
          provider,
          attempt,
          to: Array.isArray(to) ? to.length + " recipients" : to,
          subject,
          type,
        });

        const result = await sendWithProvider(provider, emailData);

        logger.info("Email sent successfully", "email", {
          provider,
          emailId: result.data?.id || result.id,
          to: Array.isArray(to) ? to.length + " recipients" : to,
          subject,
          type,
          attempt,
          metadata,
        });

        return { ...result, provider, attempt };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        logger.error("Email send attempt failed", "email", {
          provider,
          attempt,
          maxAttempts: retries,
          to: Array.isArray(to) ? to.length + " recipients" : to,
          subject,
          type,
          error: lastError.message,
        });

        if (attempt === retries) {
          // Max attempts reached for this provider, try next provider
          break;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All providers failed
  logger.error("All email providers failed", "email", {
    providersAttempted: providerOrder,
    lastError: lastError?.message,
    to: Array.isArray(to) ? to.length + " recipients" : to,
    subject,
    type,
  });

  throw lastError || new Error("All email providers failed");
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getPriorityValue(priority: EmailPriority): number {
  switch (priority) {
    case "critical":
      return 1;
    case "high":
      return 2;
    case "normal":
      return 5;
    case "low":
      return 10;
    default:
      return 5;
  }
}

// ============================================================================
// BULK EMAIL SENDING
// ============================================================================

export async function sendBulkEmail({
  recipients,
  subject,
  html,
  text,
  from = emailConfig.from,
  replyTo = emailConfig.replyTo,
  type = "newsletter",
  priority = "low",
  batchSize = 50,
  metadata = {},
  provider,
}: {
  recipients: string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  type?: EmailType;
  priority?: EmailPriority;
  batchSize?: number;
  metadata?: Record<string, any>;
  provider?: EmailProvider;
}): Promise<{ success: number; failed: number; jobIds: string[] }> {
  logger.info("Bulk email send requested", "email", {
    recipientCount: recipients.length,
    subject,
    type,
    priority,
    batchSize,
    provider: provider || emailConfig.provider,
  });

  const jobIds: string[] = [];
  let success = 0;
  let failed = 0;

  // Split recipients into batches
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    try {
      const result = await sendEmail({
        to: batch,
        subject,
        html,
        text,
        from,
        replyTo,
        type,
        priority,
        useQueue: true, // Always use queue for bulk emails
        metadata: {
          ...metadata,
          batchIndex: Math.floor(i / batchSize),
          batchSize: batch.length,
        },
        provider,
      });

      if (result.jobId) {
        jobIds.push(result.jobId);
      }
      success += batch.length;
    } catch (error) {
      logger.error("Bulk email batch failed", "email", {
        batchIndex: Math.floor(i / batchSize),
        batchSize: batch.length,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      failed += batch.length;
    }
  }

  logger.info("Bulk email send completed", "email", {
    totalRecipients: recipients.length,
    success,
    failed,
    jobCount: jobIds.length,
  });

  return { success, failed, jobIds };
}

// ============================================================================
// PROVIDER STATUS AND HEALTH CHECK
// ============================================================================

export async function getEmailProviderStatus(): Promise<{
  configured: EmailProvider[];
  available: EmailProvider[];
  preferred: EmailProvider;
  health: Record<EmailProvider, boolean>;
}> {
  const configured = getAvailableProviders();
  const health: Record<EmailProvider, boolean> = {} as any;

  // Test each configured provider
  for (const provider of configured) {
    try {
      // Simple health check - this would need to be implemented per provider
      health[provider] = true; // Placeholder
    } catch (error) {
      health[provider] = false;
    }
  }

  return {
    configured,
    available: configured.filter((p) => health[p]),
    preferred: emailConfig.provider,
    health,
  };
}

// Export configured providers for external use
export { resend, mailgun };
// export { resend, sendgrid, mailgun }; // sendgrid commented out
