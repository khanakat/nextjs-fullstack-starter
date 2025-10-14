// Database types with relations
export interface PostWithAuthor {
  id: string
  title: string
  content: string | null
  published: boolean
  authorId: string
  createdAt: Date
  updatedAt: Date
  author: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    imageUrl?: string | null
  }
}

export interface PostWithAuthorAndTags extends PostWithAuthor {
  tags: {
    id: string
    name: string
  }[]
}

export interface UserProfile {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  imageUrl?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Tag {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

// Form types
export interface CreatePostData {
  title: string
  content?: string
  published?: boolean
  tags?: string[]
}

export interface UpdatePostData extends Partial<CreatePostData> {
  id: string
}

export interface CreateTagData {
  name: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Search and Filter types
export interface PostFilters {
  published?: boolean
  authorId?: string
  tags?: string[]
  dateFrom?: Date
  dateTo?: Date
  search?: string
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  orderBy?: string
  orderDir?: 'asc' | 'desc'
}

// UI Component types
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
}

export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, record: T) => React.ReactNode
}

export interface FormFieldProps {
  name: string
  label: string
  type?: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  validation?: {
    min?: number
    max?: number
    pattern?: RegExp
    message?: string
  }
}

// Theme types
export type Theme = 'light' | 'dark' | 'system'

export interface ThemeConfig {
  theme: Theme
  accentColor: string
  fontSize: 'sm' | 'base' | 'lg'
  fontFamily: 'sans' | 'serif' | 'mono'
}

// Navigation types
export interface NavItem {
  label: string
  href: string
  icon?: React.ComponentType
  badge?: string | number
  children?: NavItem[]
}

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

// Error types
export interface AppError extends Error {
  code?: string
  statusCode?: number
  details?: any
}

export type ErrorBoundaryFallback = React.ComponentType<{
  error: AppError
  resetError: () => void
}>

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Event types
export interface CustomEvent<T = any> {
  type: string
  payload: T
  timestamp: Date
}

// Upload types
export interface FileUpload {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  url?: string
  error?: string
}

// Analytics types
export interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  userId?: string
  timestamp?: Date
}

export interface PageView {
  path: string
  title: string
  referrer?: string
  userId?: string
  timestamp: Date
}

// Notification types
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actions?: {
    label: string
    action: () => void
  }[]
}

// Settings types
export interface UserSettings {
  theme: Theme
  notifications: {
    email: boolean
    push: boolean
    marketing: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private'
    showActivity: boolean
  }
  preferences: {
    language: string
    timezone: string
    dateFormat: string
  }
}