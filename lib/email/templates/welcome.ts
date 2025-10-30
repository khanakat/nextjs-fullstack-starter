/**
 * Welcome Email Template
 * Sent to new users after successful registration
 */

import { EmailTemplate } from '../types';

export const welcomeTemplate: EmailTemplate = {
  name: 'welcome',
  subject: 'Welcome to {{appName}}, {{firstName}}!',
  variables: ['firstName', 'lastName', 'email', 'appName', 'loginUrl', 'supportEmail'],
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{appName}}</title>
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
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #1d4ed8;
        }
        .features {
            background-color: #f8fafc;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .feature {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        .feature:last-child {
            margin-bottom: 0;
        }
        .feature-icon {
            width: 20px;
            height: 20px;
            background-color: #10b981;
            border-radius: 50%;
            margin-right: 12px;
            flex-shrink: 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
        }
        .social-links {
            margin: 20px 0;
        }
        .social-links a {
            color: #6b7280;
            text-decoration: none;
            margin: 0 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{appName}}</div>
            <h1 class="title">Welcome aboard, {{firstName}}! 🎉</h1>
            <p class="subtitle">We're thrilled to have you join our community</p>
        </div>

        <div class="content">
            <p>Hi {{firstName}},</p>
            
            <p>Thank you for signing up for {{appName}}! We're excited to help you get started on your journey with us.</p>
            
            <p>Your account has been successfully created with the email address: <strong>{{email}}</strong></p>

            <div style="text-align: center;">
                <a href="{{loginUrl}}" class="button">Get Started</a>
            </div>

            <div class="features">
                <h3 style="margin-top: 0; color: #1f2937;">What you can do with {{appName}}:</h3>
                
                <div class="feature">
                    <div class="feature-icon"></div>
                    <div>
                        <strong>Manage your projects</strong><br>
                        <span style="color: #6b7280;">Organize and track all your work in one place</span>
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon"></div>
                    <div>
                        <strong>Collaborate with your team</strong><br>
                        <span style="color: #6b7280;">Invite team members and work together seamlessly</span>
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon"></div>
                    <div>
                        <strong>Generate detailed reports</strong><br>
                        <span style="color: #6b7280;">Get insights with comprehensive analytics and reports</span>
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon"></div>
                    <div>
                        <strong>Stay organized</strong><br>
                        <span style="color: #6b7280;">Keep everything organized with our powerful tools</span>
                    </div>
                </div>
            </div>

            <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>

            <p>Welcome to the team!</p>
            
            <p>Best regards,<br>The {{appName}} Team</p>
        </div>

        <div class="footer">
            <div class="social-links">
                <a href="{{url '/about'}}">About Us</a>
                <a href="{{url '/help'}}">Help Center</a>
                <a href="{{url '/contact'}}">Contact</a>
            </div>
            <p>
                You're receiving this email because you signed up for {{appName}}.<br>
                If you didn't sign up, please <a href="mailto:{{supportEmail}}">contact us</a>.
            </p>
        </div>
    </div>
</body>
</html>`,
  text: `
Welcome to {{appName}}, {{firstName}}!

Hi {{firstName}},

Thank you for signing up for {{appName}}! We're excited to help you get started on your journey with us.

Your account has been successfully created with the email address: {{email}}

Get started: {{loginUrl}}

What you can do with {{appName}}:
• Manage your projects - Organize and track all your work in one place
• Collaborate with your team - Invite team members and work together seamlessly  
• Generate detailed reports - Get insights with comprehensive analytics and reports
• Stay organized - Keep everything organized with our powerful tools

If you have any questions or need help getting started, don't hesitate to reach out to our support team at {{supportEmail}}.

Welcome to the team!

Best regards,
The {{appName}} Team

---
You're receiving this email because you signed up for {{appName}}.
If you didn't sign up, please contact us at {{supportEmail}}.
`
};