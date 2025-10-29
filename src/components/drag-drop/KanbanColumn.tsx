"use client";

import React, { useState, memo, useCallback } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortableItem } from "@/src/hooks/useSortableItem";
import { KanbanColumn, KanbanTask } from "@/src/types/drag-drop";
import { KanbanTaskCard } from "./KanbanTaskCard";
import { Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  column: KanbanColumn;
  onTaskUpdate?: (task: KanbanTask) => void;
  onTaskCreate?: (columnId: string, task: Omit<KanbanTask, "id">) => void;
  allowTaskCreation?: boolean;
  isActive?: boolean;
}

const KanbanColumnComponent = memo(function KanbanColumnComponent({
  column,
  onTaskUpdate,
  onTaskCreate,
  allowTaskCreation = true,
  isActive = false,
}: KanbanColumnProps) {
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortableItem(column.id);

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
  });

  const handleCreateTask = useCallback(() => {
    if (newTaskTitle.trim() && onTaskCreate) {
      const newTask: Omit<KanbanTask, "id"> = {
        title: newTaskTitle.trim(),
        description: "",
        priority: "medium",
        assignee: undefined,
        dueDate: undefined,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      onTaskCreate(column.id, newTask);
      setNewTaskTitle("");
      setIsCreatingTask(false);
    }
  }, [newTaskTitle, onTaskCreate, column.id]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleCreateTask();
      } else if (e.key === "Escape") {
        setIsCreatingTask(false);
        setNewTaskTitle("");
      }
    },
    [handleCreateTask],
  );

  const columnStyle = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  const columnClasses = cn(
    "flex flex-col w-80 bg-gray-100 rounded-lg p-4 min-h-96",
    "transition-all duration-200 ease-in-out",
    {
      "opacity-50 scale-105 z-50": isDragging,
      "ring-2 ring-blue-500 ring-opacity-50": isOver && !isDragging,
      "shadow-lg": isActive,
    },
  );

  const headerClasses = cn(
    "flex items-center justify-between mb-4 p-2 rounded cursor-grab",
    "hover:bg-gray-200 transition-colors duration-200",
    {
      "cursor-grabbing": isDragging,
    },
  );

  const taskCountColor =
    column.maxTasks && column.tasks.length >= column.maxTasks
      ? "text-red-600"
      : "text-gray-600";

  return (
    <div
      ref={(node) => {
        setSortableRef(node);
        setDroppableRef(node);
      }}
      style={columnStyle}
      className={columnClasses}
    >
      {/* Column Header */}
      <div className={headerClasses} {...attributes} {...listeners}>
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-semibold text-gray-800 truncate">
            {column.title}
          </h3>
          <span className={`text-sm ${taskCountColor}`}>
            {column.tasks.length}
            {column.maxTasks && `/${column.maxTasks}`}
          </span>
        </div>
        <button className="p-1 hover:bg-gray-300 rounded">
          <MoreHorizontal size={16} className="text-gray-600" />
        </button>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 space-y-3 min-h-32">
        <SortableContext
          items={column.tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <KanbanTaskCard key={task.id} task={task} onUpdate={onTaskUpdate} />
          ))}
        </SortableContext>

        {/* Empty State */}
        {column.tasks.length === 0 && !isCreatingTask && (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 text-sm">No hay tareas</p>
          </div>
        )}
      </div>

      {/* Add Task Section */}
      {allowTaskCreation && (
        <div className="mt-4">
          {isCreatingTask ? (
            <div className="space-y-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Task title..."
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle.trim()}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setIsCreatingTask(false);
                    setNewTaskTitle("");
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingTask(true)}
              disabled={
                column.maxTasks ? column.tasks.length >= column.maxTasks : false
              }
              className="flex items-center justify-center w-full p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} className="mr-1" />
              <span className="text-sm">Agregar tarea</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export { KanbanColumnComponent };
