import { EmailTemplate } from "@/lib/email";

// Welcome email template
export const welcomeEmailTemplate = (data: {
  name: string;
  appName: string;
}): EmailTemplate => ({
  subject: `Welcome to ${data.appName}! 🎉`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">${data.appName}</h1>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1e293b; margin-top: 0;">Welcome, ${data.name}! 👋</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
          Thank you for joining ${data.appName}! We're excited to have you as part of our community.
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
          You can now access all the features of your account and start exploring what we have to offer.
        </p>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #1e293b; margin-top: 0;">What's Next?</h3>
        <ul style="color: #475569; padding-left: 20px;">
          <li>Complete your profile setup</li>
          <li>Explore our dashboard features</li>
          <li>Upload your first file or create content</li>
          <li>Join our community discussions</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Get Started
        </a>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; font-size: 14px;">
        <p>Need help? Contact us at <a href="mailto:support@yourapp.com" style="color: #2563eb;">support@yourapp.com</a></p>
        <p>&copy; 2024 ${data.appName}. All rights reserved.</p>
      </div>
    </div>
  `,
  text: `
    Welcome to ${data.appName}, ${data.name}!
    
    Thank you for joining us! We're excited to have you as part of our community.
    
    What's Next?
    - Complete your profile setup
    - Explore our dashboard features  
    - Upload your first file or create content
    - Join our community discussions
    
    Get started: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
    
    Need help? Contact us at support@yourapp.com
  `,
});

// Password reset email template
export const passwordResetEmailTemplate = (data: {
  name: string;
  resetUrl: string;
  appName: string;
}): EmailTemplate => ({
  subject: `Reset Your ${data.appName} Password 🔐`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">${data.appName}</h1>
      </div>
      
      <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #dc2626; margin-top: 0;">Password Reset Request 🔐</h2>
        <p style="color: #7f1d1d; margin-bottom: 0;">
          Someone requested a password reset for your account. If this wasn't you, please ignore this email.
        </p>
      </div>

      <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
        <p style="color: #475569; font-size: 16px; line-height: 1.5; margin-top: 0;">
          Hi ${data.name},
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
          Click the button below to reset your password. This link will expire in 1 hour for security reasons.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetUrl}" 
           style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Reset Password
        </a>
      </div>

      <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="color: #92400e; margin: 0; font-size: 14px;">
          <strong>Security Tip:</strong> If you didn't request this reset, please check your account security and consider changing your password.
        </p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; font-size: 14px;">
        <p>This link expires in 1 hour. Need help? Contact <a href="mailto:support@yourapp.com" style="color: #2563eb;">support@yourapp.com</a></p>
        <p>&copy; 2024 ${data.appName}. All rights reserved.</p>
      </div>
    </div>
  `,
  text: `
    Password Reset Request - ${data.appName}
    
    Hi ${data.name},
    
    Someone requested a password reset for your account. If this wasn't you, please ignore this email.
    
    Click the link below to reset your password (expires in 1 hour):
    ${data.resetUrl}
    
    Security Tip: If you didn't request this reset, please check your account security.
    
    Need help? Contact us at support@yourapp.com
  `,
});

// Email verification template
export const emailVerificationTemplate = (data: {
  name: string;
  verificationUrl: string;
  appName: string;
}): EmailTemplate => ({
  subject: `Verify Your ${data.appName} Email Address ✅`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">${data.appName}</h1>
      </div>
      
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #0369a1; margin-top: 0;">Please Verify Your Email ✅</h2>
        <p style="color: #0c4a6e; margin-bottom: 0;">
          We need to verify your email address to complete your account setup.
        </p>
      </div>

      <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
        <p style="color: #475569; font-size: 16px; line-height: 1.5; margin-top: 0;">
          Hi ${data.name},
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
          Thank you for signing up! Please click the button below to verify your email address and activate your account.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.verificationUrl}" 
           style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Verify Email Address
        </a>
      </div>

      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="color: #374151; margin: 0; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${data.verificationUrl}" style="color: #2563eb; word-break: break-all;">${data.verificationUrl}</a>
        </p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; font-size: 14px;">
        <p>This link expires in 24 hours. Need help? Contact <a href="mailto:support@yourapp.com" style="color: #2563eb;">support@yourapp.com</a></p>
        <p>&copy; 2024 ${data.appName}. All rights reserved.</p>
      </div>
    </div>
  `,
  text: `
    Email Verification - ${data.appName}
    
    Hi ${data.name},
    
    Thank you for signing up! Please verify your email address to activate your account.
    
    Click this link to verify (expires in 24 hours):
    ${data.verificationUrl}
    
    Need help? Contact us at support@yourapp.com
  `,
});

// Notification email template
export const notificationEmailTemplate = (data: {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  appName: string;
}): EmailTemplate => ({
  subject: `${data.title} - ${data.appName}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">${data.appName}</h1>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1e293b; margin-top: 0;">${data.title}</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
          ${data.message}
        </p>
      </div>

      ${
        data.actionUrl && data.actionText
          ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.actionUrl}" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            ${data.actionText}
          </a>
        </div>
      `
          : ""
      }

      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; font-size: 14px;">
        <p>Need help? Contact us at <a href="mailto:support@yourapp.com" style="color: #2563eb;">support@yourapp.com</a></p>
        <p>&copy; 2024 ${data.appName}. All rights reserved.</p>
      </div>
    </div>
  `,
  text: `
    ${data.title} - ${data.appName}
    
    ${data.message}
    
    ${data.actionUrl && data.actionText ? `${data.actionText}: ${data.actionUrl}\n\n` : ""}
    Need help? Contact us at support@yourapp.com
  `,
});

// Report email template
export const reportEmailTemplate = (data: {
  reportName: string;
  reportType: string;
  generatedAt: string;
  summary: string;
  downloadUrl?: string;
  appName: string;
}): EmailTemplate => ({
  subject: `${data.reportName} Report Ready - ${data.appName}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">${data.appName}</h1>
      </div>
      
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #0369a1; margin-top: 0;">📊 Report Generated</h2>
        <p style="color: #0c4a6e; margin-bottom: 0;">
          Your ${data.reportType} report "${data.reportName}" has been generated successfully.
        </p>
      </div>

      <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #1e293b; margin-top: 0;">Report Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Report Name:</td>
            <td style="padding: 8px 0; color: #1e293b;">${data.reportName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Type:</td>
            <td style="padding: 8px 0; color: #1e293b;">${data.reportType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Generated:</td>
            <td style="padding: 8px 0; color: #1e293b;">${data.generatedAt}</td>
          </tr>
        </table>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #1e293b; margin-top: 0;">Summary</h3>
        <p style="color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 0;">
          ${data.summary}
        </p>
      </div>

      ${
        data.downloadUrl
          ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.downloadUrl}" 
             style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            📥 Download Report
          </a>
        </div>
      `
          : ""
      }

      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; font-size: 14px;">
        <p>Need help? Contact us at <a href="mailto:support@yourapp.com" style="color: #2563eb;">support@yourapp.com</a></p>
        <p>&copy; 2024 ${data.appName}. All rights reserved.</p>
      </div>
    </div>
  `,
  text: `
    Report Generated - ${data.appName}
    
    Your ${data.reportType} report "${data.reportName}" has been generated successfully.
    
    Report Details:
    - Name: ${data.reportName}
    - Type: ${data.reportType}
    - Generated: ${data.generatedAt}
    
    Summary: ${data.summary}
    
    ${data.downloadUrl ? `Download: ${data.downloadUrl}\n\n` : ""}
    Need help? Contact us at support@yourapp.com
  `,
});

// System alert email template
export const systemAlertEmailTemplate = (data: {
  alertType: "warning" | "error" | "info";
  title: string;
  message: string;
  details?: string;
  actionRequired?: boolean;
  actionUrl?: string;
  appName: string;
}): EmailTemplate => {
  const alertColors = {
    warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", icon: "⚠️" },
    error: { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", icon: "🚨" },
    info: { bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1", icon: "ℹ️" },
  };

  const colors = alertColors[data.alertType];

  return {
    subject: `${colors.icon} System Alert: ${data.title} - ${data.appName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">${data.appName}</h1>
        </div>
        
        <div style="background: ${colors.bg}; border: 1px solid ${colors.border}; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: ${colors.text}; margin-top: 0;">${colors.icon} ${data.title}</h2>
          <p style="color: ${colors.text}; margin-bottom: 0;">
            ${data.message}
          </p>
        </div>

        ${
          data.details
            ? `
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-top: 0;">Details</h3>
            <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 0; font-family: monospace;">
              ${data.details}
            </p>
          </div>
        `
            : ""
        }

        ${
          data.actionRequired && data.actionUrl
            ? `
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #dc2626; margin: 0; font-weight: 600;">
              Action Required: Please review and take necessary action.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.actionUrl}" 
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Take Action
            </a>
          </div>
        `
            : ""
        }

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; font-size: 14px;">
          <p>This is an automated system alert. Need help? Contact <a href="mailto:support@yourapp.com" style="color: #2563eb;">support@yourapp.com</a></p>
          <p>&copy; 2024 ${data.appName}. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `
      System Alert: ${data.title} - ${data.appName}
      
      ${data.message}
      
      ${data.details ? `Details: ${data.details}\n\n` : ""}
      ${data.actionRequired ? "Action Required: Please review and take necessary action.\n\n" : ""}
      ${data.actionUrl ? `Take Action: ${data.actionUrl}\n\n` : ""}
      
      This is an automated system alert. Need help? Contact us at support@yourapp.com
    `,
  };
};
