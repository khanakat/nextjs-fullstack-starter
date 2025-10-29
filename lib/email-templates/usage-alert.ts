import { EmailTemplate } from "@/lib/email";

// ============================================================================
// USAGE ALERT EMAIL TEMPLATE
// ============================================================================

export interface UsageAlertEmailData {
  organizationName: string;
  alertType: "storage" | "api_calls" | "users" | "records" | "performance";
  severity: "info" | "warning" | "critical";
  currentValue: number;
  threshold: number;
  limit: number;
  percentage: number;
  message: string;
  actionRequired?: boolean;
  actionUrl?: string;
  actionText?: string;
  appName: string;
  appUrl: string;
}

export const usageAlertEmailTemplate = (
  data: UsageAlertEmailData,
): EmailTemplate => {
  const {
    organizationName,
    alertType,
    severity,
    currentValue,
    // threshold, // Commented out as it's not used
    limit,
    percentage,
    message,
    actionRequired = false,
    actionUrl,
    actionText = "View Usage Dashboard",
    appName,
    appUrl,
  } = data;

  // Get alert-specific styling and content
  const alertConfig = getAlertConfig(alertType, severity);
  const formattedValue = formatValue(alertType, currentValue);
  const formattedLimit = formatValue(alertType, limit);

  const subject = `${alertConfig.emoji} ${severity.toUpperCase()}: ${alertConfig.title} Alert - ${organizationName}`;

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
          background: ${alertConfig.headerColor};
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .alert-icon {
          font-size: 48px;
          margin-bottom: 10px;
          display: block;
        }
        .content {
          padding: 30px;
        }
        .alert-summary {
          background: ${alertConfig.backgroundColor};
          border: 2px solid ${alertConfig.borderColor};
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .alert-title {
          font-size: 18px;
          font-weight: 600;
          color: ${alertConfig.textColor};
          margin: 0 0 10px 0;
        }
        .alert-message {
          color: ${alertConfig.textColor};
          margin: 0;
        }
        .usage-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 25px 0;
        }
        .stat-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: ${alertConfig.textColor};
          margin: 0;
        }
        .stat-label {
          font-size: 14px;
          color: #6c757d;
          margin: 5px 0 0 0;
        }
        .progress-bar {
          background: #e9ecef;
          border-radius: 10px;
          height: 20px;
          margin: 20px 0;
          overflow: hidden;
        }
        .progress-fill {
          background: ${alertConfig.progressColor};
          height: 100%;
          width: ${Math.min(percentage, 100)}%;
          transition: width 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }
        .action-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 25px;
          margin: 25px 0;
          text-align: center;
        }
        .action-button {
          display: inline-block;
          background: ${alertConfig.buttonColor};
          color: white;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 6px;
          font-weight: 600;
          margin: 10px 0;
          transition: background-color 0.3s ease;
        }
        .action-button:hover {
          background: ${alertConfig.buttonHoverColor};
        }
        .recommendations {
          background: #e3f2fd;
          border-left: 4px solid #2196f3;
          padding: 20px;
          margin: 25px 0;
        }
        .recommendations h3 {
          margin: 0 0 15px 0;
          color: #1976d2;
          font-size: 16px;
        }
        .recommendations ul {
          margin: 0;
          padding-left: 20px;
        }
        .recommendations li {
          margin: 8px 0;
          color: #424242;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
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
        @media (max-width: 600px) {
          .usage-stats {
            grid-template-columns: 1fr;
          }
          .content {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="alert-icon">${alertConfig.emoji}</span>
          <h1>${alertConfig.title} Alert</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${organizationName}</p>
        </div>

        <div class="content">
          <div class="alert-summary">
            <h2 class="alert-title">${severity.toUpperCase()} Alert: ${alertConfig.title}</h2>
            <p class="alert-message">${message}</p>
          </div>

          <div class="usage-stats">
            <div class="stat-card">
              <p class="stat-value">${formattedValue}</p>
              <p class="stat-label">Current Usage</p>
            </div>
            <div class="stat-card">
              <p class="stat-value">${formattedLimit}</p>
              <p class="stat-label">Total Limit</p>
            </div>
          </div>

          <div class="progress-bar">
            <div class="progress-fill">
              ${percentage.toFixed(1)}%
            </div>
          </div>

          ${
            actionRequired
              ? `
            <div class="action-section">
              <h3 style="margin: 0 0 15px 0; color: #dc3545;">⚠️ Immediate Action Required</h3>
              <p style="margin: 0 0 20px 0; color: #6c757d;">
                Your usage has exceeded safe limits. Please take action to prevent service interruption.
              </p>
              ${
                actionUrl
                  ? `
                <a href="${actionUrl}" class="action-button">${actionText}</a>
              `
                  : ""
              }
            </div>
          `
              : actionUrl
                ? `
            <div class="action-section">
              <h3 style="margin: 0 0 15px 0;">📊 Monitor Your Usage</h3>
              <p style="margin: 0 0 20px 0; color: #6c757d;">
                Keep track of your usage and optimize your resources.
              </p>
              <a href="${actionUrl}" class="action-button">${actionText}</a>
            </div>
          `
                : ""
          }

          <div class="recommendations">
            <h3>💡 Recommendations</h3>
            <ul>
              ${getRecommendations(alertType, severity)
                .map((rec) => `<li>${rec}</li>`)
                .join("")}
            </ul>
          </div>
        </div>

        <div class="footer">
          <p>
            This alert was generated automatically by ${appName}.<br>
            <a href="${appUrl}">Visit Dashboard</a> | 
            <a href="${appUrl}/settings/notifications">Notification Settings</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${alertConfig.emoji} ${severity.toUpperCase()}: ${alertConfig.title} Alert - ${organizationName}

${message}

Current Usage: ${formattedValue} (${percentage.toFixed(1)}%)
Total Limit: ${formattedLimit}

${actionRequired ? "⚠️ IMMEDIATE ACTION REQUIRED" : ""}

Recommendations:
${getRecommendations(alertType, severity)
  .map((rec) => `• ${rec}`)
  .join("\n")}

${actionUrl ? `View Usage Dashboard: ${actionUrl}` : ""}

---
This alert was generated automatically by ${appName}.
Visit: ${appUrl}
  `.trim();

  return {
    subject,
    html,
    text,
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getAlertConfig(alertType: string, severity: string) {
  const configs = {
    storage: {
      title: "Storage Usage",
      emoji: "💾",
      headerColor:
        severity === "critical"
          ? "#dc3545"
          : severity === "warning"
            ? "#fd7e14"
            : "#17a2b8",
      backgroundColor:
        severity === "critical"
          ? "#f8d7da"
          : severity === "warning"
            ? "#fff3cd"
            : "#d1ecf1",
      borderColor:
        severity === "critical"
          ? "#f5c6cb"
          : severity === "warning"
            ? "#ffeaa7"
            : "#bee5eb",
      textColor:
        severity === "critical"
          ? "#721c24"
          : severity === "warning"
            ? "#856404"
            : "#0c5460",
      progressColor:
        severity === "critical"
          ? "#dc3545"
          : severity === "warning"
            ? "#fd7e14"
            : "#17a2b8",
      buttonColor:
        severity === "critical"
          ? "#dc3545"
          : severity === "warning"
            ? "#fd7e14"
            : "#17a2b8",
      buttonHoverColor:
        severity === "critical"
          ? "#c82333"
          : severity === "warning"
            ? "#e96b00"
            : "#138496",
    },
    api_calls: {
      title: "API Usage",
      emoji: "🔌",
      headerColor:
        severity === "critical"
          ? "#dc3545"
          : severity === "warning"
            ? "#fd7e14"
            : "#28a745",
      backgroundColor:
        severity === "critical"
          ? "#f8d7da"
          : severity === "warning"
            ? "#fff3cd"
            : "#d4edda",
      borderColor:
        severity === "critical"
          ? "#f5c6cb"
          : severity === "warning"
            ? "#ffeaa7"
            : "#c3e6cb",
      textColor:
        severity === "critical"
          ? "#721c24"
          : severity === "warning"
            ? "#856404"
            : "#155724",
      progressColor:
        severity === "critical"
          ? "#dc3545"
          : severity === "warning"
            ? "#fd7e14"
            : "#28a745",
      buttonColor:
        severity === "critical"
          ? "#dc3545"
          : severity === "warning"
            ? "#fd7e14"
            : "#28a745",
      buttonHoverColor:
        severity === "critical"
          ? "#c82333"
          : severity === "warning"
            ? "#e96b00"
            : "#218838",
    },
    users: {
      title: "User Limit",
      emoji: "👥",
      headerColor:
        severity === "critical"
          ? "#dc3545"
          : severity === "warning"
            ? "#fd7e14"
            : "#6f42c1",
      backgroundColor:
        severity === "critical"
          ? "#f8d7da"
          : severity === "warning"
            ? "#fff3cd"
            : "#e2d9f3",
      borderColor:
        severity === "critical"
          ? "#f5c6cb"
          : severity === "warning"
            ? "#ffeaa7"
            : "#d1b3e6",
      textColor:
        severity === "critical"
          ? "#721c24"
          : severity === "warning"
            ? "#856404"
            : "#493057",
      progressColor:
        severity === "critical"
          ? "#dc3545"
          : severity === "warning"
            ? "#fd7e14"
            : "#6f42c1",
      buttonColor:
        severity === "critical"
          ? "#dc3545"
          : severity === "warning"
            ? "#fd7e14"
            : "#6f42c1",
      buttonHoverColor:
        severity === "critical"
          ? "#c82333"
          : severity === "warning"
            ? "#e96b00"
            : "#5a32a3",
    },
    records: {
      title: "Database Records",
      emoji: "🗄️",
      headerColor:
        severity === "critical"
          ? "#dc3545"
          : severity === "warning"
            ? "#fd7e14"
            : "#20c997",
      backgroundColor:
        severity === "critical"
          ? "#f8d7da"
          : severity === "warning"
            ? "#fff3cd"
            : "#d1f2eb",
      borderColor:
        severity === "critical"
          ? "#f5c6cb"
          : severity === "warning"
            ? "#ffeaa7"
            : "#c3e9dd",
      textColor:
        severity === "critical"
          ? "#721c24"
          : severity === "warning"
            ? "#856404"
            : "#0f5132",
      progressColor:
        severity === "critical"
          ? "#dc3545"
          : severity === "warning"
            ? "#fd7e14"
            : "#20c997",
      buttonColor:
        severity === "critical"
          ? "#dc3545"
          : severity === "warning"
            ? "#fd7e14"
            : "#20c997",
      buttonHoverColor:
        severity === "critical"
          ? "#c82333"
          : severity === "warning"
            ? "#e96b00"
            : "#1aa179",
    },
    performance: {
      title: "Performance",
      emoji: "⚡",
      headerColor:
        severity === "critical"
          ? "#dc3545"
          : severity === "warning"
            ? "#fd7e14"
            : "#ffc107",
      backgroundColor:
        severity === "critical"
          ? "#f8d7da"
          : severity === "warning"
            ? "#fff3cd"
            : "#fff3cd",
      borderColor:
        severity === "critical"
          ? "#f5c6cb"
          : severity === "warning"
            ? "#ffeaa7"
            : "#ffeaa7",
      textColor:
        severity === "critical"
          ? "#721c24"
          : severity === "warning"
            ? "#856404"
            : "#856404",
      progressColor:
        severity === "critical"
          ? "#dc3545"
          : severity === "warning"
            ? "#fd7e14"
            : "#ffc107",
      buttonColor:
        severity === "critical"
          ? "#dc3545"
          : severity === "warning"
            ? "#fd7e14"
            : "#ffc107",
      buttonHoverColor:
        severity === "critical"
          ? "#c82333"
          : severity === "warning"
            ? "#e96b00"
            : "#e0a800",
    },
  };

  return configs[alertType as keyof typeof configs] || configs.storage;
}

function formatValue(alertType: string, value: number): string {
  switch (alertType) {
    case "storage":
      return formatBytes(value);
    case "api_calls":
    case "users":
    case "records":
      return value.toLocaleString();
    case "performance":
      return `${value}ms`;
    default:
      return value.toString();
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getRecommendations(alertType: string, severity: string): string[] {
  const recommendations = {
    storage: {
      info: [
        "Monitor your storage usage regularly",
        "Consider archiving old files",
        "Review file upload policies",
      ],
      warning: [
        "Clean up unnecessary files and data",
        "Implement automated archiving",
        "Consider upgrading your storage plan",
        "Optimize file compression",
      ],
      critical: [
        "Immediately delete unnecessary files",
        "Upgrade your storage plan",
        "Contact support for assistance",
        "Implement emergency cleanup procedures",
      ],
    },
    api_calls: {
      info: [
        "Monitor API usage patterns",
        "Optimize API call efficiency",
        "Consider caching strategies",
      ],
      warning: [
        "Implement API call caching",
        "Optimize database queries",
        "Consider upgrading your API plan",
        "Review and optimize API usage patterns",
      ],
      critical: [
        "Immediately reduce API calls",
        "Implement emergency rate limiting",
        "Upgrade your API plan",
        "Contact support for immediate assistance",
      ],
    },
    users: {
      info: [
        "Monitor user growth trends",
        "Plan for capacity expansion",
        "Review user management policies",
      ],
      warning: [
        "Consider upgrading your user plan",
        "Review inactive user accounts",
        "Implement user lifecycle management",
        "Plan for user growth",
      ],
      critical: [
        "Upgrade your user plan immediately",
        "Temporarily restrict new user registrations",
        "Contact support for assistance",
        "Review user access policies",
      ],
    },
    records: {
      info: [
        "Monitor database growth",
        "Implement data archiving strategies",
        "Optimize database queries",
      ],
      warning: [
        "Archive old records",
        "Optimize database structure",
        "Consider upgrading database plan",
        "Implement data retention policies",
      ],
      critical: [
        "Immediately archive or delete old records",
        "Upgrade database plan",
        "Implement emergency data cleanup",
        "Contact support for assistance",
      ],
    },
    performance: {
      info: [
        "Monitor performance metrics regularly",
        "Optimize application code",
        "Consider performance improvements",
      ],
      warning: [
        "Investigate performance bottlenecks",
        "Optimize database queries",
        "Consider infrastructure upgrades",
        "Implement performance monitoring",
      ],
      critical: [
        "Immediately investigate performance issues",
        "Scale infrastructure resources",
        "Contact support for urgent assistance",
        "Implement emergency performance fixes",
      ],
    },
  };

  const typeRecs = recommendations[alertType as keyof typeof recommendations];
  return typeRecs
    ? typeRecs[severity as keyof typeof typeRecs] || typeRecs.info
    : recommendations.storage.info;
}

export default usageAlertEmailTemplate;
