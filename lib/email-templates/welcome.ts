import { EmailTemplate } from "@/lib/email";

// ============================================================================
// WELCOME EMAIL TEMPLATE
// ============================================================================

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  organizationName?: string;
  isOrganizationOwner?: boolean;
  activationUrl?: string;
  dashboardUrl: string;
  supportUrl?: string;
  appName: string;
  appUrl: string;
  features?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  nextSteps?: Array<{
    step: number;
    title: string;
    description: string;
    actionUrl?: string;
    actionText?: string;
  }>;
}

export const welcomeEmailTemplate = (data: WelcomeEmailData): EmailTemplate => {
  const {
    userName,
    // userEmail, // Commented out as it's not used
    organizationName,
    isOrganizationOwner = false,
    activationUrl,
    dashboardUrl,
    supportUrl,
    appName,
    appUrl,
    features = [],
    nextSteps = [],
  } = data;

  const subject = organizationName
    ? `Welcome to ${appName} - ${organizationName}!`
    : `Welcome to ${appName}!`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .welcome-icon {
          font-size: 64px;
          margin-bottom: 20px;
          display: block;
        }
        .user-info {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0 0 0;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          color: #2c3e50;
          margin: 0 0 25px 0;
          line-height: 1.5;
        }
        .organization-badge {
          display: inline-block;
          background: #e3f2fd;
          color: #1976d2;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin: 10px 0;
        }
        .owner-badge {
          background: #fff3e0;
          color: #f57c00;
        }
        .activation-section {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 25px;
          margin: 25px 0;
          text-align: center;
        }
        .activation-button {
          display: inline-block;
          background: #28a745;
          color: white;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-weight: 600;
          margin: 15px 0;
          transition: all 0.3s ease;
        }
        .activation-button:hover {
          background: #218838;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        }
        .features-section {
          margin: 35px 0;
        }
        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #2c3e50;
          margin: 0 0 20px 0;
          text-align: center;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin: 25px 0;
        }
        .feature-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 25px;
          text-align: center;
          border: 1px solid #e9ecef;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .feature-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
        }
        .feature-icon {
          font-size: 36px;
          margin-bottom: 15px;
          display: block;
        }
        .feature-title {
          font-size: 16px;
          font-weight: 600;
          color: #495057;
          margin: 0 0 10px 0;
        }
        .feature-description {
          font-size: 14px;
          color: #6c757d;
          margin: 0;
          line-height: 1.4;
        }
        .next-steps {
          background: #e3f2fd;
          border-radius: 12px;
          padding: 30px;
          margin: 35px 0;
        }
        .steps-list {
          list-style: none;
          padding: 0;
          margin: 20px 0 0 0;
        }
        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          margin: 20px 0;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .step-number {
          background: #007bff;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          flex-shrink: 0;
        }
        .step-content {
          flex: 1;
        }
        .step-title {
          font-size: 16px;
          font-weight: 600;
          color: #2c3e50;
          margin: 0 0 8px 0;
        }
        .step-description {
          font-size: 14px;
          color: #6c757d;
          margin: 0 0 15px 0;
          line-height: 1.4;
        }
        .step-action {
          display: inline-block;
          background: #007bff;
          color: white;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.3s ease;
        }
        .step-action:hover {
          background: #0056b3;
        }
        .cta-section {
          background: linear-gradient(135deg, #007bff, #0056b3);
          border-radius: 12px;
          padding: 35px;
          text-align: center;
          margin: 35px 0;
          color: white;
        }
        .cta-title {
          font-size: 22px;
          font-weight: 600;
          margin: 0 0 15px 0;
        }
        .cta-description {
          margin: 0 0 25px 0;
          opacity: 0.9;
          font-size: 16px;
        }
        .cta-button {
          display: inline-block;
          background: white;
          color: #007bff;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-weight: 600;
          margin: 10px;
          transition: all 0.3s ease;
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }
        .cta-button.secondary {
          background: transparent;
          color: white;
          border: 2px solid white;
        }
        .cta-button.secondary:hover {
          background: white;
          color: #007bff;
        }
        .footer {
          background: #f8f9fa;
          padding: 25px;
          text-align: center;
          border-top: 1px solid #dee2e6;
        }
        .footer p {
          margin: 0;
          color: #6c757d;
          font-size: 14px;
        }
        .footer a {
          color: #007bff;
          text-decoration: none;
        }
        .social-links {
          margin: 15px 0 0 0;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #6c757d;
          font-size: 18px;
          transition: color 0.3s ease;
        }
        .social-links a:hover {
          color: #007bff;
        }
        @media (max-width: 600px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
          .content {
            padding: 30px 20px;
          }
          .header {
            padding: 30px 20px;
          }
          .step-item {
            flex-direction: column;
            text-align: center;
          }
          .step-number {
            align-self: center;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="welcome-icon">🎉</span>
          <h1>Welcome to ${appName}!</h1>
          ${
            organizationName
              ? `
            <div class="user-info">
              <div class="organization-badge ${isOrganizationOwner ? "owner-badge" : ""}">
                ${isOrganizationOwner ? "👑 Owner" : "👤 Member"} • ${organizationName}
              </div>
            </div>
          `
              : ""
          }
        </div>

        <div class="content">
          <p class="greeting">
            Hi <strong>${userName}</strong>,<br><br>
            Welcome to ${appName}! We're thrilled to have you on board. 
            ${
              organizationName
                ? `You've been ${isOrganizationOwner ? "set up as the owner of" : "invited to join"} <strong>${organizationName}</strong>.`
                : "Your account has been created and you're ready to get started."
            }
          </p>

          ${
            activationUrl
              ? `
            <div class="activation-section">
              <h3 style="margin: 0 0 15px 0; color: #856404;">🔐 Activate Your Account</h3>
              <p style="margin: 0 0 20px 0; color: #856404;">
                To complete your registration and secure your account, please click the button below to activate your account.
              </p>
              <a href="${activationUrl}" class="activation-button">Activate Account</a>
              <p style="margin: 15px 0 0 0; font-size: 12px; color: #856404;">
                This link will expire in 24 hours for security reasons.
              </p>
            </div>
          `
              : ""
          }

          ${
            features.length > 0
              ? `
            <div class="features-section">
              <h2 class="section-title">🚀 What You Can Do</h2>
              <div class="features-grid">
                ${features
                  .map(
                    (feature) => `
                  <div class="feature-card">
                    <span class="feature-icon">${feature.icon}</span>
                    <h3 class="feature-title">${feature.title}</h3>
                    <p class="feature-description">${feature.description}</p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }

          ${
            nextSteps.length > 0
              ? `
            <div class="next-steps">
              <h2 class="section-title" style="color: #1976d2;">📋 Next Steps</h2>
              <ul class="steps-list">
                ${nextSteps
                  .map(
                    (step) => `
                  <li class="step-item">
                    <div class="step-number">${step.step}</div>
                    <div class="step-content">
                      <h3 class="step-title">${step.title}</h3>
                      <p class="step-description">${step.description}</p>
                      ${
                        step.actionUrl
                          ? `
                        <a href="${step.actionUrl}" class="step-action">${step.actionText || "Get Started"}</a>
                      `
                          : ""
                      }
                    </div>
                  </li>
                `,
                  )
                  .join("")}
              </ul>
            </div>
          `
              : ""
          }

          <div class="cta-section">
            <h2 class="cta-title">🎯 Ready to Get Started?</h2>
            <p class="cta-description">
              Access your dashboard and start exploring all the powerful features ${appName} has to offer.
            </p>
            <a href="${dashboardUrl}" class="cta-button">Go to Dashboard</a>
            ${
              supportUrl
                ? `
              <a href="${supportUrl}" class="cta-button secondary">Get Help</a>
            `
                : ""
            }
          </div>
        </div>

        <div class="footer">
          <p>
            Welcome aboard! If you have any questions, don't hesitate to reach out.<br>
            <a href="${appUrl}">Visit ${appName}</a>
            ${supportUrl ? ` | <a href="${supportUrl}">Get Support</a>` : ""}
          </p>
          <div class="social-links">
            <a href="#" title="Twitter">🐦</a>
            <a href="#" title="LinkedIn">💼</a>
            <a href="#" title="GitHub">🐙</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to ${appName}!

Hi ${userName},

Welcome to ${appName}! We're thrilled to have you on board.
${
  organizationName
    ? `You've been ${isOrganizationOwner ? "set up as the owner of" : "invited to join"} ${organizationName}.`
    : "Your account has been created and you're ready to get started."
}

${
  activationUrl
    ? `
ACTIVATE YOUR ACCOUNT
====================
To complete your registration, please visit: ${activationUrl}
(This link expires in 24 hours)
`
    : ""
}

${
  features.length > 0
    ? `
WHAT YOU CAN DO
===============
${features.map((feature) => `${feature.icon} ${feature.title}: ${feature.description}`).join("\n")}
`
    : ""
}

${
  nextSteps.length > 0
    ? `
NEXT STEPS
==========
${nextSteps.map((step) => `${step.step}. ${step.title}: ${step.description}${step.actionUrl ? ` (${step.actionUrl})` : ""}`).join("\n")}
`
    : ""
}

READY TO GET STARTED?
====================
Access your dashboard: ${dashboardUrl}
${supportUrl ? `Get help: ${supportUrl}` : ""}

Welcome aboard! If you have any questions, don't hesitate to reach out.

---
${appName} Team
Visit: ${appUrl}
  `.trim();

  return {
    subject,
    html,
    text,
  };
};

export default welcomeEmailTemplate;
