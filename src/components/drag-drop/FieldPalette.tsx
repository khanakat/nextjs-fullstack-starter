"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  Type,
  Mail,
  Hash,
  Calendar,
  AlignLeft,
  List,
  CheckSquare,
  Plus,
} from "lucide-react";

interface FieldType {
  id: string;
  type: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

const fieldTypes: FieldType[] = [
  {
    id: "palette-text",
    type: "text",
    label: "Text Input",
    icon: Type,
    description: "Single line text input",
  },
  {
    id: "palette-email",
    type: "email",
    label: "Email Input",
    icon: Mail,
    description: "Email address input with validation",
  },
  {
    id: "palette-number",
    type: "number",
    label: "Number Input",
    icon: Hash,
    description: "Numeric input field",
  },
  {
    id: "palette-date",
    type: "date",
    label: "Date Input",
    icon: Calendar,
    description: "Date picker input",
  },
  {
    id: "palette-textarea",
    type: "textarea",
    label: "Text Area",
    icon: AlignLeft,
    description: "Multi-line text input",
  },
  {
    id: "palette-select",
    type: "select",
    label: "Select Dropdown",
    icon: List,
    description: "Dropdown selection list",
  },
  {
    id: "palette-checkbox",
    type: "checkbox",
    label: "Checkbox",
    icon: CheckSquare,
    description: "Boolean checkbox input",
  },
];

interface DraggableFieldProps {
  field: FieldType;
}

function DraggableField({ field }: DraggableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: field.id,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const Icon = field.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        palette-item p-3 bg-white border border-gray-200 rounded-lg cursor-grab active:cursor-grabbing
        transition-all duration-200 hover:shadow-md hover:border-gray-300
        ${isDragging ? "palette-item-dragging opacity-50 scale-105" : ""}
      `}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-blue-50 rounded-md group-hover:bg-blue-100 transition-colors">
          <Icon size={16} className="text-blue-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 text-sm">{field.label}</div>
          <div className="text-xs text-gray-500 mt-1">{field.description}</div>
        </div>

        <Plus
          size={14}
          className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  );
}

export function FieldPalette() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <h3 className="font-semibold text-gray-900">Field Palette</h3>
        <p className="text-sm text-gray-500 mt-1">
          Drag fields to add them to your form
        </p>
      </div>

      {/* Field Categories */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
              Input Fields
            </h4>
            <div className="space-y-2">
              {fieldTypes.slice(0, 4).map((field) => (
                <DraggableField key={field.id} field={field} />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
              Advanced Fields
            </h4>
            <div className="space-y-2">
              {fieldTypes.slice(4).map((field) => (
                <DraggableField key={field.id} field={field} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-600">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Drag to add fields</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Click to select &amp; edit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Hover &amp; click X to remove</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FieldPalette;
