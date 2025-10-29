// Mock import for now since module is not available
// import { db } from "@/lib/db";

// Mock db implementation
const db = {
  reportTemplate: {
    create: (..._args: any[]) => ({
      id: "template-1",
      name: "Test Template",
      description: "Test Description",
      type: "usage",
      config: {
        columns: ["id", "name", "value"],
        filters: {},
        sorting: { field: "name", direction: "asc" }
      },
      isPublic: true,
      createdBy: "user-1",
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      isSystem: false,
      category: "default"
    }),
    findMany: (..._args: any[]) => [],
    findUnique: (..._args: any[]) => null,
    findFirst: (..._args: any[]) => ({
      id: "template-1",
      name: "Test Template",
      description: "Test Description",
      type: "usage",
      config: {
        columns: ["id", "name", "value"],
        filters: {},
        sorting: { field: "name", direction: "asc" }
      },
      isPublic: true,
      createdBy: "user-1",
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      isSystem: false,
      category: "default"
    }),
    update: (..._args: any[]) => ({
      id: "template-1",
      name: "Updated Template",
      description: "Updated Description",
      type: "usage",
      config: {
        columns: ["id", "name", "value", "updated"],
        filters: { status: "active" },
        sorting: { field: "updatedAt", direction: "desc" }
      },
      isPublic: true,
      createdBy: "user-1",
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      isSystem: false,
      category: "default"
    }),
    delete: (..._args: any[]) => ({
      id: "template-1",
      name: "Deleted Template",
    }),
    count: (..._args: any[]) => 0,
  },
  user: {
    findUnique: (..._args: any[]) => ({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    }),
  },
  organization: {
    findUnique: (..._args: any[]) => ({
      id: "org-1",
      name: "Test Organization",
      plan: "pro",
    }),
  },
  reportTemplatePermission: {
    upsert: (..._args: any[]) => ({
      id: "perm-1",
      templateId: "template-1",
      userId: "user-1",
      permissionType: "view",
    }),
    findMany: (..._args: any[]) => [],
  },
  reportTemplateUsage: {
    upsert: (..._args: any[]) => ({
      templateId: "template-1",
      organizationId: "org-1",
      usageCount: 1,
      lastUsed: new Date(),
    }),
    findMany: (..._args: any[]) => [{
      templateId: "template-1",
      organizationId: "org-1",
      usageCount: 1,
      lastUsed: new Date(),
      template: {
        id: "template-1",
        name: "Test Template",
        type: "usage",
        category: "default",
        isSystem: false
      }
    }],
  },
};
// Mock AuditService
class AuditService {
  static async log(_data: any) {
    console.log('Audit log:', _data);
  }
}
export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: "dashboard" | "analytics" | "financial" | "operational" | "custom";
  category: "standard" | "premium" | "enterprise";
  organizationId?: string; // null for system templates
  createdBy?: string;
  config: {
    layout: "single-page" | "multi-page" | "dashboard";
    orientation: "portrait" | "landscape";
    sections: ReportSection[];
    styling: {
      theme: "light" | "dark" | "corporate" | "minimal";
      primaryColor?: string;
      secondaryColor?: string;
      fontFamily?: string;
      fontSize?: number;
    };
    branding: {
      showLogo?: boolean;
      showCompanyName?: boolean;
      showGeneratedDate?: boolean;
      showPageNumbers?: boolean;
      customHeader?: string;
      customFooter?: string;
    };
  };
  isActive: boolean;
  isSystem: boolean; // System templates cannot be deleted
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSection {
  id: string;
  type:
    | "header"
    | "summary"
    | "chart"
    | "table"
    | "text"
    | "metrics"
    | "footer";
  title?: string;
  order: number;
  config: {
    // Chart section config
    chartType?: "bar" | "line" | "pie" | "area" | "scatter" | "heatmap";
    dataSource?: string;
    filters?: Record<string, any>;

    // Table section config
    columns?: Array<{
      key: string;
      label: string;
      type: "text" | "number" | "date" | "currency" | "percentage";
      format?: string;
      sortable?: boolean;
    }>;

    // Metrics section config
    metrics?: Array<{
      key: string;
      label: string;
      type: "count" | "sum" | "average" | "percentage" | "trend";
      format?: string;
      target?: number;
      comparison?: "previous_period" | "target" | "none";
    }>;

    // Text section config
    content?: string;
    variables?: string[]; // Variables that can be replaced in content

    // Styling
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    padding?: number;
    margin?: number;
    height?: number;
    width?: string;
  };
}

export interface ReportTemplateUsage {
  templateId: string;
  organizationId: string;
  usageCount: number;
  lastUsed: Date;
}

export class ReportTemplatesService {
  /**
   * Initialize system templates
   */
  static async initializeSystemTemplates(): Promise<void> {
    const systemTemplates = this.getSystemTemplateDefinitions();

    // TODO: Implement system templates initialization when Prisma model is available
    console.log(`Would initialize ${systemTemplates.length} system templates`);
    // for (const template of systemTemplates) {
      // TODO: Fix Prisma model - reportTemplate does not exist
      // const existing = await db.reportTemplate.findFirst({
      //   where: { name: template.name, isSystem: true },
      // });

      // if (!existing) {
      //   await db.reportTemplate.create({
      //     data: {
      //       ...template,
      //       isSystem: true,
      //       isActive: true,
      //       createdAt: new Date(),
      //       updatedAt: new Date(),
      //     },
      //   });
      // }
    // }
  }

  /**
   * Get system template definitions
   */
  private static getSystemTemplateDefinitions(): Omit<
    ReportTemplate,
    "id" | "createdAt" | "updatedAt" | "isSystem" | "isActive"
  >[] {
    return [
      {
        name: "Executive Dashboard",
        description: "High-level overview with key metrics and trends",
        type: "dashboard",
        category: "standard",
        organizationId: undefined,
        createdBy: undefined,
        config: {
          layout: "dashboard",
          orientation: "landscape",
          sections: [
            {
              id: "header",
              type: "header",
              title: "Executive Dashboard",
              order: 1,
              config: {
                backgroundColor: "#1f2937",
                textColor: "#ffffff",
                padding: 20,
              },
            },
            {
              id: "key-metrics",
              type: "metrics",
              title: "Key Performance Indicators",
              order: 2,
              config: {
                metrics: [
                  {
                    key: "total_revenue",
                    label: "Total Revenue",
                    type: "sum",
                    format: "currency",
                    comparison: "previous_period",
                  },
                  {
                    key: "active_users",
                    label: "Active Users",
                    type: "count",
                    comparison: "previous_period",
                  },
                  {
                    key: "conversion_rate",
                    label: "Conversion Rate",
                    type: "percentage",
                    format: "0.00%",
                    target: 0.05,
                  },
                  {
                    key: "customer_satisfaction",
                    label: "Customer Satisfaction",
                    type: "average",
                    format: "0.0",
                    target: 4.5,
                  },
                ],
                padding: 15,
              },
            },
            {
              id: "revenue-trend",
              type: "chart",
              title: "Revenue Trend",
              order: 3,
              config: {
                chartType: "line",
                dataSource: "revenue_by_month",
                height: 300,
              },
            },
            {
              id: "user-growth",
              type: "chart",
              title: "User Growth",
              order: 4,
              config: {
                chartType: "area",
                dataSource: "users_by_month",
                height: 300,
              },
            },
          ],
          styling: {
            theme: "corporate",
            primaryColor: "#3b82f6",
            secondaryColor: "#64748b",
            fontFamily: "Inter",
            fontSize: 12,
          },
          branding: {
            showLogo: true,
            showCompanyName: true,
            showGeneratedDate: true,
            showPageNumbers: true,
          },
        },
      },
      {
        name: "Financial Report",
        description: "Comprehensive financial analysis and statements",
        type: "financial",
        category: "standard",
        organizationId: undefined,
        createdBy: undefined,
        config: {
          layout: "multi-page",
          orientation: "portrait",
          sections: [
            {
              id: "cover",
              type: "header",
              title: "Financial Report",
              order: 1,
              config: {
                backgroundColor: "#f8fafc",
                padding: 40,
                height: 200,
              },
            },
            {
              id: "summary",
              type: "summary",
              title: "Executive Summary",
              order: 2,
              config: {
                content:
                  "This financial report provides a comprehensive overview of the organization's financial performance for the period {{period}}. Key highlights include revenue growth of {{revenue_growth}}% and a net profit margin of {{profit_margin}}%.",
                variables: ["period", "revenue_growth", "profit_margin"],
                padding: 20,
              },
            },
            {
              id: "financial-metrics",
              type: "metrics",
              title: "Financial Metrics",
              order: 3,
              config: {
                metrics: [
                  {
                    key: "total_revenue",
                    label: "Total Revenue",
                    type: "sum",
                    format: "currency",
                  },
                  {
                    key: "gross_profit",
                    label: "Gross Profit",
                    type: "sum",
                    format: "currency",
                  },
                  {
                    key: "net_profit",
                    label: "Net Profit",
                    type: "sum",
                    format: "currency",
                  },
                  {
                    key: "profit_margin",
                    label: "Profit Margin",
                    type: "percentage",
                    format: "0.00%",
                  },
                  {
                    key: "operating_expenses",
                    label: "Operating Expenses",
                    type: "sum",
                    format: "currency",
                  },
                  {
                    key: "cash_flow",
                    label: "Cash Flow",
                    type: "sum",
                    format: "currency",
                  },
                ],
              },
            },
            {
              id: "revenue-breakdown",
              type: "chart",
              title: "Revenue Breakdown",
              order: 4,
              config: {
                chartType: "pie",
                dataSource: "revenue_by_category",
                height: 400,
              },
            },
            {
              id: "expense-analysis",
              type: "table",
              title: "Expense Analysis",
              order: 5,
              config: {
                columns: [
                  {
                    key: "category",
                    label: "Category",
                    type: "text",
                    sortable: true,
                  },
                  {
                    key: "amount",
                    label: "Amount",
                    type: "currency",
                    sortable: true,
                  },
                  {
                    key: "percentage",
                    label: "% of Total",
                    type: "percentage",
                    sortable: true,
                  },
                  {
                    key: "change",
                    label: "Change",
                    type: "percentage",
                    sortable: true,
                  },
                ],
              },
            },
          ],
          styling: {
            theme: "corporate",
            primaryColor: "#059669",
            secondaryColor: "#6b7280",
            fontFamily: "Times New Roman",
            fontSize: 11,
          },
          branding: {
            showLogo: true,
            showCompanyName: true,
            showGeneratedDate: true,
            showPageNumbers: true,
            customFooter: "Confidential Financial Information",
          },
        },
      },
      {
        name: "Analytics Overview",
        description: "Data analytics and insights report",
        type: "analytics",
        category: "standard",
        organizationId: undefined,
        createdBy: undefined,
        config: {
          layout: "multi-page",
          orientation: "landscape",
          sections: [
            {
              id: "header",
              type: "header",
              title: "Analytics Overview",
              order: 1,
              config: {
                backgroundColor: "#6366f1",
                textColor: "#ffffff",
                padding: 25,
              },
            },
            {
              id: "traffic-metrics",
              type: "metrics",
              title: "Traffic & Engagement",
              order: 2,
              config: {
                metrics: [
                  {
                    key: "page_views",
                    label: "Page Views",
                    type: "sum",
                    comparison: "previous_period",
                  },
                  {
                    key: "unique_visitors",
                    label: "Unique Visitors",
                    type: "count",
                    comparison: "previous_period",
                  },
                  {
                    key: "bounce_rate",
                    label: "Bounce Rate",
                    type: "percentage",
                    format: "0.00%",
                  },
                  {
                    key: "avg_session_duration",
                    label: "Avg. Session Duration",
                    type: "average",
                    format: "0:00",
                  },
                ],
              },
            },
            {
              id: "traffic-sources",
              type: "chart",
              title: "Traffic Sources",
              order: 3,
              config: {
                chartType: "bar",
                dataSource: "traffic_by_source",
                height: 300,
              },
            },
            {
              id: "user-behavior",
              type: "chart",
              title: "User Behavior Flow",
              order: 4,
              config: {
                chartType: "heatmap",
                dataSource: "user_behavior_data",
                height: 400,
              },
            },
            {
              id: "top-pages",
              type: "table",
              title: "Top Performing Pages",
              order: 5,
              config: {
                columns: [
                  { key: "page", label: "Page", type: "text", sortable: true },
                  {
                    key: "views",
                    label: "Views",
                    type: "number",
                    sortable: true,
                  },
                  {
                    key: "unique_views",
                    label: "Unique Views",
                    type: "number",
                    sortable: true,
                  },
                  {
                    key: "avg_time",
                    label: "Avg. Time on Page",
                    type: "text",
                    sortable: true,
                  },
                  {
                    key: "bounce_rate",
                    label: "Bounce Rate",
                    type: "percentage",
                    sortable: true,
                  },
                ],
              },
            },
          ],
          styling: {
            theme: "minimal",
            primaryColor: "#6366f1",
            secondaryColor: "#8b5cf6",
            fontFamily: "Arial",
            fontSize: 12,
          },
          branding: {
            showLogo: true,
            showCompanyName: true,
            showGeneratedDate: true,
            showPageNumbers: true,
          },
        },
      },
      {
        name: "Operational Report",
        description: "Daily/weekly operational metrics and status",
        type: "operational",
        category: "standard",
        organizationId: undefined,
        createdBy: undefined,
        config: {
          layout: "single-page",
          orientation: "portrait",
          sections: [
            {
              id: "header",
              type: "header",
              title: "Operational Report",
              order: 1,
              config: {
                backgroundColor: "#f59e0b",
                textColor: "#ffffff",
                padding: 15,
              },
            },
            {
              id: "system-status",
              type: "metrics",
              title: "System Status",
              order: 2,
              config: {
                metrics: [
                  {
                    key: "uptime",
                    label: "System Uptime",
                    type: "percentage",
                    format: "0.000%",
                    target: 0.999,
                  },
                  {
                    key: "response_time",
                    label: "Avg. Response Time",
                    type: "average",
                    format: "0ms",
                    target: 200,
                  },
                  {
                    key: "error_rate",
                    label: "Error Rate",
                    type: "percentage",
                    format: "0.00%",
                    target: 0.01,
                  },
                  {
                    key: "active_sessions",
                    label: "Active Sessions",
                    type: "count",
                  },
                ],
              },
            },
            {
              id: "performance-trend",
              type: "chart",
              title: "Performance Trend (24h)",
              order: 3,
              config: {
                chartType: "line",
                dataSource: "performance_24h",
                height: 250,
              },
            },
            {
              id: "alerts-summary",
              type: "table",
              title: "Recent Alerts",
              order: 4,
              config: {
                columns: [
                  {
                    key: "timestamp",
                    label: "Time",
                    type: "date",
                    sortable: true,
                  },
                  {
                    key: "severity",
                    label: "Severity",
                    type: "text",
                    sortable: true,
                  },
                  {
                    key: "component",
                    label: "Component",
                    type: "text",
                    sortable: true,
                  },
                  { key: "message", label: "Message", type: "text" },
                  {
                    key: "status",
                    label: "Status",
                    type: "text",
                    sortable: true,
                  },
                ],
              },
            },
          ],
          styling: {
            theme: "light",
            primaryColor: "#f59e0b",
            secondaryColor: "#d97706",
            fontFamily: "Roboto",
            fontSize: 11,
          },
          branding: {
            showLogo: false,
            showCompanyName: true,
            showGeneratedDate: true,
            showPageNumbers: false,
            customHeader: "OPERATIONAL STATUS REPORT",
          },
        },
      },
    ];
  }

  /**
   * Get available templates for an organization
   */
  static async getAvailableTemplates(
    organizationId: string,
    filters: {
      type?: string;
      category?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      OR: [{ isSystem: true }, { organizationId: organizationId }],
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [templates, total] = await Promise.all([
      db.reportTemplate.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          category: true,
          isSystem: true,
          createdAt: true,
          createdBy: true,
          createdByUser: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: [{ isSystem: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      db.reportTemplate.count({ where }),
    ]);

    return {
      templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(
    templateId: string,
    organizationId: string,
  ): Promise<ReportTemplate | null> {
    const template = await db.reportTemplate.findFirst({
      where: {
        id: templateId,
        isActive: true,
        OR: [{ isSystem: true }, { organizationId: organizationId }],
      },
    });

    if (!template) {
      return null;
    }

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      type: template.type as any,
      category: template.category as any,
      organizationId: template.organizationId,
      createdBy: template.createdBy,
      config: typeof template.config === 'string' ? JSON.parse(template.config) : template.config,
      isActive: template.isActive,
      isSystem: template.isSystem,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  /**
   * Create custom template
   */
  static async createCustomTemplate(
    userId: string,
    organizationId: string,
    template: Omit<
      ReportTemplate,
      | "id"
      | "organizationId"
      | "createdBy"
      | "isSystem"
      | "createdAt"
      | "updatedAt"
    >,
  ): Promise<ReportTemplate> {
    try {
      const created = await db.reportTemplate.create({
        data: {
          name: template.name,
          description: template.description,
          type: template.type,
          category: template.category,
          organizationId: organizationId,
          createdBy: userId,
          config: JSON.stringify(template.config),
          isActive: template.isActive,
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Log the creation
      await AuditService.log({
        action: "report_template_created",
        userId: userId,
        organizationId: organizationId,
        resource: "report_template",
        resourceId: created.id,
        category: "system",
        severity: "info",
        status: "success",
        ipAddress: "127.0.0.1",
        metadata: {
          name: template.name,
          type: template.type,
          category: template.category,
        },
      });

      return {
        id: created.id,
        name: created.name,
        description: created.description,
        type: created.type as any,
        category: created.category as any,
        organizationId: created.organizationId,
        createdBy: created.createdBy,
        config: typeof created.config === 'string' ? JSON.parse(created.config) : created.config,
        isActive: created.isActive,
        isSystem: created.isSystem,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };
    } catch (error) {
      console.error("Error creating custom template:", error);
      throw error;
    }
  }

  /**
   * Update custom template
   */
  static async updateCustomTemplate(
    templateId: string,
    userId: string,
    organizationId: string,
    updates: Partial<
      Omit<
        ReportTemplate,
        | "id"
        | "organizationId"
        | "createdBy"
        | "isSystem"
        | "createdAt"
        | "updatedAt"
      >
    >,
  ): Promise<ReportTemplate> {
    try {
      // Verify template exists and user has access
      const template = await db.reportTemplate.findFirst({
        where: {
          id: templateId,
          organizationId: organizationId,
          isSystem: false, // Cannot update system templates
          OR: [
            { createdBy: userId },
            {
              organization: {
                members: {
                  some: { userId: userId, role: { in: ["ADMIN", "OWNER"] } },
                },
              },
            },
          ],
        },
      });

      if (!template) {
        throw new Error("Template not found or access denied");
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined)
        updateData.description = updates.description;
      if (updates.type) updateData.type = updates.type;
      if (updates.category) updateData.category = updates.category;
      if (updates.config) updateData.config = JSON.stringify(updates.config);
      if (updates.isActive !== undefined)
        updateData.isActive = updates.isActive;

      const updated = await db.reportTemplate.update({
        where: { id: templateId },
        data: updateData,
      });

      // Log the update
      await AuditService.log({
        action: "report_template_updated",
        userId: userId,
        organizationId: organizationId,
        resource: "report_template",
        resourceId: templateId,
        category: "system",
        severity: "info",
        status: "success",
        ipAddress: "127.0.0.1",
        metadata: updates,
      });

      return {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        type: updated.type as any,
        category: updated.category as any,
        organizationId: updated.organizationId,
        createdBy: updated.createdBy,
        config: typeof updated.config === 'string' ? JSON.parse(updated.config) : updated.config,
        isActive: updated.isActive,
        isSystem: updated.isSystem,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } catch (error) {
      console.error("Error updating custom template:", error);
      throw error;
    }
  }

  /**
   * Delete custom template
   */
  static async deleteCustomTemplate(
    templateId: string,
    userId: string,
    organizationId: string,
  ): Promise<void> {
    try {
      const template = await db.reportTemplate.findFirst({
        where: {
          id: templateId,
          organizationId: organizationId,
          isSystem: false, // Cannot delete system templates
          OR: [
            { createdBy: userId },
            {
              organization: {
                members: {
                  some: { userId: userId, role: { in: ["ADMIN", "OWNER"] } },
                },
              },
            },
          ],
        },
      });

      if (!template) {
        throw new Error("Template not found or access denied");
      }

      await db.reportTemplate.delete({
        where: { id: templateId },
      });

      // Log the deletion
      await AuditService.log({
        action: "report_template_deleted",
        userId: userId,
        organizationId: organizationId,
        resource: "report_template",
        resourceId: templateId,
        category: "system",
        severity: "info",
        status: "success",
        ipAddress: "127.0.0.1",
        metadata: {
          name: template.name,
        },
      });
    } catch (error) {
      console.error("Error deleting custom template:", error);
      throw error;
    }
  }

  /**
   * Track template usage
   */
  static async trackTemplateUsage(
    templateId: string,
    organizationId: string,
  ): Promise<void> {
    try {
      await db.reportTemplateUsage.upsert({
        where: {
          templateId_organizationId: {
            templateId: templateId,
            organizationId: organizationId,
          },
        },
        update: {
          usageCount: { increment: 1 },
          lastUsed: new Date(),
        },
        create: {
          templateId: templateId,
          organizationId: organizationId,
          usageCount: 1,
          lastUsed: new Date(),
        },
      });
    } catch (error) {
      console.error("Error tracking template usage:", error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Get template usage statistics
   */
  static async getTemplateUsageStats(organizationId: string) {
    const stats = await db.reportTemplateUsage.findMany({
      where: { organizationId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            type: true,
            category: true,
            isSystem: true,
          },
        },
      },
      orderBy: { usageCount: "desc" },
      take: 10,
    });

    return stats.map((stat) => ({
      templateId: stat.templateId,
      templateName: stat.template.name,
      templateType: stat.template.type,
      templateCategory: stat.template.category,
      isSystem: stat.template.isSystem,
      usageCount: stat.usageCount,
      lastUsed: stat.lastUsed,
    }));
  }

  /**
   * Clone template
   */
  static async cloneTemplate(
    templateId: string,
    userId: string,
    organizationId: string,
    newName: string,
  ): Promise<ReportTemplate> {
    try {
      const originalTemplate = await this.getTemplateById(
        templateId,
        organizationId,
      );

      if (!originalTemplate) {
        throw new Error("Template not found");
      }

      const cloned = await this.createCustomTemplate(userId, organizationId, {
        name: newName,
        description: `Cloned from ${originalTemplate.name}`,
        type: originalTemplate.type,
        category: originalTemplate.category,
        config: originalTemplate.config,
        isActive: true,
      });

      // Log the cloning
      await AuditService.log({
        action: "report_template_cloned",
        userId: userId,
        organizationId: organizationId,
        resource: "report_template",
        resourceId: cloned.id,
        category: "system",
        severity: "info",
        status: "success",
        ipAddress: "127.0.0.1",
        metadata: {
          originalTemplateId: templateId,
          originalTemplateName: originalTemplate.name,
          newName: newName,
        },
      });

      return cloned;
    } catch (error) {
      console.error("Error cloning template:", error);
      throw error;
    }
  }
}
