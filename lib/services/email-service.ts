import { logger } from "@/lib/logger";

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface PaymentFailedEmailData {
  customerName: string;
  customerEmail: string;
  subscriptionId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  failureReason?: string;
}

export interface InvitationEmailData {
  inviteeEmail: string;
  inviteeName?: string;
  inviterName: string;
  organizationName: string;
  inviteToken: string;
  role: string;
  expiresAt: Date;
}

export class EmailService {
  /**
   * Send payment failed notification email
   */
  static async sendPaymentFailedEmail(
    data: PaymentFailedEmailData,
  ): Promise<void> {
    try {
      const template = this.generatePaymentFailedTemplate(data);

      // TODO: Integrate with actual email provider (SendGrid, Resend, etc.)
      // For now, we'll log the email content
      logger.info("Payment failed email would be sent", "email", {
        to: data.customerEmail,
        subject: template.subject,
        subscriptionId: data.subscriptionId,
        amount: data.amount,
        currency: data.currency,
      });

      // Simulate email sending
      console.log(`📧 Payment Failed Email:
To: ${data.customerEmail}
Subject: ${template.subject}
Content: ${template.text}`);
    } catch (error) {
      logger.error("Failed to send payment failed email", "email", error);
      throw error;
    }
  }

  /**
   * Send organization invitation email
   */
  static async sendInvitationEmail(data: InvitationEmailData): Promise<void> {
    try {
      const template = this.generateInvitationTemplate(data);

      // TODO: Integrate with actual email provider (SendGrid, Resend, etc.)
      // For now, we'll log the email content
      logger.info("Invitation email would be sent", "email", {
        to: data.inviteeEmail,
        subject: template.subject,
        organizationName: data.organizationName,
        role: data.role,
        inviterName: data.inviterName,
      });

      // Simulate email sending
      console.log(`📧 Invitation Email:
To: ${data.inviteeEmail}
Subject: ${template.subject}
Content: ${template.text}`);
    } catch (error) {
      logger.error("Failed to send invitation email", "email", error);
      throw error;
    }
  }

  /**
   * Generate payment failed email template
   */
  private static generatePaymentFailedTemplate(
    data: PaymentFailedEmailData,
  ): EmailTemplate {
    const subject = `Payment Failed - Action Required for Your Subscription`;

    const text = `Hi ${data.customerName},

We were unable to process your payment for subscription ${data.subscriptionId}.

Details:
- Amount: ${data.amount / 100} ${data.currency.toUpperCase()}
- Invoice: ${data.invoiceId}
${data.failureReason ? `- Reason: ${data.failureReason}` : ""}

Please update your payment method to continue using our service.

Best regards,
The Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Payment Failed - Action Required</h2>
        
        <p>Hi ${data.customerName},</p>
        
        <p>We were unable to process your payment for your subscription.</p>
        
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Payment Details</h3>
          <ul style="margin: 0;">
            <li><strong>Amount:</strong> ${data.amount / 100} ${data.currency.toUpperCase()}</li>
            <li><strong>Subscription:</strong> ${data.subscriptionId}</li>
            <li><strong>Invoice:</strong> ${data.invoiceId}</li>
            ${data.failureReason ? `<li><strong>Reason:</strong> ${data.failureReason}</li>` : ""}
          </ul>
        </div>
        
        <p>Please update your payment method to continue using our service.</p>
        
        <div style="margin: 30px 0;">
          <a href="#" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Update Payment Method
          </a>
        </div>
        
        <p>Best regards,<br>The Team</p>
      </div>
    `;

    return { subject, html, text };
  }

  /**
   * Generate invitation email template
   */
  private static generateInvitationTemplate(
    data: InvitationEmailData,
  ): EmailTemplate {
    const subject = `You're invited to join ${data.organizationName}`;

    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invites/${data.inviteToken}`;
    const expiresAtFormatted = data.expiresAt.toLocaleDateString();

    const text = `Hi${data.inviteeName ? ` ${data.inviteeName}` : ""},

${data.inviterName} has invited you to join ${data.organizationName} as a ${data.role}.

To accept this invitation, click the link below:
${acceptUrl}

This invitation expires on ${expiresAtFormatted}.

Best regards,
The Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">You're Invited!</h2>
        
        <p>Hi${data.inviteeName ? ` ${data.inviteeName}` : ""},</p>
        
        <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> as a <strong>${data.role}</strong>.</p>
        
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <h3 style="color: #1d4ed8; margin-top: 0;">Join ${data.organizationName}</h3>
          <p style="margin: 15px 0;">Click the button below to accept your invitation:</p>
          
          <a href="${acceptUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Accept Invitation
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Note:</strong> This invitation expires on ${expiresAtFormatted}.
        </p>
        
        <p>Best regards,<br>The Team</p>
      </div>
    `;

    return { subject, html, text };
  }
}
