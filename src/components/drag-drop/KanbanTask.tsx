"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanTask } from "@/src/types/drag-drop";
import { GripVertical, Calendar, User } from "lucide-react";

interface KanbanTaskProps {
  task: KanbanTask;
  isDragging?: boolean;
}

export function KanbanTaskComponent({
  task,
  isDragging = false,
}: KanbanTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        kanban-task group p-4 bg-white rounded-lg border border-gray-200 cursor-grab 
        active:cursor-grabbing transition-all duration-200
        ${isDragging ? "kanban-task-dragging opacity-50" : "hover:shadow-md hover:border-gray-300"}
      `}
      {...attributes}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1">
          {task.title}
        </h4>
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing ml-2"
          {...listeners}
        >
          <GripVertical size={14} className="text-gray-400" />
        </div>
      </div>

      {/* Task Description */}
      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Task Metadata */}
      {task.metadata && (
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {task.metadata.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>
                {new Date(task.metadata.dueDate).toLocaleDateString()}
              </span>
            </div>
          )}
          {task.metadata.assignee && (
            <div className="flex items-center gap-1">
              <User size={12} />
              <span>{task.metadata.assignee}</span>
            </div>
          )}
          {task.metadata.priority && (
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                task.metadata.priority === "high"
                  ? "bg-red-100 text-red-700"
                  : task.metadata.priority === "medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
              }`}
            >
              {task.metadata.priority}
            </div>
          )}
        </div>
      )}

      {/* Task Tags */}
      {task.metadata?.tags && task.metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.metadata.tags.map((tag: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default KanbanTaskComponent;
