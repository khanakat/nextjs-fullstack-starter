"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  closestCorners,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  KanbanBoardProps,
  KanbanTask,
  KanbanColumn,
} from "@/src/types/drag-drop";

import { useKanbanPersistence } from "@/src/hooks/usePersistence";
import { useHistory } from "@/src/hooks/useHistory";
import { KanbanColumnComponent } from "./KanbanColumn";
import { KanbanTaskCard } from "./KanbanTaskCard";
import { Plus } from "lucide-react";

export function KanbanBoard({
  columns = [],
  onTaskMove,
  onTaskUpdate,
  onColumnUpdate,
  onTaskCreate,
  onColumnCreate,
  className = "",
  allowColumnReorder = true,
  allowTaskCreation = true,
  allowColumnCreation = true,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [activeColumn, setActiveColumn] = useState<KanbanColumn | null>(null);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  // Persistence hook
  const [persistedColumns, setPersistedColumns] = useKanbanPersistence(
    "default",
  ) as unknown as [KanbanColumn[], (columns: KanbanColumn[]) => void];

  // History hook for undo/redo
  const { setState: setHistoryColumns } = useHistory(columns);

  // Initialize columns from persistence if available
  useEffect(() => {
    if (
      persistedColumns &&
      persistedColumns.length > 0 &&
      columns.length === 0
    ) {
      onColumnUpdate?.(persistedColumns);
    }
  }, [persistedColumns, columns.length, onColumnUpdate]);

  // Save columns to persistence when they change
  useEffect(() => {
    if (columns.length > 0) {
      setPersistedColumns(columns);
      setHistoryColumns(columns);
    }
  }, [columns, setPersistedColumns, setHistoryColumns]);

  // Removed unused handleColumnReorder function

  // Memoize helper functions to prevent recreation on every render
  const findTaskById = useCallback(
    (taskId: string): KanbanTask | null => {
      if (!columns || !Array.isArray(columns)) return null;
      for (const column of columns) {
        if (!column || !column.tasks || !Array.isArray(column.tasks)) continue;
        const task = column.tasks.find((t) => t.id === taskId);
        if (task) return task;
      }
      return null;
    },
    [columns],
  );

  const findColumnById = useCallback(
    (columnId: string): KanbanColumn | null => {
      if (!columns || !Array.isArray(columns)) return null;
      return columns.find((col) => col && col.id === columnId) || null;
    },
    [columns],
  );

  const findColumnByTaskId = useCallback(
    (taskId: string): KanbanColumn | null => {
      if (!columns || !Array.isArray(columns)) return null;
      for (const column of columns) {
        if (!column || !column.tasks || !Array.isArray(column.tasks)) continue;
        if (column.tasks.some((task) => task && task.id === taskId)) {
          return column;
        }
      }
      return null;
    },
    [columns],
  );

  // Removed useDragDropContainers as it's not compatible with our implementation

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;

      // Check if dragging a task
      const task = findTaskById(active.id as string);
      if (task) {
        setActiveTask(task);
        return;
      }

      // Check if dragging a column
      const column = columns.find((col) => col.id === active.id);
      if (column) {
        setActiveColumn(column);
      }
    },
    [findTaskById, columns],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over || !activeTask) return;

      const activeTaskId = active.id as string;
      const overId = over.id as string;

      // Find source and destination columns
      const activeColumn = findColumnByTaskId(activeTaskId);
      const overColumn = findColumnById(overId) || findColumnByTaskId(overId);

      if (
        !activeColumn ||
        !overColumn ||
        !activeColumn.tasks ||
        !overColumn.tasks
      )
        return;

      // If moving within the same column, handle reordering
      if (activeColumn.id === overColumn.id) {
        const tasks = [...activeColumn.tasks];
        const activeIndex = tasks.findIndex(
          (task) => task && task.id === activeTaskId,
        );
        const overIndex = tasks.findIndex((task) => task && task.id === overId);

        if (
          activeIndex !== -1 &&
          overIndex !== -1 &&
          activeIndex !== overIndex
        ) {
          const [movedTask] = tasks.splice(activeIndex, 1);
          tasks.splice(overIndex, 0, movedTask);

          const updatedColumn = { ...activeColumn, tasks };
          const updatedColumns =
            columns && Array.isArray(columns)
              ? columns.map((col) =>
                  col && col.id === activeColumn.id ? updatedColumn : col,
                )
              : [];

          onTaskMove?.(activeTaskId, activeColumn.id, overColumn.id, overIndex);
          onColumnUpdate?.(updatedColumns);
        }
        return;
      }

      // Moving between different columns
      const sourceTasks = activeColumn.tasks.filter(
        (task) => task && task.id !== activeTaskId,
      );
      const destinationTasks = [...overColumn.tasks];

      const taskToMove = activeColumn.tasks.find(
        (task) => task && task.id === activeTaskId,
      );
      if (!taskToMove) return;

      // Determine insertion index
      let insertIndex = destinationTasks.length;
      if (overId !== overColumn.id) {
        const overTaskIndex = destinationTasks.findIndex(
          (task) => task && task.id === overId,
        );
        if (overTaskIndex !== -1) {
          insertIndex = overTaskIndex;
        }
      }

      destinationTasks.splice(insertIndex, 0, taskToMove);

      const updatedColumns =
        columns && Array.isArray(columns)
          ? columns.map((col) => {
              if (!col) return col;
              if (col.id === activeColumn.id) {
                return { ...col, tasks: sourceTasks };
              }
              if (col.id === overColumn.id) {
                return { ...col, tasks: destinationTasks };
              }
              return col;
            })
          : [];

      onTaskMove?.(activeTaskId, activeColumn.id, overColumn.id, insertIndex);
      onColumnUpdate?.(updatedColumns);
    },
    [
      activeTask,
      findColumnByTaskId,
      findColumnById,
      columns,
      onTaskMove,
      onColumnUpdate,
    ],
  );

  const handleDragEnd = useCallback((_event: DragEndEvent) => {
    setActiveTask(null);
    setActiveColumn(null);
  }, []);

  const handleCreateColumn = useCallback(() => {
    if (onColumnCreate) {
      const newColumn: KanbanColumn = {
        id: `column-${Date.now()}`,
        title: "Nueva Columna",
        tasks: [],
        color: "#6B7280",
        maxTasks: undefined,
      };
      onColumnCreate(newColumn);
    }
  }, [onColumnCreate]);

  const boardClasses = `
    flex space-x-6 p-6 overflow-x-auto min-h-screen bg-gray-50
    ${className}
  `.trim();

  // Early return if columns is not properly initialized
  if (!columns || !Array.isArray(columns)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500">Loading Kanban board...</div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={boardClasses}>
        <SortableContext
          items={columns.map((col) => col?.id).filter(Boolean)}
          strategy={verticalListSortingStrategy}
          disabled={!allowColumnReorder}
        >
          {columns.map((column) =>
            column ? (
              <KanbanColumnComponent
                key={column.id}
                column={column}
                onTaskUpdate={onTaskUpdate}
                onTaskCreate={onTaskCreate}
                allowTaskCreation={allowTaskCreation}
                isActive={activeColumn?.id === column.id}
              />
            ) : null,
          )}
        </SortableContext>

        {/* Add Column Button */}
        {allowColumnCreation && (
          <div className="flex-shrink-0">
            <button
              onClick={handleCreateColumn}
              className="flex items-center justify-center w-80 h-12 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors duration-200"
            >
              <Plus size={20} className="text-gray-500 mr-2" />
              <span className="text-gray-600 font-medium">Agregar Columna</span>
            </button>
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      {activeTask && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <KanbanTaskCard
            task={activeTask}
            isDragging={true}
            onUpdate={() => {}}
          />
        </div>
      )}
    </DndContext>
  );
}
