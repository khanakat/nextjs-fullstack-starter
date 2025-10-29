import { EmailTemplate } from "@/lib/email";

// ============================================================================
// SCHEDULED REPORT EMAIL TEMPLATE
// ============================================================================

export interface ScheduledReportEmailData {
  organizationName: string;
  reportType: "daily" | "weekly" | "monthly" | "quarterly" | "custom";
  reportPeriod: {
    start: string;
    end: string;
  };
  summary: {
    totalUsers: number;
    totalRecords: number;
    apiCalls: number;
    storageUsed: number;
    activeUsers: number;
    newUsers: number;
  };
  metrics: {
    userGrowth: number;
    apiUsageChange: number;
    storageGrowth: number;
    performanceScore: number;
  };
  topActivities: Array<{
    activity: string;
    count: number;
    change: number;
  }>;
  alerts?: Array<{
    type: string;
    severity: "info" | "warning" | "critical";
    message: string;
  }>;
  attachments?: Array<{
    name: string;
    url: string;
    type: "pdf" | "csv" | "xlsx";
  }>;
  dashboardUrl: string;
  appName: string;
  appUrl: string;
}

export const scheduledReportEmailTemplate = (
  data: ScheduledReportEmailData,
): EmailTemplate => {
  const {
    organizationName,
    reportType,
    reportPeriod,
    summary,
    metrics,
    topActivities,
    alerts = [],
    attachments = [],
    dashboardUrl,
    appName,
    appUrl,
  } = data;

  const reportConfig = getReportConfig(reportType);
  const periodText = formatPeriod(
    reportPeriod.start,
    reportPeriod.end,
    reportType,
  );

  const subject = `${reportConfig.emoji} ${reportConfig.title} Report - ${organizationName} (${periodText})`;

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
          max-width: 700px;
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
          background: linear-gradient(135deg, ${reportConfig.primaryColor}, ${reportConfig.secondaryColor});
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header .period {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .report-icon {
          font-size: 48px;
          margin-bottom: 15px;
          display: block;
        }
        .content {
          padding: 30px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        .summary-card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          border: 1px solid #e9ecef;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .summary-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .summary-value {
          font-size: 32px;
          font-weight: 700;
          color: ${reportConfig.primaryColor};
          margin: 0;
          line-height: 1;
        }
        .summary-label {
          font-size: 14px;
          color: #6c757d;
          margin: 8px 0 0 0;
          font-weight: 500;
        }
        .summary-change {
          font-size: 12px;
          margin: 5px 0 0 0;
          font-weight: 600;
        }
        .change-positive {
          color: #28a745;
        }
        .change-negative {
          color: #dc3545;
        }
        .change-neutral {
          color: #6c757d;
        }
        .section {
          margin: 40px 0;
        }
        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #2c3e50;
          margin: 0 0 20px 0;
          padding-bottom: 10px;
          border-bottom: 2px solid #e9ecef;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }
        .metric-card {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
        }
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .metric-title {
          font-size: 16px;
          font-weight: 600;
          color: #495057;
          margin: 0;
        }
        .metric-value {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }
        .metric-change {
          font-size: 14px;
          font-weight: 600;
        }
        .progress-bar {
          background: #e9ecef;
          border-radius: 10px;
          height: 8px;
          margin: 10px 0;
          overflow: hidden;
        }
        .progress-fill {
          background: ${reportConfig.primaryColor};
          height: 100%;
          border-radius: 10px;
          transition: width 0.3s ease;
        }
        .activities-list {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 0;
          margin: 0;
          list-style: none;
        }
        .activity-item {
          padding: 15px 20px;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .activity-item:last-child {
          border-bottom: none;
        }
        .activity-name {
          font-weight: 500;
          color: #495057;
        }
        .activity-stats {
          display: flex;
          gap: 15px;
          align-items: center;
        }
        .activity-count {
          font-weight: 600;
          color: ${reportConfig.primaryColor};
        }
        .alerts-section {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
        }
        .alert-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin: 10px 0;
          padding: 10px;
          border-radius: 6px;
        }
        .alert-critical {
          background: #f8d7da;
          border-left: 4px solid #dc3545;
        }
        .alert-warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
        }
        .alert-info {
          background: #d1ecf1;
          border-left: 4px solid #17a2b8;
        }
        .alert-icon {
          font-size: 16px;
          margin-top: 2px;
        }
        .alert-message {
          flex: 1;
          margin: 0;
          font-size: 14px;
        }
        .attachments-section {
          background: #e3f2fd;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
        }
        .attachment-list {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin: 15px 0 0 0;
        }
        .attachment-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
          padding: 10px 15px;
          border-radius: 6px;
          text-decoration: none;
          color: #1976d2;
          font-weight: 500;
          border: 1px solid #bbdefb;
          transition: all 0.2s ease;
        }
        .attachment-item:hover {
          background: #f3e5f5;
          transform: translateY(-1px);
        }
        .cta-section {
          background: linear-gradient(135deg, ${reportConfig.primaryColor}, ${reportConfig.secondaryColor});
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
          color: white;
        }
        .cta-button {
          display: inline-block;
          background: white;
          color: ${reportConfig.primaryColor};
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-weight: 600;
          margin: 15px 0 0 0;
          transition: all 0.3s ease;
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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
          color: ${reportConfig.primaryColor};
          text-decoration: none;
        }
        @media (max-width: 600px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          .content {
            padding: 20px;
          }
          .header {
            padding: 30px 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="report-icon">${reportConfig.emoji}</span>
          <h1>${reportConfig.title} Report</h1>
          <p class="period">${organizationName} • ${periodText}</p>
        </div>

        <div class="content">
          <!-- Summary Section -->
          <div class="section">
            <h2 class="section-title">📊 Executive Summary</h2>
            <div class="summary-grid">
              <div class="summary-card">
                <p class="summary-value">${summary.totalUsers.toLocaleString()}</p>
                <p class="summary-label">Total Users</p>
                <p class="summary-change ${getChangeClass(metrics.userGrowth)}">
                  ${formatChange(metrics.userGrowth)} vs previous period
                </p>
              </div>
              <div class="summary-card">
                <p class="summary-value">${summary.apiCalls.toLocaleString()}</p>
                <p class="summary-label">API Calls</p>
                <p class="summary-change ${getChangeClass(metrics.apiUsageChange)}">
                  ${formatChange(metrics.apiUsageChange)} vs previous period
                </p>
              </div>
              <div class="summary-card">
                <p class="summary-value">${formatBytes(summary.storageUsed)}</p>
                <p class="summary-label">Storage Used</p>
                <p class="summary-change ${getChangeClass(metrics.storageGrowth)}">
                  ${formatChange(metrics.storageGrowth)} vs previous period
                </p>
              </div>
              <div class="summary-card">
                <p class="summary-value">${summary.activeUsers.toLocaleString()}</p>
                <p class="summary-label">Active Users</p>
                <p class="summary-change change-neutral">
                  ${summary.newUsers} new this period
                </p>
              </div>
            </div>
          </div>

          <!-- Key Metrics Section -->
          <div class="section">
            <h2 class="section-title">📈 Key Performance Metrics</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-header">
                  <h3 class="metric-title">User Growth</h3>
                  <span class="metric-change ${getChangeClass(metrics.userGrowth)}">
                    ${formatChange(metrics.userGrowth)}
                  </span>
                </div>
                <p class="metric-value">${summary.totalUsers.toLocaleString()}</p>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${Math.min(Math.abs(metrics.userGrowth), 100)}%"></div>
                </div>
              </div>
              <div class="metric-card">
                <div class="metric-header">
                  <h3 class="metric-title">API Usage</h3>
                  <span class="metric-change ${getChangeClass(metrics.apiUsageChange)}">
                    ${formatChange(metrics.apiUsageChange)}
                  </span>
                </div>
                <p class="metric-value">${summary.apiCalls.toLocaleString()}</p>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${Math.min(Math.abs(metrics.apiUsageChange), 100)}%"></div>
                </div>
              </div>
              <div class="metric-card">
                <div class="metric-header">
                  <h3 class="metric-title">Performance Score</h3>
                  <span class="metric-change ${getPerformanceClass(metrics.performanceScore)}">
                    ${metrics.performanceScore}/100
                  </span>
                </div>
                <p class="metric-value">${metrics.performanceScore}%</p>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${metrics.performanceScore}%"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Activities Section -->
          <div class="section">
            <h2 class="section-title">🔥 Top Activities</h2>
            <ul class="activities-list">
              ${topActivities
                .map(
                  (activity) => `
                <li class="activity-item">
                  <span class="activity-name">${activity.activity}</span>
                  <div class="activity-stats">
                    <span class="activity-count">${activity.count.toLocaleString()}</span>
                    <span class="metric-change ${getChangeClass(activity.change)}">
                      ${formatChange(activity.change)}
                    </span>
                  </div>
                </li>
              `,
                )
                .join("")}
            </ul>
          </div>

          ${
            alerts.length > 0
              ? `
            <!-- Alerts Section -->
            <div class="section">
              <h2 class="section-title">⚠️ Alerts & Notifications</h2>
              <div class="alerts-section">
                ${alerts
                  .map(
                    (alert) => `
                  <div class="alert-item alert-${alert.severity}">
                    <span class="alert-icon">${getAlertIcon(alert.severity)}</span>
                    <p class="alert-message">
                      <strong>${alert.type}:</strong> ${alert.message}
                    </p>
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
            attachments.length > 0
              ? `
            <!-- Attachments Section -->
            <div class="section">
              <h2 class="section-title">📎 Report Attachments</h2>
              <div class="attachments-section">
                <p style="margin: 0 0 15px 0; color: #1976d2; font-weight: 500;">
                  Download detailed reports and data exports:
                </p>
                <div class="attachment-list">
                  ${attachments
                    .map(
                      (attachment) => `
                    <a href="${attachment.url}" class="attachment-item">
                      <span>${getFileIcon(attachment.type)}</span>
                      <span>${attachment.name}</span>
                    </a>
                  `,
                    )
                    .join("")}
                </div>
              </div>
            </div>
          `
              : ""
          }

          <!-- Call to Action -->
          <div class="cta-section">
            <h3 style="margin: 0 0 10px 0; font-size: 22px;">📊 Explore Your Dashboard</h3>
            <p style="margin: 0 0 20px 0; opacity: 0.9;">
              Get deeper insights and real-time analytics in your dashboard
            </p>
            <a href="${dashboardUrl}" class="cta-button">View Full Dashboard</a>
          </div>
        </div>

        <div class="footer">
          <p>
            This ${reportType} report was generated automatically by ${appName}.<br>
            <a href="${appUrl}">Visit Dashboard</a> | 
            <a href="${appUrl}/settings/reports">Report Settings</a> |
            <a href="${appUrl}/settings/notifications">Notifications</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${reportConfig.emoji} ${reportConfig.title} Report - ${organizationName}
Period: ${periodText}

EXECUTIVE SUMMARY
=================
Total Users: ${summary.totalUsers.toLocaleString()} (${formatChange(metrics.userGrowth)} vs previous)
API Calls: ${summary.apiCalls.toLocaleString()} (${formatChange(metrics.apiUsageChange)} vs previous)
Storage Used: ${formatBytes(summary.storageUsed)} (${formatChange(metrics.storageGrowth)} vs previous)
Active Users: ${summary.activeUsers.toLocaleString()} (${summary.newUsers} new this period)

KEY METRICS
===========
User Growth: ${formatChange(metrics.userGrowth)}
API Usage Change: ${formatChange(metrics.apiUsageChange)}
Performance Score: ${metrics.performanceScore}/100

TOP ACTIVITIES
==============
${topActivities
  .map(
    (activity) =>
      `${activity.activity}: ${activity.count.toLocaleString()} (${formatChange(activity.change)})`,
  )
  .join("\n")}

${
  alerts.length > 0
    ? `
ALERTS & NOTIFICATIONS
=====================
${alerts.map((alert) => `${getAlertIcon(alert.severity)} ${alert.type}: ${alert.message}`).join("\n")}
`
    : ""
}

${
  attachments.length > 0
    ? `
ATTACHMENTS
===========
${attachments.map((attachment) => `${attachment.name} (${attachment.type.toUpperCase()}): ${attachment.url}`).join("\n")}
`
    : ""
}

View Full Dashboard: ${dashboardUrl}

---
This ${reportType} report was generated automatically by ${appName}.
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

function getReportConfig(reportType: string) {
  const configs = {
    daily: {
      title: "Daily",
      emoji: "📅",
      primaryColor: "#007bff",
      secondaryColor: "#0056b3",
    },
    weekly: {
      title: "Weekly",
      emoji: "📊",
      primaryColor: "#28a745",
      secondaryColor: "#1e7e34",
    },
    monthly: {
      title: "Monthly",
      emoji: "📈",
      primaryColor: "#17a2b8",
      secondaryColor: "#117a8b",
    },
    quarterly: {
      title: "Quarterly",
      emoji: "📋",
      primaryColor: "#6f42c1",
      secondaryColor: "#5a32a3",
    },
    custom: {
      title: "Custom",
      emoji: "🎯",
      primaryColor: "#fd7e14",
      secondaryColor: "#e96b00",
    },
  };

  return configs[reportType as keyof typeof configs] || configs.daily;
}

function formatPeriod(start: string, end: string, reportType: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  if (reportType === "daily") {
    return startDate.toLocaleDateString("en-US", options);
  }

  return `${startDate.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", options)}`;
}

function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

function getChangeClass(change: number): string {
  if (change > 0) return "change-positive";
  if (change < 0) return "change-negative";
  return "change-neutral";
}

function getPerformanceClass(score: number): string {
  if (score >= 80) return "change-positive";
  if (score >= 60) return "change-neutral";
  return "change-negative";
}

function getAlertIcon(severity: string): string {
  switch (severity) {
    case "critical":
      return "🚨";
    case "warning":
      return "⚠️";
    case "info":
      return "ℹ️";
    default:
      return "📢";
  }
}

function getFileIcon(type: string): string {
  switch (type) {
    case "pdf":
      return "📄";
    case "csv":
      return "📊";
    case "xlsx":
      return "📈";
    default:
      return "📎";
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default scheduledReportEmailTemplate;
