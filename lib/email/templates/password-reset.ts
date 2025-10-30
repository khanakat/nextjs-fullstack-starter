/**
 * Password Reset Email Template
 * Sent when user requests password reset
 */

import { EmailTemplate } from '../types';

export const passwordResetTemplate: EmailTemplate = {
  name: 'password-reset',
  subject: 'Reset your {{appName}} password',
  variables: ['firstName', 'email', 'appName', 'resetUrl', 'expiresIn', 'supportEmail'],
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 30px;
        }
        .content {
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background-color: #dc2626;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
            font-size: 16px;
        }
        .button:hover {
            background-color: #b91c1c;
        }
        .warning-box {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
        }
        .warning-icon {
            color: #d97706;
            font-weight: bold;
            margin-right: 8px;
        }
        .security-tips {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .security-tips h4 {
            color: #0c4a6e;
            margin-top: 0;
        }
        .security-tips ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .security-tips li {
            margin-bottom: 8px;
            color: #0c4a6e;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
        }
        .expiry-notice {
            background-color: #fee2e2;
            border: 1px solid #fca5a5;
            border-radius: 6px;
            padding: 12px;
            margin: 15px 0;
            text-align: center;
            color: #991b1b;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{appName}}</div>
            <h1 class="title">Reset Your Password 🔐</h1>
            <p class="subtitle">We received a request to reset your password</p>
        </div>

        <div class="content">
            <p>Hi {{firstName}},</p>
            
            <p>We received a request to reset the password for your {{appName}} account associated with <strong>{{email}}</strong>.</p>

            <div class="warning-box">
                <span class="warning-icon">⚠️</span>
                <strong>Important:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.
            </div>

            <p>To reset your password, click the button below:</p>

            <div style="text-align: center;">
                <a href="{{resetUrl}}" class="button">Reset My Password</a>
            </div>

            <div class="expiry-notice">
                ⏰ This link will expire in {{expiresIn}} for security reasons
            </div>

            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">{{resetUrl}}</p>

            <div class="security-tips">
                <h4>🛡️ Security Tips</h4>
                <ul>
                    <li>Choose a strong password with at least 8 characters</li>
                    <li>Use a combination of letters, numbers, and special characters</li>
                    <li>Don't reuse passwords from other accounts</li>
                    <li>Consider using a password manager</li>
                    <li>Enable two-factor authentication if available</li>
                </ul>
            </div>

            <p>If you continue to have problems or didn't request this reset, please contact our support team at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>

            <p>Stay secure!</p>
            
            <p>Best regards,<br>The {{appName}} Security Team</p>
        </div>

        <div class="footer">
            <p>
                This password reset was requested from your {{appName}} account.<br>
                If you didn't request this, please <a href="mailto:{{supportEmail}}">contact support</a> immediately.
            </p>
            <p style="margin-top: 15px;">
                <a href="{{url '/help/security'}}">Security Help</a> |
                <a href="{{url '/contact'}}">Contact Support</a>
            </p>
        </div>
    </div>
</body>
</html>`,
  text: `
Reset Your {{appName}} Password

Hi {{firstName}},

We received a request to reset the password for your {{appName}} account associated with {{email}}.

IMPORTANT: If you didn't request this password reset, please ignore this email and your password will remain unchanged.

To reset your password, visit this link:
{{resetUrl}}

This link will expire in {{expiresIn}} for security reasons.

Security Tips:
• Choose a strong password with at least 8 characters
• Use a combination of letters, numbers, and special characters  
• Don't reuse passwords from other accounts
• Consider using a password manager
• Enable two-factor authentication if available

If you continue to have problems or didn't request this reset, please contact our support team at {{supportEmail}}.

Stay secure!

Best regards,
The {{appName}} Security Team

---
This password reset was requested from your {{appName}} account.
If you didn't request this, please contact support immediately at {{supportEmail}}.
`
};