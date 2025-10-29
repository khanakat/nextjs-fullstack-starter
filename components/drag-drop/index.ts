// Re-export all drag-drop components from src
export { DragDropProvider } from "@/src/contexts/DragDropProvider";
export { SortableList } from "@/src/components/drag-drop/SortableList";
export { KanbanBoard } from "@/src/components/drag-drop/KanbanBoard";
export { FileUploadZone } from "@/src/components/drag-drop/FileUploadZone";
export { DashboardBuilder } from "@/src/components/drag-drop/DashboardBuilder";
export { FormBuilder } from "@/src/components/drag-drop/FormBuilder";
export { ClientOnlyDragDrop } from "@/src/components/drag-drop/ClientOnlyDragDrop";

// Export types
export type {
  DragItem,
  KanbanTask,
  KanbanColumn,
  KanbanBoard as KanbanBoardType,
  UploadFile,
  FileUploadConfig,
  DashboardWidget,
  FormField,
  DragDropContextType,
  AccessibilityConfig,
} from "@/src/types/drag-drop";