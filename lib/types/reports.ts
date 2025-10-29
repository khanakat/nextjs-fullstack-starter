import {
  Report,
  Template,
  TemplateCategory,
  ExportJob,
  ReportPermission,
} from "@prisma/client";

// Base types from Prisma
export type ReportType = Report;
export type TemplateType = Template;
export type TemplateCategoryType = TemplateCategory;
export type ExportJobType = ExportJob;
export type ReportPermissionType = ReportPermission;

// Extended types with relations
export interface ReportWithRelations extends Report {
  template?: Template | null;
  permissions?: ReportPermission[];
  exportJobs?: ExportJob[];
}

// Alias for backward compatibility
export type ReportWithTemplate = ReportWithRelations;

export interface TemplateWithRelations extends Template {
  category?: TemplateCategory | null;
  reports?: Report[];
}

export interface TemplateCategoryWithTemplates extends TemplateCategory {
  templates?: Template[];
}

export interface ExportJobWithReport extends ExportJob {
  report?: Report;
}

// Report configuration types
export interface ReportConfig {
  title: string;
  description?: string;
  templateId?: string;
  filters: Record<string, any>;
  parameters: Record<string, any>;
  layout: ReportLayout;
  styling: ReportStyling;
}

export interface ReportLayout {
  components: ReportComponent[];
  grid: GridLayout;
}

export interface ReportComponent {
  id: string;
  type: ComponentType;
  position: Position;
  size: Size;
  config: ComponentConfig;
}

export interface GridLayout {
  columns: number;
  rows: number;
  gap: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ComponentConfig {
  title?: string;
  dataSource?: string;
  chartType?: ChartType;
  filters?: Record<string, any>;
  styling?: ComponentStyling;
}

export interface ReportStyling {
  theme: "light" | "dark";
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
}

export interface ComponentStyling {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  margin?: number;
}

// Enums
export enum ComponentType {
  CHART = "CHART",
  TABLE = "TABLE",
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  METRIC = "METRIC",
  FILTER = "FILTER",
}

export enum ChartType {
  BAR = "BAR",
  LINE = "LINE",
  PIE = "PIE",
  AREA = "AREA",
  SCATTER = "SCATTER",
  DONUT = "DONUT",
}

export enum ExportFormat {
  PDF = "PDF",
  EXCEL = "EXCEL",
  CSV = "CSV",
  PNG = "PNG",
}

export enum ReportStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum ExportStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum PermissionLevel {
  VIEW = "VIEW",
  EDIT = "EDIT",
  ADMIN = "ADMIN",
}

// API request/response types
export interface CreateReportRequest {
  title: string;
  description?: string;
  templateId?: string;
  config: ReportConfig;
  isPublic?: boolean;
}

export interface UpdateReportRequest {
  title?: string;
  description?: string;
  config?: ReportConfig;
  isPublic?: boolean;
  status?: ReportStatus;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  categoryId?: string;
  config: ReportConfig;
  isPublic?: boolean;
}

export interface ExportReportRequest {
  reportId: string;
  format: ExportFormat;
  options?: ExportOptions;
}

export interface ExportOptions {
  includeCharts?: boolean;
  includeData?: boolean;
  pageSize?: "A4" | "A3" | "LETTER";
  orientation?: "portrait" | "landscape";
  quality?: "low" | "medium" | "high";
}

export interface ReportFilters {
  search?: string;
  status?: ReportStatus;
  templateId?: string;
  createdBy?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  tags?: string[];
}

export interface TemplateFilters {
  search?: string;
  categoryId?: string;
  isPublic?: boolean;
  createdBy?: string;
}

// Dashboard types
export interface ReportsDashboardData {
  totalReports: number;
  totalTemplates: number;
  recentReports: ReportWithRelations[];
  popularTemplates: TemplateWithRelations[];
  exportJobs: ExportJobWithReport[];
  stats: ReportStats;
}

export interface ReportStats {
  reportsCreatedThisMonth: number;
  reportsCreatedLastMonth: number;
  totalExports: number;
  averageReportViews: number;
}

// Builder types
export interface ReportBuilderState {
  report: ReportConfig;
  selectedComponent?: string;
  isDragging: boolean;
  previewMode: boolean;
  unsavedChanges: boolean;
}

export interface DragItem {
  id: string;
  type: ComponentType;
  component?: ReportComponent;
}

// Validation schemas (for use with zod)
export interface ReportValidation {
  title: string;
  description?: string;
  templateId?: string;
  config: any; // Will be validated separately
}

export interface TemplateValidation {
  name: string;
  description?: string;
  categoryId?: string;
  config: any; // Will be validated separately
}

// Utility types
export type ReportPermissions = {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canShare: boolean;
};

export type TemplatePermissions = {
  canView: boolean;
  canUse: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

// Error types
export interface ReportError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Pagination types
export interface PaginatedReports {
  reports: ReportWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedTemplates {
  templates: TemplateWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
