"use client";

import React, { useState, memo, useCallback } from "react";
import { useSortableItem } from "@/src/hooks/useSortableItem";
import { KanbanTask } from "@/src/types/drag-drop";
import { Calendar, User, Tag, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanTaskCardProps {
  task: KanbanTask;
  onUpdate?: (task: KanbanTask) => void;
  isDragging?: boolean;
}

const KanbanTaskCard = memo(function KanbanTaskCard({
  task,
  onUpdate,
  isDragging = false,
}: KanbanTaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(
    task.description || "",
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortableItem(task.id);

  const handleSave = useCallback(() => {
    if (onUpdate) {
      onUpdate({
        ...task,
        title: editTitle.trim(),
        description: editDescription.trim(),
        updatedAt: new Date(),
      });
    }
    setIsEditing(false);
  }, [onUpdate, task, editTitle, editDescription]);

  const handleCancel = useCallback(() => {
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setIsEditing(false);
  }, [task.title, task.description]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && e.ctrlKey) {
        handleSave();
      } else if (e.key === "Escape") {
        handleCancel();
      }
    },
    [handleSave, handleCancel],
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "High";
      case "medium":
        return "Medium";
      case "low":
        return "Low";
      default:
        return priority;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  const cardStyle = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  const cardClasses = cn(
    "bg-white border border-gray-200 rounded-lg p-3 shadow-sm",
    "transition-all duration-200 ease-in-out",
    "hover:shadow-md hover:border-gray-300",
    "cursor-grab active:cursor-grabbing",
    {
      "opacity-50 scale-105 z-50 shadow-lg": isDragging || isSortableDragging,
      "ring-2 ring-blue-500 ring-opacity-50": isSortableDragging,
    },
  );

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={cardStyle}
        className="bg-white border border-blue-300 rounded-lg p-3 shadow-md"
      >
        <div className="space-y-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full p-2 text-sm font-medium border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Task title"
            autoFocus
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Description (optional)"
            rows={2}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={!editTitle.trim()}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      className={cardClasses}
      {...attributes}
      {...listeners}
      onDoubleClick={() => setIsEditing(true)}
    >
      {/* Task Title */}
      <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Task Description */}
      {task.description && (
        <p className="text-gray-600 text-xs mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Task Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
            >
              <Tag size={10} className="mr-1" />
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{task.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Task Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          {/* Priority */}
          <span
            className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(task.priority || "medium")}`}
          >
            {getPriorityLabel(task.priority || "medium")}
          </span>

          {/* Assignee */}
          {task.assignee && (
            <div className="flex items-center">
              <User size={12} className="mr-1" />
              <span className="truncate max-w-16">{task.assignee}</span>
            </div>
          )}
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div
            className={`flex items-center ${isOverdue ? "text-red-600" : ""}`}
          >
            <Calendar size={12} className="mr-1" />
            <span>{formatDate(new Date(task.dueDate))}</span>
          </div>
        )}
      </div>

      {/* Overdue Indicator */}
      {isOverdue && (
        <div className="mt-2 flex items-center text-red-600 text-xs">
          <Clock size={12} className="mr-1" />
          <span>Overdue</span>
        </div>
      )}
    </div>
  );
});

export { KanbanTaskCard };
