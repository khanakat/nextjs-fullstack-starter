// ============================================================================
// ANALYTICS SYSTEM TYPES
// ============================================================================

// Base analytics dashboard interface
export interface AnalyticsDashboard {
  id: string;
  name: string;
  description?: string;
  layout: DashboardLayout;
  settings: DashboardSettings;
  isPublic: boolean;
  isTemplate: boolean;
  tags: string[];
  createdBy: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastViewedAt?: Date;
  viewCount: number;
}

// Dashboard with relations
export interface AnalyticsDashboardWithRelations extends AnalyticsDashboard {
  widgets: DashboardWidget[];
  permissions: DashboardPermission[];
  shares: DashboardShare[];
}

// Dashboard layout configuration
export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
  padding: number;
  responsive: boolean;
  breakpoints?: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

// Dashboard settings
export interface DashboardSettings {
  refreshRate?: number; // Auto-refresh interval in seconds
  theme: "light" | "dark" | "auto";
  showHeader: boolean;
  showFilters: boolean;
  allowExport: boolean;
  allowShare: boolean;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  filters?: DashboardFilter[];
}

// Dashboard filter
export interface DashboardFilter {
  id: string;
  name: string;
  type: "date" | "select" | "multiselect" | "text" | "number";
  field: string;
  value: any;
  options?: FilterOption[];
  required: boolean;
}

// Filter option
export interface FilterOption {
  label: string;
  value: any;
}

// Dashboard widget interface
export interface DashboardWidget {
  id: string;
  dashboardId: string;
  type: WidgetType;
  title: string;
  description?: string;
  position: WidgetPosition;
  config: WidgetConfig;
  dataSource: DataSourceConfig;
  style: WidgetStyle;
  refreshRate?: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Widget types
export type WidgetType =
  | "chart"
  | "kpi"
  | "table"
  | "text"
  | "filter"
  | "metric"
  | "progress"
  | "gauge"
  | "heatmap"
  | "map"
  | "line"
  | "bar"
  | "pie"
  | "area";

// Widget position
export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

// Widget configuration
export interface WidgetConfig {
  chartType?: ChartType;
  aggregation?: AggregationType;
  groupBy?: string[];
  sortBy?: SortConfig[];
  limit?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  showDataLabels?: boolean;
  colors?: string[];
  thresholds?: Threshold[];
  format?: FormatConfig;
  animation?: AnimationConfig;
  style?: {
    strokeDasharray?: string;
  };
}

// Chart types
export type ChartType =
  | "line"
  | "bar"
  | "pie"
  | "doughnut"
  | "area"
  | "scatter"
  | "bubble"
  | "radar"
  | "polar"
  | "heatmap"
  | "treemap"
  | "sankey"
  | "funnel";

// Aggregation types
export type AggregationType =
  | "sum"
  | "avg"
  | "count"
  | "min"
  | "max"
  | "median"
  | "mode"
  | "distinct"
  | "percentile";

// Sort configuration
export interface SortConfig {
  field: string;
  direction: "asc" | "desc";
}

// Threshold configuration
export interface Threshold {
  value: number;
  color: string;
  label?: string;
  operator: ">" | "<" | ">=" | "<=" | "=" | "!=";
}

// Format configuration
export interface FormatConfig {
  type: "number" | "currency" | "percentage" | "date" | "time" | "datetime";
  decimals?: number;
  currency?: string;
  locale?: string;
  prefix?: string;
  suffix?: string;
}

// Animation configuration
export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";
  delay?: number;
}

// Data source configuration
export interface DataSourceConfig {
  type: "query" | "api" | "static" | "realtime";
  queryId?: string;
  endpoint?: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any[];
  refreshInterval?: number;
  cache?: boolean;
  cacheTtl?: number;
}

// Widget style
export interface WidgetStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  shadow?: boolean;
  opacity?: number;
}

// Analytics query interface
export interface AnalyticsQuery {
  id: string;
  name: string;
  description?: string;
  query: string;
  queryType: QueryType;
  parameters: QueryParameter[];
  cacheEnabled: boolean;
  cacheTtl: number;
  executionTime?: number;
  createdBy: string;
  organizationId?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastExecutedAt?: Date;
  executionCount: number;
}

// Query types
export type QueryType = "sql" | "aggregation" | "custom";

// Query parameter
export interface QueryParameter {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "array";
  defaultValue?: any;
  required: boolean;
  description?: string;
  validation?: ValidationRule[];
}

// Validation rule
export interface ValidationRule {
  type: "min" | "max" | "pattern" | "enum";
  value: any;
  message?: string;
}

// Dashboard permission interface
export interface DashboardPermission {
  id: string;
  dashboardId: string;
  userId: string;
  permissionType: PermissionType;
  grantedAt: Date;
  grantedBy: string;
}

// Permission types
export type PermissionType = "view" | "edit" | "admin";

// Dashboard share interface
export interface DashboardShare {
  id: string;
  dashboardId: string;
  shareToken: string;
  shareType: ShareType;
  isActive: boolean;
  password?: string;
  allowedDomains?: string[];
  maxViews?: number;
  currentViews: number;
  expiresAt?: Date;
  createdBy: string;
  createdAt: Date;
  lastAccessedAt?: Date;
}

// Share types
export type ShareType = "view" | "embed";

// Analytics metric interface
export interface AnalyticsMetric {
  id: string;
  name: string;
  category: MetricCategory;
  value: number;
  unit?: string;
  dimensions: Record<string, any>;
  organizationId?: string;
  userId?: string;
  resourceId?: string;
  resourceType?: string;
  timestamp: Date;
  source?: string;
}

// Metric categories
export type MetricCategory = "system" | "business" | "user" | "performance";

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

// Create dashboard request
export interface CreateDashboardRequest {
  name: string;
  description?: string;
  layout?: Partial<DashboardLayout>;
  settings?: Partial<DashboardSettings>;
  isPublic?: boolean;
  isTemplate?: boolean;
  tags?: string[];
  organizationId?: string;
}

// Update dashboard request
export interface UpdateDashboardRequest {
  name?: string;
  description?: string;
  layout?: Partial<DashboardLayout>;
  settings?: Partial<DashboardSettings>;
  isPublic?: boolean;
  tags?: string[];
}

// Create widget request
export interface CreateWidgetRequest {
  dashboardId: string;
  type: WidgetType;
  title: string;
  description?: string;
  position: WidgetPosition;
  config?: Partial<WidgetConfig>;
  dataSource: DataSourceConfig;
  style?: Partial<WidgetStyle>;
  refreshRate?: number;
}

// Update widget request
export interface UpdateWidgetRequest {
  title?: string;
  description?: string;
  position?: WidgetPosition;
  config?: Partial<WidgetConfig>;
  dataSource?: DataSourceConfig;
  style?: Partial<WidgetStyle>;
  refreshRate?: number;
  isVisible?: boolean;
}

// Create query request
export interface CreateQueryRequest {
  name: string;
  description?: string;
  query: string;
  queryType?: QueryType;
  parameters?: QueryParameter[];
  cacheEnabled?: boolean;
  cacheTtl?: number;
  organizationId?: string;
  isPublic?: boolean;
}

// Update query request
export interface UpdateQueryRequest {
  name?: string;
  description?: string;
  query?: string;
  queryType?: QueryType;
  parameters?: QueryParameter[];
  cacheEnabled?: boolean;
  cacheTtl?: number;
  isPublic?: boolean;
}

// Execute query request
export interface ExecuteQueryRequest {
  queryId: string;
  parameters?: Record<string, any>;
  useCache?: boolean;
}

// Query result
export interface QueryResult {
  data: any[];
  columns: QueryColumn[];
  rowCount: number;
  executionTime: number;
  cached: boolean;
  timestamp: Date;
}

// Query column
export interface QueryColumn {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "json";
  nullable: boolean;
}

// Dashboard filters
export interface DashboardFilters {
  search?: string;
  tags?: string[];
  isPublic?: boolean;
  isTemplate?: boolean;
  createdBy?: string;
  organizationId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// Paginated dashboards
export interface PaginatedDashboards {
  dashboards: AnalyticsDashboardWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dashboard statistics
export interface DashboardStats {
  totalDashboards: number;
  publicDashboards: number;
  privateDashboards: number;
  templateDashboards: number;
  totalViews: number;
  recentActivity: DashboardActivity[];
  popularDashboards: AnalyticsDashboard[];
  topTags: TagStats[];
}

// Dashboard activity
export interface DashboardActivity {
  id: string;
  action: "created" | "updated" | "viewed" | "shared" | "deleted";
  dashboardId: string;
  dashboardName: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

// Tag statistics
export interface TagStats {
  tag: string;
  count: number;
}

// Share dashboard request
export interface ShareDashboardRequest {
  shareType: ShareType;
  password?: string;
  allowedDomains?: string[];
  maxViews?: number;
  expiresAt?: Date;
}

// Export dashboard request
export interface ExportDashboardRequest {
  format: "pdf" | "png" | "svg" | "excel" | "csv";
  options?: ExportOptions;
}

// Export options
export interface ExportOptions {
  includeData?: boolean;
  includeCharts?: boolean;
  pageSize?: "A4" | "A3" | "letter" | "legal";
  orientation?: "portrait" | "landscape";
  quality?: "low" | "medium" | "high";
  theme?: "light" | "dark";
}

// Real-time data update
export interface RealtimeDataUpdate {
  widgetId: string;
  data: any[];
  timestamp: Date;
  source: string;
}

// Widget data response
export interface WidgetDataResponse {
  data: any[];
  columns: QueryColumn[];
  metadata: {
    rowCount: number;
    executionTime: number;
    cached: boolean;
    timestamp: Date;
    source: string;
  };
}
