"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Settings,
  X,
  Type,
  Mail,
  Hash,
  Calendar,
  CheckSquare,
  List,
  FileText,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FormField as FormFieldType } from "@/src/types/drag-drop";

interface ValidationError {
  fieldId: string;
  message: string;
  type: "error" | "warning";
}

interface FormFieldProps {
  field: FormFieldType;
  onRemove: (id: string) => void;
  onConfigure: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  validationErrors?: ValidationError[];
}

const FIELD_ICONS = {
  text: Type,
  email: Mail,
  number: Hash,
  date: Calendar,
  checkbox: CheckSquare,
  select: List,
  textarea: FileText,
  radio: CheckSquare,
};

export function FormFieldComponent({
  field,
  onRemove,
  onConfigure,
  isSelected = false,
  onSelect,
  validationErrors = [],
}: FormFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = FIELD_ICONS[field.type] || Type;
  const hasErrors = validationErrors.some((error) => error.type === "error");
  const hasWarnings = validationErrors.some(
    (error) => error.type === "warning",
  );

  const renderFieldPreview = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "number":
      case "date":
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
          />
        );
      case "textarea":
        return (
          <textarea
            placeholder={field.placeholder}
            disabled
            rows={field.config?.rows || 4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 resize-none"
          />
        );
      case "select":
        return (
          <select
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
          >
            <option>Select an option</option>
            {field.options?.slice(0, 3).map((option, index) => (
              <option
                key={index}
                value={typeof option === "string" ? option : option.value}
              >
                {typeof option === "string" ? option : option.label}
              </option>
            ))}
            {field.options && field.options.length > 3 && (
              <option disabled>... and {field.options.length - 3} more</option>
            )}
          </select>
        );
      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.slice(0, 3).map((option, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  name={field.id}
                  disabled
                  className="h-4 w-4 text-blue-600 border-gray-300"
                />
                <label className="ml-2 text-sm text-gray-700">
                  {typeof option === "string" ? option : option.label}
                </label>
              </div>
            ))}
            {field.options && field.options.length > 3 && (
              <div className="text-xs text-gray-500">
                ... and {field.options.length - 3} more options
              </div>
            )}
          </div>
        );
      case "checkbox":
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              disabled
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">{field.label}</label>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-white border rounded-lg p-4 transition-all duration-200",
        {
          "border-blue-500 ring-2 ring-blue-200": isSelected,
          "border-red-500 ring-2 ring-red-200": hasErrors,
          "border-yellow-500 ring-2 ring-yellow-200": hasWarnings && !hasErrors,
          "border-gray-200 hover:border-gray-300":
            !isSelected && !hasErrors && !hasWarnings,
          "opacity-50": isDragging,
        },
      )}
      onClick={() => onSelect?.(field.id)}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={16} className="text-gray-400" />
      </div>

      {/* Field Header */}
      <div className="flex items-start justify-between mb-3 ml-6">
        <div className="flex items-center gap-2 flex-1">
          <IconComponent size={16} className="text-gray-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900 truncate">
                {field.label || `Untitled ${field.type} field`}
              </h4>
              {field.required && (
                <span className="text-red-500 text-sm">*</span>
              )}
              {hasErrors && (
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
              )}
              {hasWarnings && !hasErrors && (
                <AlertCircle
                  size={14}
                  className="text-yellow-500 flex-shrink-0"
                />
              )}
            </div>
            <p className="text-xs text-gray-500 capitalize">
              {field.type} field
              {field.required && " • Required"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConfigure(field.id);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Configure field"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(field.id);
            }}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Remove field"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
          <ul className="space-y-1">
            {validationErrors.map((error, index) => (
              <li
                key={index}
                className={
                  error.type === "error" ? "text-red-700" : "text-yellow-700"
                }
              >
                • {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Field Preview */}
      <div className="space-y-2">
        {field.type !== "checkbox" && (
          <label className="block text-sm font-medium text-gray-700">
            {field.label || `Untitled ${field.type} field`}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {renderFieldPreview()}
      </div>

      {/* Field Info */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>ID: {field.id}</span>
          <span>Position: {field.position + 1}</span>
        </div>
        {field.options && field.options.length > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            {field.options.length} option{field.options.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
