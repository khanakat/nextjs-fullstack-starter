import { ReactNode } from "react";
import {
  DragEndEvent,
  DragStartEvent,
  CollisionDetection,
  SensorDescriptor,
} from "@dnd-kit/core";
import { Transform } from "@dnd-kit/utilities";

// Base drag item interface
export interface DragItem {
  id: string;
  type: string;
  data: any;
  position?: number;
  containerId?: string;
}

// Kanban board types
export interface KanbanTask {
  id: string;
  columnId?: string;
  title: string;
  description?: string;
  position?: number;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  assignee?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface KanbanColumn {
  id: string;
  boardId?: string;
  title: string;
  tasks: KanbanTask[];
  position?: number;
  color?: string;
  taskLimit?: number;
  maxTasks?: number;
}

export interface KanbanBoard {
  id: string;
  title: string;
  columns: KanbanColumn[];
  tasks: KanbanTask[];
  settings?: Record<string, any>;
  updatedAt?: Date;
}

// File upload types
export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  preview?: string;
  error?: string;
}

export interface FileUploadConfig {
  maxFiles?: number;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  multiple?: boolean;
  showPreview?: boolean;
}

// Dashboard widget types
export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config?: Record<string, any>;
  data?: any;
}

// Form builder types
export interface FormField {
  id: string;
  type:
    | "text"
    | "email"
    | "number"
    | "select"
    | "checkbox"
    | "radio"
    | "textarea"
    | "date";
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: Record<string, any>;
  options?: Array<{ label: string; value: string }>;
  position: number;
  config?: Record<string, any>;
}

// Context types
export interface AccessibilityConfig {
  announcements: {
    onDragStart: (id: string) => string;
    onDragOver: (id: string, overId: string) => string;
    onDragEnd: (id: string, overId: string) => string;
    onDragCancel: (id: string) => string;
  };
  screenReaderInstructions: {
    draggable: string;
    droppable: string;
  };
}

export interface DragDropContextType {
  activeId: string | null;
  dragOverlay: ReactNode | null;
  sensors: SensorDescriptor<any>[];
  collisionDetection: CollisionDetection;
  accessibility: AccessibilityConfig;
  setActiveId: (id: string | null) => void;
  setDragOverlay: (overlay: ReactNode | null) => void;
}

// Hook return types
export interface UseDragDropReturn<T> {
  sensors: SensorDescriptor<any>[];
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragOver: (event: any) => void;
  activeId: string | null;
  items: T[];
}

export interface UseSortableItemReturn {
  attributes: Record<string, any>;
  listeners: Record<string, any>;
  setNodeRef: (node: HTMLElement | null) => void;
  transform: Transform | null;
  transition: string | undefined;
  isDragging: boolean;
  isOver: boolean;
}

// Event handler types
export type DragStartHandler = (event: DragStartEvent) => void;
export type DragEndHandler = (event: DragEndEvent) => void;
export type DragOverHandler = (event: any) => void;

// Component prop types
export interface SortableListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, isDragging?: boolean) => ReactNode;
  direction?: "vertical" | "horizontal";
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
  dragHandleClassName?: string;
}

export interface KanbanBoardProps {
  columns?: KanbanColumn[];
  onTaskMove?: (
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    position: number,
  ) => void;
  onTaskUpdate?: (task: KanbanTask) => void;
  onColumnUpdate?: (columns: KanbanColumn[]) => void;
  onTaskCreate?: (columnId: string, task: Omit<KanbanTask, "id">) => void;
  onColumnCreate?: (column: KanbanColumn) => void;
  onUpdate?: (columns: KanbanColumn[]) => void;
  className?: string;
  allowColumnReorder?: boolean;
  allowTaskCreation?: boolean;
  allowColumnCreation?: boolean;
}

export interface FileUploadZoneProps {
  onFilesAdded: (files: File[]) => void;
  onFileRemove?: (fileId: string) => void;
  config?: FileUploadConfig;
  className?: string;
  disabled?: boolean;
  persistenceKey?: string;
  autoSave?: boolean;
  onStateChange?: (state: FileUploadState) => void;
}

export interface FileUploadState {
  files: UploadFile[];
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export interface DashboardBuilderProps {
  widgets: DashboardWidget[];
  onSave: (widgets: DashboardWidget[]) => void;
  onWidgetAdd?: (widget: DashboardWidget) => void;
  onWidgetRemove?: (widgetId: string) => void;
  onWidgetUpdate?: (widget: DashboardWidget) => void;
  className?: string;
}

export interface FormBuilderProps {
  fields: FormField[];
  onFieldsChange: (fields: FormField[]) => void;
  onFieldAdd?: (field: FormField) => void;
  onFieldRemove?: (fieldId: string) => void;
  onFieldUpdate?: (field: FormField) => void;
  className?: string;
}

// Utility types
export type DragDropComponent =
  | "sortable-list"
  | "kanban-board"
  | "file-upload"
  | "dashboard-builder"
  | "form-builder";

export interface DragDropConfig {
  component: DragDropComponent;
  accessibility?: Partial<AccessibilityConfig>;
  collisionDetection?: CollisionDetection;
  sensors?: SensorDescriptor<any>[];
}
