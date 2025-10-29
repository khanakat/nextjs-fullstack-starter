/**
 * Consolidated TypeScript Types
 *
 * Archivo central para todos los tipos TypeScript del proyecto.
 * Organizado por categorías para mejor mantenimiento y reutilización.
 */

// Re-export all types from individual modules
// Note: Only export existing type modules
// export * from "./auth";
// export * from "./api";
// export * from "./database";
// export * from "./ui";
// export * from "./security";
// export * from "./monitoring";
// export * from "./workflow";
// export * from "./integration";
// export * from "./notification";
// export * from "./file";

// Common utility types
export type ID = string;
export type Timestamp = Date;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Timestamp;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ErrorResponse extends ApiResponse {
  success: false;
  error: string;
  details?: Record<string, any>;
  code?: string;
}

// Common entity patterns
export interface BaseEntity {
  id: ID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SoftDeletableEntity extends BaseEntity {
  deletedAt?: Timestamp | null;
}

export interface UserOwnedEntity extends BaseEntity {
  userId: ID;
}

export interface OrganizationOwnedEntity extends BaseEntity {
  organizationId: ID;
}

// Status enums
export enum Status {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
  SUSPENDED = "suspended",
  DELETED = "deleted",
}

export enum Priority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum Severity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

// Search and filter types
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "select"
    | "textarea"
    | "checkbox"
    | "radio"
    | "file"
    | "date";
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => boolean | string;
  };
}

export interface FormConfig {
  fields: FormField[];
  submitLabel?: string;
  resetLabel?: string;
  layout?: "vertical" | "horizontal" | "inline";
}

// Theme and UI types
export type Theme = "light" | "dark" | "system";
export type Size = "xs" | "sm" | "md" | "lg" | "xl";
export type Variant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info";
export type Color =
  | "gray"
  | "red"
  | "yellow"
  | "green"
  | "blue"
  | "indigo"
  | "purple"
  | "pink";

// Component props patterns
export interface ComponentWithChildren {
  children: React.ReactNode;
}

export interface ComponentWithClassName {
  className?: string;
}

export interface ComponentWithVariant {
  variant?: Variant;
}

export interface ComponentWithSize {
  size?: Size;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface AsyncState<T> extends LoadingState {
  data?: T | null;
}

// Event types
export interface BaseEvent {
  id: ID;
  type: string;
  timestamp: Timestamp;
  source: string;
  metadata?: Record<string, any>;
}

export interface UserEvent extends BaseEvent {
  userId: ID;
  action: string;
  resource?: string;
  resourceId?: ID;
}

// Configuration types
export interface AppConfig {
  name: string;
  version: string;
  environment: "development" | "staging" | "production";
  features: Record<string, boolean>;
  limits: {
    fileUpload: {
      maxSize: number;
      allowedTypes: string[];
    };
    api: {
      rateLimit: number;
      timeout: number;
    };
  };
}

// Validation types
export interface ValidationRule {
  field: string;
  rules: Array<{
    type: "required" | "min" | "max" | "pattern" | "custom";
    value?: any;
    message: string;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

// Analytics types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: ID;
  sessionId?: string;
  timestamp?: Timestamp;
}

export interface MetricData {
  name: string;
  value: number;
  unit: string;
  timestamp: Timestamp;
  tags?: Record<string, string>;
}

// Export utility functions for type guards
export const isApiResponse = <T>(obj: any): obj is ApiResponse<T> => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.success === "boolean" &&
    obj.timestamp instanceof Date
  );
};

export const isPaginatedResponse = <T>(
  obj: any,
): obj is PaginatedResponse<T> => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.success === "boolean" &&
    obj.data &&
    Array.isArray(obj.data) &&
    obj.pagination &&
    typeof obj.pagination === "object" &&
    typeof obj.pagination.page === "number" &&
    typeof obj.pagination.limit === "number" &&
    typeof obj.pagination.total === "number" &&
    typeof obj.pagination.totalPages === "number" &&
    typeof obj.pagination.hasNext === "boolean" &&
    typeof obj.pagination.hasPrev === "boolean"
  );
};

export const isErrorResponse = (obj: any): obj is ErrorResponse => {
  return (
    isApiResponse(obj) && obj.success === false && typeof obj.error === "string"
  );
};

export const isBaseEntity = (obj: any): obj is BaseEntity => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.id === "string" &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  );
};

// Type helpers for better DX
export type ExtractArrayType<T> = T extends (infer U)[] ? U : never;
export type NonNullable<T> = T extends null | undefined ? never : T;
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// Generic CRUD operations types
export interface CrudOperations<T, CreateInput, UpdateInput> {
  create: (input: CreateInput) => Promise<T>;
  read: (id: ID) => Promise<T | null>;
  update: (id: ID, input: UpdateInput) => Promise<T>;
  delete: (id: ID) => Promise<boolean>;
  list: (params?: SearchParams) => Promise<PaginatedResponse<T>>;
}

// Hook return types
export interface UseAsyncReturn<T> extends AsyncState<T> {
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  handleChange: (field: keyof T, value: any) => void;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => void;
  reset: () => void;
  setFieldError: (field: keyof T, error: string) => void;
}

// Context types
export interface AppContextValue {
  user: any | null; // Will be typed properly in auth.ts
  organization: any | null; // Will be typed properly in database.ts
  theme: Theme;
  setTheme: (theme: Theme) => void;
  config: AppConfig;
}

// Route types
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  protected?: boolean;
  roles?: string[];
  permissions?: string[];
}

export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ComponentType;
  children?: NavigationItem[];
  badge?: string | number;
  external?: boolean;
}

// Feature flag types
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  conditions?: {
    userRoles?: string[];
    organizationTiers?: string[];
    percentage?: number;
  };
}

// Audit types
export interface AuditLog extends BaseEntity {
  action: string;
  resource: string;
  resourceId?: ID;
  userId: ID;
  organizationId?: ID;
  ipAddress?: string;
  userAgent?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

// Export default consolidated types object for easier importing
const TypesExport = {
  // Common patterns
  // ApiResponse,
  // PaginatedResponse,
  // ErrorResponse,
  // BaseEntity,
  // SoftDeletableEntity,
  // UserOwnedEntity,
  // OrganizationOwnedEntity,

  // Enums
  Status,
  Priority,
  Severity,

  // Utility types
  // Optional,
  // RequiredFields,
  // DeepPartial,
  // ExtractArrayType,
  // NonNullable,
  // KeysOfType,

  // Type guards
  isApiResponse,
  isPaginatedResponse,
  isErrorResponse,
  isBaseEntity,
};

export default TypesExport;
