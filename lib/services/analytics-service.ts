import { db } from "@/lib/db";
import {
  AnalyticsDashboardWithRelations,
  CreateDashboardRequest,
  UpdateDashboardRequest,
  DashboardFilters,
  PaginatedDashboards,
  DashboardStats,
  CreateWidgetRequest,
  UpdateWidgetRequest,
  DashboardWidget,
  CreateQueryRequest,
  ExecuteQueryRequest,
  QueryResult,
  AnalyticsQuery,
  ShareDashboardRequest,
  DashboardShare,
  MetricCategory,
  WidgetDataResponse,
} from "@/lib/types/analytics";
import { MembershipService } from "./organization-service";
import { AuditService } from "./audit";
import { AuditLogCategory, AuditLogSeverity } from "@/lib/types/audit";

export class AnalyticsService {
  // ============================================================================
  // DASHBOARD MANAGEMENT
  // ============================================================================

  // Create a new analytics dashboard
  static async createDashboard(
    userId: string,
    data: CreateDashboardRequest,
  ): Promise<AnalyticsDashboardWithRelations> {
    // Verify organization access if provided
    if (data.organizationId) {
      const hasAccess = await MembershipService.hasUserAccess(
        data.organizationId,
        userId,
      );
      if (!hasAccess) {
        throw new Error("Access denied to organization");
      }
    }

    const dashboard = await db.analyticsDashboard.create({
      data: {
        name: data.name,
        description: data.description,
        layout: JSON.stringify(
          data.layout || {
            columns: 12,
            rows: 8,
            gap: 16,
            padding: 16,
            responsive: true,
          },
        ),
        settings: JSON.stringify(
          data.settings || {
            theme: "light",
            showHeader: true,
            showFilters: true,
            allowExport: true,
            allowShare: true,
            timezone: "UTC",
            dateFormat: "YYYY-MM-DD",
            numberFormat: "en-US",
          },
        ),
        isPublic: data.isPublic || false,
        isTemplate: data.isTemplate || false,
        tags: JSON.stringify(data.tags || []),
        createdBy: userId,
        organizationId: data.organizationId,
      },
      include: {
        widgets: true,
        permissions: true,
        shares: true,
      },
    });

    // Log dashboard creation
    await AuditService.log({
      action: "CREATE",
      resource: "AnalyticsDashboard",
      resourceId: dashboard.id,
      userId,
      organizationId: data.organizationId,
      newValues: {
        name: dashboard.name,
        isPublic: dashboard.isPublic,
        isTemplate: dashboard.isTemplate,
      },
      category: AuditLogCategory.DATA,
      severity: AuditLogSeverity.INFO,
    });

    return this.transformDashboard(dashboard);
  }

  // Get dashboard by ID
  static async getDashboardById(
    dashboardId: string,
    userId: string,
    organizationId?: string,
  ): Promise<AnalyticsDashboardWithRelations | null> {
    const dashboard = await db.analyticsDashboard.findFirst({
      where: {
        id: dashboardId,
        OR: [
          { createdBy: userId },
          { isPublic: true },
          {
            permissions: {
              some: {
                userId: userId,
                permissionType: {
                  in: ["view", "edit", "admin"],
                },
              },
            },
          },
          ...(organizationId
            ? [
                {
                  organizationId: organizationId,
                  organization: {
                    members: {
                      some: {
                        userId: userId,
                      },
                    },
                  },
                },
              ]
            : []),
        ],
      },
      include: {
        widgets: {
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        },
        permissions: true,
        shares: {
          where: { isActive: true },
        },
      },
    });

    if (!dashboard) return null;

    // Update view count and last viewed
    await db.analyticsDashboard.update({
      where: { id: dashboardId },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });

    return this.transformDashboard(dashboard);
  }

  // List dashboards with filters and pagination
  static async getDashboards(
    userId: string,
    organizationId?: string,
    filters: DashboardFilters = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedDashboards> {
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      OR: [
        { createdBy: userId },
        { isPublic: true },
        {
          permissions: {
            some: {
              userId: userId,
              permissionType: {
                in: ["view", "edit", "admin"],
              },
            },
          },
        },
      ],
    };

    // Add organization filter
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    // Add search filter
    if (filters.search) {
      whereClause.OR.push({
        name: {
          contains: filters.search,
          mode: "insensitive",
        },
      });
      whereClause.OR.push({
        description: {
          contains: filters.search,
          mode: "insensitive",
        },
      });
    }

    // Add other filters
    if (filters.isPublic !== undefined) {
      whereClause.isPublic = filters.isPublic;
    }
    if (filters.isTemplate !== undefined) {
      whereClause.isTemplate = filters.isTemplate;
    }
    if (filters.createdBy) {
      whereClause.createdBy = filters.createdBy;
    }
    if (filters.dateRange) {
      whereClause.createdAt = {
        gte: filters.dateRange.from,
        lte: filters.dateRange.to,
      };
    }

    // Execute queries
    const [dashboards, total] = await Promise.all([
      db.analyticsDashboard.findMany({
        where: whereClause,
        include: {
          widgets: true,
          permissions: true,
          shares: {
            where: { isActive: true },
          },
        },
        orderBy: [{ lastViewedAt: "desc" }, { updatedAt: "desc" }],
        skip,
        take: limit,
      }),
      db.analyticsDashboard.count({ where: whereClause }),
    ]);

    return {
      dashboards: dashboards.map((d) => this.transformDashboard(d)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Update dashboard
  static async updateDashboard(
    dashboardId: string,
    userId: string,
    data: UpdateDashboardRequest,
    organizationId?: string,
  ): Promise<AnalyticsDashboardWithRelations> {
    // Check permissions
    const hasPermission = await this.hasEditPermission(
      dashboardId,
      userId,
      organizationId,
    );
    if (!hasPermission) {
      throw new Error("Permission denied");
    }

    // Get current dashboard for audit log
    const currentDashboard = await db.analyticsDashboard.findUnique({
      where: { id: dashboardId },
    });

    if (!currentDashboard) {
      throw new Error("Dashboard not found");
    }

    const updatedDashboard = await db.analyticsDashboard.update({
      where: { id: dashboardId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.layout && { layout: JSON.stringify(data.layout) }),
        ...(data.settings && { settings: JSON.stringify(data.settings) }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        ...(data.tags && { tags: JSON.stringify(data.tags) }),
      },
      include: {
        widgets: true,
        permissions: true,
        shares: {
          where: { isActive: true },
        },
      },
    });

    // Log dashboard update
    await AuditService.log({
      action: "UPDATE",
      resource: "AnalyticsDashboard",
      resourceId: dashboardId,
      userId,
      organizationId: currentDashboard.organizationId || undefined,
      oldValues: {
        name: currentDashboard.name,
        isPublic: currentDashboard.isPublic,
      },
      newValues: {
        name: updatedDashboard.name,
        isPublic: updatedDashboard.isPublic,
      },
      category: AuditLogCategory.DATA,
      severity: AuditLogSeverity.INFO,
    });

    return this.transformDashboard(updatedDashboard);
  }

  // Delete dashboard
  static async deleteDashboard(
    dashboardId: string,
    userId: string,
    organizationId?: string,
  ): Promise<void> {
    // Check permissions
    const hasPermission = await this.hasAdminPermission(
      dashboardId,
      userId,
      organizationId,
    );
    if (!hasPermission) {
      throw new Error("Permission denied");
    }

    const dashboard = await db.analyticsDashboard.findUnique({
      where: { id: dashboardId },
    });

    if (!dashboard) {
      throw new Error("Dashboard not found");
    }

    await db.analyticsDashboard.delete({
      where: { id: dashboardId },
    });

    // Log dashboard deletion
    await AuditService.log({
      action: "DELETE",
      resource: "AnalyticsDashboard",
      resourceId: dashboardId,
      userId,
      organizationId: dashboard.organizationId || undefined,
      oldValues: {
        name: dashboard.name,
        isPublic: dashboard.isPublic,
      },
      category: AuditLogCategory.DATA,
      severity: AuditLogSeverity.INFO,
    });
  }

  // ============================================================================
  // WIDGET MANAGEMENT
  // ============================================================================

  // Create widget
  static async createWidget(
    userId: string,
    data: CreateWidgetRequest,
  ): Promise<DashboardWidget> {
    // Check dashboard permissions
    const hasPermission = await this.hasEditPermission(
      data.dashboardId,
      userId,
    );
    if (!hasPermission) {
      throw new Error("Permission denied");
    }

    const widget = await db.dashboardWidget.create({
      data: {
        dashboardId: data.dashboardId,
        type: data.type,
        title: data.title,
        description: data.description,
        position: JSON.stringify(data.position),
        config: JSON.stringify(data.config || {}),
        dataSource: JSON.stringify(data.dataSource),
        style: JSON.stringify(data.style || {}),
        refreshRate: data.refreshRate,
      },
    });

    return this.transformWidget(widget);
  }

  // Update widget
  static async updateWidget(
    widgetId: string,
    userId: string,
    data: UpdateWidgetRequest,
  ): Promise<DashboardWidget> {
    const widget = await db.dashboardWidget.findUnique({
      where: { id: widgetId },
      include: { dashboard: true },
    });

    if (!widget) {
      throw new Error("Widget not found");
    }

    // Check dashboard permissions
    const hasPermission = await this.hasEditPermission(
      widget.dashboardId,
      userId,
    );
    if (!hasPermission) {
      throw new Error("Permission denied");
    }

    const updatedWidget = await db.dashboardWidget.update({
      where: { id: widgetId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.position && { position: JSON.stringify(data.position) }),
        ...(data.config && { config: JSON.stringify(data.config) }),
        ...(data.dataSource && { dataSource: JSON.stringify(data.dataSource) }),
        ...(data.style && { style: JSON.stringify(data.style) }),
        ...(data.refreshRate !== undefined && {
          refreshRate: data.refreshRate,
        }),
        ...(data.isVisible !== undefined && { isVisible: data.isVisible }),
      },
    });

    return this.transformWidget(updatedWidget);
  }

  // Delete widget
  static async deleteWidget(widgetId: string, userId: string): Promise<void> {
    const widget = await db.dashboardWidget.findUnique({
      where: { id: widgetId },
      include: { dashboard: true },
    });

    if (!widget) {
      throw new Error("Widget not found");
    }

    // Check dashboard permissions
    const hasPermission = await this.hasEditPermission(
      widget.dashboardId,
      userId,
    );
    if (!hasPermission) {
      throw new Error("Permission denied");
    }

    await db.dashboardWidget.delete({
      where: { id: widgetId },
    });
  }

  // Get widget data
  static async getWidgetData(
    widgetId: string,
    userId: string,
    parameters?: Record<string, any>,
  ): Promise<WidgetDataResponse> {
    const widget = await db.dashboardWidget.findUnique({
      where: { id: widgetId },
      include: { dashboard: true },
    });

    if (!widget) {
      throw new Error("Widget not found");
    }

    // Check dashboard permissions
    const hasPermission = await this.hasViewPermission(
      widget.dashboardId,
      userId,
    );
    if (!hasPermission) {
      throw new Error("Permission denied");
    }

    const dataSource = JSON.parse(widget.dataSource);
    const startTime = Date.now();

    let data: any[] = [];
    let columns: any[] = [];

    try {
      switch (dataSource.type) {
        case "query":
          if (dataSource.queryId) {
            const result = await this.executeQuery(userId, {
              queryId: dataSource.queryId,
              parameters,
              useCache: dataSource.cache,
            });
            data = result.data;
            columns = result.columns;
          }
          break;

        case "api":
          // Execute API call
          const response = await fetch(dataSource.endpoint, {
            method: dataSource.method || "GET",
            headers: dataSource.headers || {},
            ...(dataSource.method === "POST" && {
              body: JSON.stringify(dataSource.params),
            }),
          });
          const apiData = await response.json();
          data = Array.isArray(apiData) ? apiData : [apiData];
          columns =
            data.length > 0
              ? Object.keys(data[0]).map((key) => ({
                  name: key,
                  type: typeof data[0][key] === "number" ? "number" : "string",
                  nullable: false,
                }))
              : [];
          break;

        case "static":
          data = dataSource.data || [];
          columns =
            data.length > 0
              ? Object.keys(data[0]).map((key) => ({
                  name: key,
                  type: typeof data[0][key] === "number" ? "number" : "string",
                  nullable: false,
                }))
              : [];
          break;

        default:
          throw new Error(`Unsupported data source type: ${dataSource.type}`);
      }
    } catch (error) {
      console.error("Error fetching widget data:", error);
      throw new Error("Failed to fetch widget data");
    }

    const executionTime = Date.now() - startTime;

    return {
      data,
      columns,
      metadata: {
        rowCount: data.length,
        executionTime,
        cached: false,
        timestamp: new Date(),
        source: dataSource.type,
      },
    };
  }

  // ============================================================================
  // QUERY MANAGEMENT
  // ============================================================================

  // Create analytics query
  static async createQuery(
    userId: string,
    data: CreateQueryRequest,
  ): Promise<AnalyticsQuery> {
    // Verify organization access if provided
    if (data.organizationId) {
      const hasAccess = await MembershipService.hasUserAccess(
        data.organizationId,
        userId,
      );
      if (!hasAccess) {
        throw new Error("Access denied to organization");
      }
    }

    const query = await db.analyticsQuery.create({
      data: {
        name: data.name,
        description: data.description,
        query: data.query,
        queryType: data.queryType || "sql",
        parameters: JSON.stringify(data.parameters || []),
        cacheEnabled: data.cacheEnabled !== false,
        cacheTtl: data.cacheTtl || 300,
        createdBy: userId,
        organizationId: data.organizationId,
        isPublic: data.isPublic || false,
      },
    });

    return this.transformQuery(query);
  }

  // Execute analytics query
  static async executeQuery(
    userId: string,
    request: ExecuteQueryRequest,
  ): Promise<QueryResult> {
    const query = await db.analyticsQuery.findUnique({
      where: { id: request.queryId },
    });

    if (!query) {
      throw new Error("Query not found");
    }

    // Check permissions
    const hasAccess =
      query.createdBy === userId ||
      query.isPublic ||
      (query.organizationId &&
        (await MembershipService.hasUserAccess(query.organizationId, userId)));

    if (!hasAccess) {
      throw new Error("Access denied to query");
    }

    const startTime = Date.now();

    // For now, return mock data - in production, this would execute against your data warehouse
    const mockData = this.generateMockQueryData(
      query.queryType,
      request.parameters,
    );

    const executionTime = Date.now() - startTime;

    // Update query statistics
    await db.analyticsQuery.update({
      where: { id: request.queryId },
      data: {
        lastExecutedAt: new Date(),
        executionCount: { increment: 1 },
        executionTime,
      },
    });

    return {
      data: mockData.data,
      columns: mockData.columns,
      rowCount: mockData.data.length,
      executionTime,
      cached: false,
      timestamp: new Date(),
    };
  }

  // ============================================================================
  // DASHBOARD SHARING
  // ============================================================================

  // Share dashboard
  static async shareDashboard(
    dashboardId: string,
    userId: string,
    data: ShareDashboardRequest,
  ): Promise<DashboardShare> {
    // Check permissions
    const hasPermission = await this.hasAdminPermission(dashboardId, userId);
    if (!hasPermission) {
      throw new Error("Permission denied");
    }

    const shareToken = this.generateShareToken();

    const share = await db.dashboardShare.create({
      data: {
        dashboardId,
        shareToken,
        shareType: data.shareType,
        password: data.password,
        allowedDomains: data.allowedDomains
          ? JSON.stringify(data.allowedDomains)
          : null,
        maxViews: data.maxViews,
        expiresAt: data.expiresAt,
        createdBy: userId,
      },
    });

    return this.transformShare(share);
  }

  // ============================================================================
  // ANALYTICS METRICS
  // ============================================================================

  // Record analytics metric
  static async recordMetric(
    name: string,
    category: MetricCategory,
    value: number,
    options: {
      unit?: string;
      dimensions?: Record<string, any>;
      organizationId?: string;
      userId?: string;
      resourceId?: string;
      resourceType?: string;
      source?: string;
    } = {},
  ): Promise<void> {
    await db.analyticsMetric.create({
      data: {
        name,
        category,
        value,
        unit: options.unit,
        dimensions: JSON.stringify(options.dimensions || {}),
        organizationId: options.organizationId,
        userId: options.userId,
        resourceId: options.resourceId,
        resourceType: options.resourceType,
        source: options.source,
      },
    });
  }

  // Get dashboard statistics
  static async getDashboardStats(
    userId: string,
    organizationId?: string,
  ): Promise<DashboardStats> {
    const whereClause: any = {
      OR: [
        { createdBy: userId },
        { isPublic: true },
        {
          permissions: {
            some: {
              userId: userId,
              permissionType: {
                in: ["view", "edit", "admin"],
              },
            },
          },
        },
      ],
    };

    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    const [
      totalDashboards,
      publicDashboards,
      privateDashboards,
      templateDashboards,
      totalViews,
      popularDashboards,
    ] = await Promise.all([
      db.analyticsDashboard.count({ where: whereClause }),
      db.analyticsDashboard.count({
        where: { ...whereClause, isPublic: true },
      }),
      db.analyticsDashboard.count({
        where: { ...whereClause, isPublic: false },
      }),
      db.analyticsDashboard.count({
        where: { ...whereClause, isTemplate: true },
      }),
      db.analyticsDashboard.aggregate({
        where: whereClause,
        _sum: { viewCount: true },
      }),
      db.analyticsDashboard.findMany({
        where: whereClause,
        orderBy: { viewCount: "desc" },
        take: 5,
      }),
    ]);

    return {
      totalDashboards,
      publicDashboards,
      privateDashboards,
      templateDashboards,
      totalViews: totalViews._sum.viewCount || 0,
      recentActivity: [], // Would be populated from audit logs
      popularDashboards: popularDashboards.map((d) =>
        this.transformDashboard(d),
      ),
      topTags: [], // Would be calculated from dashboard tags
    };
  }

  // ============================================================================
  // PERMISSION HELPERS
  // ============================================================================

  private static async hasViewPermission(
    dashboardId: string,
    userId: string,
    organizationId?: string,
  ): Promise<boolean> {
    const dashboard = await db.analyticsDashboard.findFirst({
      where: {
        id: dashboardId,
        OR: [
          { createdBy: userId },
          { isPublic: true },
          {
            permissions: {
              some: {
                userId: userId,
                permissionType: {
                  in: ["view", "edit", "admin"],
                },
              },
            },
          },
          ...(organizationId
            ? [
                {
                  organizationId: organizationId,
                  organization: {
                    members: {
                      some: {
                        userId: userId,
                      },
                    },
                  },
                },
              ]
            : []),
        ],
      },
    });

    return !!dashboard;
  }

  private static async hasEditPermission(
    dashboardId: string,
    userId: string,
    organizationId?: string,
  ): Promise<boolean> {
    const dashboard = await db.analyticsDashboard.findFirst({
      where: {
        id: dashboardId,
        OR: [
          { createdBy: userId },
          {
            permissions: {
              some: {
                userId: userId,
                permissionType: {
                  in: ["edit", "admin"],
                },
              },
            },
          },
          ...(organizationId
            ? [
                {
                  organizationId: organizationId,
                  organization: {
                    members: {
                      some: {
                        userId: userId,
                        role: {
                          in: ["owner", "admin"],
                        },
                      },
                    },
                  },
                },
              ]
            : []),
        ],
      },
    });

    return !!dashboard;
  }

  private static async hasAdminPermission(
    dashboardId: string,
    userId: string,
    organizationId?: string,
  ): Promise<boolean> {
    const dashboard = await db.analyticsDashboard.findFirst({
      where: {
        id: dashboardId,
        OR: [
          { createdBy: userId },
          {
            permissions: {
              some: {
                userId: userId,
                permissionType: "admin",
              },
            },
          },
          ...(organizationId
            ? [
                {
                  organizationId: organizationId,
                  organization: {
                    members: {
                      some: {
                        userId: userId,
                        role: "owner",
                      },
                    },
                  },
                },
              ]
            : []),
        ],
      },
    });

    return !!dashboard;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private static transformDashboard(
    dashboard: any,
  ): AnalyticsDashboardWithRelations {
    return {
      ...dashboard,
      layout: JSON.parse(dashboard.layout),
      settings: JSON.parse(dashboard.settings),
      tags: JSON.parse(dashboard.tags),
      widgets:
        dashboard.widgets?.map((w: any) => this.transformWidget(w)) || [],
      shares: dashboard.shares?.map((s: any) => this.transformShare(s)) || [],
    };
  }

  private static transformWidget(widget: any): DashboardWidget {
    return {
      ...widget,
      position: JSON.parse(widget.position),
      config: JSON.parse(widget.config),
      dataSource: JSON.parse(widget.dataSource),
      style: JSON.parse(widget.style),
    };
  }

  private static transformQuery(query: any): AnalyticsQuery {
    return {
      ...query,
      parameters: JSON.parse(query.parameters),
    };
  }

  private static transformShare(share: any): DashboardShare {
    return {
      ...share,
      allowedDomains: share.allowedDomains
        ? JSON.parse(share.allowedDomains)
        : undefined,
    };
  }

  private static generateShareToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private static generateMockQueryData(
    _queryType: string,
    _parameters?: Record<string, any>,
  ) {
    // Generate mock data based on query type
    const mockData = [];
    const rowCount = Math.floor(Math.random() * 50) + 10;

    for (let i = 0; i < rowCount; i++) {
      mockData.push({
        id: i + 1,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        value: Math.floor(Math.random() * 1000) + 100,
        category: ["A", "B", "C", "D"][Math.floor(Math.random() * 4)],
        status: ["active", "inactive", "pending"][
          Math.floor(Math.random() * 3)
        ],
      });
    }

    const columns = [
      { name: "id", type: "number" as const, nullable: false },
      { name: "date", type: "date" as const, nullable: false },
      { name: "value", type: "number" as const, nullable: false },
      { name: "category", type: "string" as const, nullable: false },
      { name: "status", type: "string" as const, nullable: false },
    ];

    return { data: mockData, columns };
  }
}
