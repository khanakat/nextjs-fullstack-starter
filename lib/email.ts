import { Resend } from 'resend';

// Initialize Resend only if API key is available
let resend: Resend | null = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

export { resend };

// Email configuration
export const emailConfig = {
  from: process.env.EMAIL_FROM || 'onboarding@yourdomain.com',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@yourdomain.com',
} as const;

// Email types
export type EmailType = 
  | 'welcome'
  | 'password-reset' 
  | 'email-verification'
  | 'notification'
  | 'newsletter';

// Email template interface
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

// Email sending function with retry logic
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = emailConfig.from,
  replyTo = emailConfig.replyTo,
  retries = 3
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  retries?: number;
}): Promise<any> {
  if (!resend) {
    throw new Error('RESEND_API_KEY is not configured. Please add it to your environment variables.');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await resend.emails.send({
        from,
        to,
        subject,
        html,
        text,
        replyTo,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      console.log(`Email sent successfully to ${to}:`, result.data?.id);
      return result;
    } catch (error) {
      console.error(`Email attempt ${attempt} failed:`, error);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}