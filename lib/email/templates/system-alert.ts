/**
 * System Alert Email Template
 * Sent for system notifications, maintenance, security alerts, etc.
 */

import { EmailTemplate } from '../types';

export const systemAlertTemplate: EmailTemplate = {
  name: 'system-alert',
  subject: '{{alertType}}: {{alertTitle}}',
  variables: ['firstName', 'alertType', 'alertTitle', 'alertMessage', 'severity', 'timestamp', 'actionRequired', 'actionUrl', 'appName', 'supportEmail'],
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Alert</title>
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
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
            font-size: 16px;
        }
        .button-primary { background-color: #2563eb; }
        .button-warning { background-color: #f59e0b; }
        .button-danger { background-color: #dc2626; }
        .button-success { background-color: #10b981; }
        
        .alert-box {
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid;
        }
        .alert-info {
            background-color: #eff6ff;
            border-left-color: #3b82f6;
            color: #1e40af;
        }
        .alert-warning {
            background-color: #fffbeb;
            border-left-color: #f59e0b;
            color: #92400e;
        }
        .alert-danger {
            background-color: #fef2f2;
            border-left-color: #ef4444;
            color: #991b1b;
        }
        .alert-success {
            background-color: #f0fdf4;
            border-left-color: #10b981;
            color: #065f46;
        }
        
        .severity-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .severity-low { background-color: #d1fae5; color: #065f46; }
        .severity-medium { background-color: #fef3c7; color: #92400e; }
        .severity-high { background-color: #fee2e2; color: #991b1b; }
        .severity-critical { background-color: #fecaca; color: #7f1d1d; }
        
        .alert-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
        }
        .icon-info { background-color: #3b82f6; }
        .icon-warning { background-color: #f59e0b; }
        .icon-danger { background-color: #ef4444; }
        .icon-success { background-color: #10b981; }
        
        .timestamp {
            background-color: #f3f4f6;
            border-radius: 4px;
            padding: 8px 12px;
            font-family: monospace;
            font-size: 14px;
            color: #374151;
            text-align: center;
            margin: 15px 0;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
        }
        
        .action-section {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .action-section h4 {
            margin-top: 0;
            color: #1f2937;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{appName}}</div>
            
            {{#ifEquals severity 'info'}}
                <div class="alert-icon icon-info">ℹ️</div>
            {{/ifEquals}}
            {{#ifEquals severity 'warning'}}
                <div class="alert-icon icon-warning">⚠️</div>
            {{/ifEquals}}
            {{#ifEquals severity 'high'}}
                <div class="alert-icon icon-danger">🚨</div>
            {{/ifEquals}}
            {{#ifEquals severity 'critical'}}
                <div class="alert-icon icon-danger">🔥</div>
            {{/ifEquals}}
            {{#ifEquals severity 'success'}}
                <div class="alert-icon icon-success">✅</div>
            {{/ifEquals}}
            
            <h1 class="title">{{alertTitle}}</h1>
            <p class="subtitle">
                <span class="severity-badge severity-{{severity}}">{{severity}} Priority</span>
            </p>
        </div>

        <div class="content">
            <p>Hi {{firstName}},</p>
            
            <p>We're writing to inform you about an important {{alertType}} regarding your {{appName}} account.</p>

            {{#ifEquals severity 'info'}}
                <div class="alert-box alert-info">
            {{/ifEquals}}
            {{#ifEquals severity 'warning'}}
                <div class="alert-box alert-warning">
            {{/ifEquals}}
            {{#ifEquals severity 'high'}}
                <div class="alert-box alert-danger">
            {{/ifEquals}}
            {{#ifEquals severity 'critical'}}
                <div class="alert-box alert-danger">
            {{/ifEquals}}
            {{#ifEquals severity 'success'}}
                <div class="alert-box alert-success">
            {{/ifEquals}}
                <h3 style="margin-top: 0;">{{alertType}}</h3>
                <p style="margin-bottom: 0;">{{alertMessage}}</p>
            </div>

            <div class="timestamp">
                📅 Alert Time: {{formatDate timestamp 'long'}} at {{formatDate timestamp 'time'}}
            </div>

            {{#if actionRequired}}
            <div class="action-section">
                <h4>🎯 Action Required</h4>
                <p>{{actionRequired}}</p>
                
                {{#if actionUrl}}
                <div style="text-align: center;">
                    {{#ifEquals severity 'info'}}
                        <a href="{{actionUrl}}" class="button button-primary">Take Action</a>
                    {{/ifEquals}}
                    {{#ifEquals severity 'warning'}}
                        <a href="{{actionUrl}}" class="button button-warning">Take Action</a>
                    {{/ifEquals}}
                    {{#ifEquals severity 'high'}}
                        <a href="{{actionUrl}}" class="button button-danger">Take Action</a>
                    {{/ifEquals}}
                    {{#ifEquals severity 'critical'}}
                        <a href="{{actionUrl}}" class="button button-danger">Take Action</a>
                    {{/ifEquals}}
                    {{#ifEquals severity 'success'}}
                        <a href="{{actionUrl}}" class="button button-success">View Details</a>
                    {{/ifEquals}}
                </div>
                {{/if}}
            </div>
            {{/if}}

            {{#ifEquals severity 'critical'}}
            <div style="background-color: #fef2f2; border: 2px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                <strong style="color: #991b1b;">🚨 CRITICAL ALERT 🚨</strong><br>
                <span style="color: #991b1b;">This requires immediate attention. Please take action as soon as possible.</span>
            </div>
            {{/ifEquals}}

            {{#ifEquals severity 'high'}}
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; margin: 15px 0; text-align: center;">
                <strong style="color: #92400e;">⚠️ HIGH PRIORITY</strong><br>
                <span style="color: #92400e;">Please review and take action within 24 hours.</span>
            </div>
            {{/ifEquals}}

            <p><strong>What should you do?</strong></p>
            <ul>
                {{#if actionRequired}}
                <li>Review the alert details above</li>
                <li>Take the required action using the button provided</li>
                <li>Monitor your account for any changes</li>
                {{else}}
                <li>No action is required at this time</li>
                <li>This is for your information only</li>
                {{/if}}
                <li>Contact support if you have any questions</li>
            </ul>

            <p>If you have any questions or concerns about this alert, please don't hesitate to contact our support team at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>

            <p>Thank you for your attention to this matter.</p>
            
            <p>Best regards,<br>The {{appName}} System Team</p>
        </div>

        <div class="footer">
            <p>
                This is an automated system alert from {{appName}}.<br>
                <a href="{{url '/settings/notifications'}}">Manage Alert Preferences</a> |
                <a href="{{url '/help/alerts'}}">About System Alerts</a>
            </p>
        </div>
    </div>
</body>
</html>`,
  text: `
{{alertType}}: {{alertTitle}}

Hi {{firstName}},

We're writing to inform you about an important {{alertType}} regarding your {{appName}} account.

ALERT DETAILS:
Type: {{alertType}}
Severity: {{capitalize severity}} Priority
Time: {{formatDate timestamp 'long'}} at {{formatDate timestamp 'time'}}

MESSAGE:
{{alertMessage}}

{{#if actionRequired}}
ACTION REQUIRED:
{{actionRequired}}

{{#if actionUrl}}Take action: {{actionUrl}}{{/if}}
{{/if}}

{{#ifEquals severity 'critical'}}
🚨 CRITICAL ALERT 🚨
This requires immediate attention. Please take action as soon as possible.
{{/ifEquals}}

{{#ifEquals severity 'high'}}
⚠️ HIGH PRIORITY
Please review and take action within 24 hours.
{{/ifEquals}}

What should you do?
{{#if actionRequired}}
• Review the alert details above
• Take the required action using the link provided
• Monitor your account for any changes
{{else}}
• No action is required at this time
• This is for your information only
{{/if}}
• Contact support if you have any questions

If you have any questions or concerns about this alert, please don't hesitate to contact our support team at {{supportEmail}}.

Thank you for your attention to this matter.

Best regards,
The {{appName}} System Team

---
This is an automated system alert from {{appName}}.
Manage alert preferences: {{url '/settings/notifications'}}
About system alerts: {{url '/help/alerts'}}
`
};