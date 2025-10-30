/**
 * Report Notification Email Template
 * Sent when a report is ready or scheduled report is generated
 */

import { EmailTemplate } from '../types';

export const reportNotificationTemplate: EmailTemplate = {
  name: 'report-notification',
  subject: 'Your {{reportType}} report is ready - {{reportName}}',
  variables: ['firstName', 'reportName', 'reportType', 'generatedAt', 'downloadUrl', 'expiresAt', 'appName', 'supportEmail', 'reportDescription', 'fileSize'],
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Ready</title>
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
            background-color: #10b981;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
            font-size: 16px;
        }
        .button:hover {
            background-color: #059669;
        }
        .report-details {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 500;
            color: #374151;
        }
        .detail-value {
            color: #6b7280;
            text-align: right;
        }
        .success-icon {
            width: 60px;
            height: 60px;
            background-color: #10b981;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
        }
        .expiry-notice {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 12px;
            margin: 15px 0;
            text-align: center;
            color: #92400e;
            font-weight: 500;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
        }
        .report-preview {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
        }
        .report-preview h4 {
            color: #0c4a6e;
            margin-top: 0;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{appName}}</div>
            <div class="success-icon">📊</div>
            <h1 class="title">Report Ready!</h1>
            <p class="subtitle">Your {{reportType}} report has been generated successfully</p>
        </div>

        <div class="content">
            <p>Hi {{firstName}},</p>
            
            <p>Great news! Your requested report <strong>"{{reportName}}"</strong> has been generated and is ready for download.</p>

            {{#if reportDescription}}
            <div class="report-preview">
                <h4>📋 Report Summary</h4>
                <p style="margin: 0; color: #0c4a6e;">{{reportDescription}}</p>
            </div>
            {{/if}}

            <div class="report-details">
                <div class="detail-row">
                    <span class="detail-label">Report Name</span>
                    <span class="detail-value">{{reportName}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Report Type</span>
                    <span class="detail-value">{{capitalize reportType}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Generated</span>
                    <span class="detail-value">{{formatDate generatedAt 'long'}}</span>
                </div>
                {{#if fileSize}}
                <div class="detail-row">
                    <span class="detail-label">File Size</span>
                    <span class="detail-value">{{fileSize}}</span>
                </div>
                {{/if}}
                <div class="detail-row">
                    <span class="detail-label">Status</span>
                    <span class="detail-value" style="color: #10b981; font-weight: 500;">✅ Ready</span>
                </div>
            </div>

            <div style="text-align: center;">
                <a href="{{downloadUrl}}" class="button">Download Report</a>
            </div>

            <div class="expiry-notice">
                ⏰ This download link will expire on {{formatDate expiresAt 'long'}}
            </div>

            <p><strong>What's next?</strong></p>
            <ul>
                <li>Download your report using the button above</li>
                <li>Review the data and insights</li>
                <li>Share with your team if needed</li>
                <li>Schedule regular reports to stay updated</li>
            </ul>

            <p>If you have any questions about this report or need help interpreting the data, don't hesitate to reach out to our support team at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>

            <p>Happy analyzing!</p>
            
            <p>Best regards,<br>The {{appName}} Team</p>
        </div>

        <div class="footer">
            <p>
                This report was generated for your {{appName}} account.<br>
                <a href="{{url '/reports'}}">View All Reports</a> |
                <a href="{{url '/reports/scheduled'}}">Manage Scheduled Reports</a>
            </p>
        </div>
    </div>
</body>
</html>`,
  text: `
Your {{reportType}} Report is Ready - {{reportName}}

Hi {{firstName}},

Great news! Your requested report "{{reportName}}" has been generated and is ready for download.

Report Details:
• Name: {{reportName}}
• Type: {{capitalize reportType}}
• Generated: {{formatDate generatedAt 'long'}}
{{#if fileSize}}• File Size: {{fileSize}}{{/if}}
• Status: Ready ✅

{{#if reportDescription}}
Report Summary:
{{reportDescription}}
{{/if}}

Download your report: {{downloadUrl}}

IMPORTANT: This download link will expire on {{formatDate expiresAt 'long'}}

What's next?
• Download your report using the link above
• Review the data and insights
• Share with your team if needed  
• Schedule regular reports to stay updated

If you have any questions about this report or need help interpreting the data, don't hesitate to reach out to our support team at {{supportEmail}}.

Happy analyzing!

Best regards,
The {{appName}} Team

---
This report was generated for your {{appName}} account.
View all reports: {{url '/reports'}}
Manage scheduled reports: {{url '/reports/scheduled'}}
`
};