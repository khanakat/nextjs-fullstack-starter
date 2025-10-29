"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { FormBuilderProps, FormField } from "@/src/types/drag-drop";
import { FormFieldComponent } from "./FormField";
import { FieldPalette } from "./FieldPalette";
import { FormPreview } from "./FormPreview";
import {
  Eye,
  Code,
  Settings,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface ValidationError {
  fieldId: string;
  message: string;
  type: "error" | "warning";
}

export function FormBuilder({
  fields,
  onFieldsChange,
  onFieldAdd,
  onFieldRemove,
  onFieldUpdate,
  className = "",
}: FormBuilderProps) {
  const [, setActiveId] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"builder" | "preview" | "code">(
    "builder",
  );
  const [showPalette, setShowPalette] = useState(true);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [isValidating, setIsValidating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Comprehensive form validation
  const validateForm = useCallback(() => {
    const errors: ValidationError[] = [];

    // Check for duplicate field labels
    const labelCounts = new Map<string, number>();
    fields.forEach((field) => {
      const count = labelCounts.get(field.label) || 0;
      labelCounts.set(field.label, count + 1);
    });

    labelCounts.forEach((count, label) => {
      if (count > 1) {
        const duplicateFields = fields.filter((f) => f.label === label);
        duplicateFields.forEach((field) => {
          errors.push({
            fieldId: field.id,
            message: `Duplicate label "${label}" found`,
            type: "error",
          });
        });
      }
    });

    // Validate individual fields
    fields.forEach((field) => {
      // Check for empty labels
      if (!field.label || field.label.trim() === "") {
        errors.push({
          fieldId: field.id,
          message: "Field label is required",
          type: "error",
        });
      }

      // Check for very long labels
      if (field.label && field.label.length > 100) {
        errors.push({
          fieldId: field.id,
          message: "Field label is too long (max 100 characters)",
          type: "warning",
        });
      }

      // Validate select field options
      if (field.type === "select") {
        if (!field.options || field.options.length === 0) {
          errors.push({
            fieldId: field.id,
            message: "Select field must have at least one option",
            type: "error",
          });
        } else {
          // Check for duplicate option values
          const optionValues = field.options.map((opt) =>
            typeof opt === "string" ? opt : opt.value,
          );
          const uniqueValues = new Set(optionValues);
          if (uniqueValues.size !== optionValues.length) {
            errors.push({
              fieldId: field.id,
              message: "Select field has duplicate option values",
              type: "error",
            });
          }

          // Check for empty option values
          const hasEmptyOptions = field.options.some((opt) => {
            const value = typeof opt === "string" ? opt : opt.value;
            return !value || value.trim() === "";
          });
          if (hasEmptyOptions) {
            errors.push({
              fieldId: field.id,
              message: "Select field has empty option values",
              type: "error",
            });
          }
        }
      }

      // Validate radio field options
      if (field.type === "radio") {
        if (!field.options || field.options.length < 2) {
          errors.push({
            fieldId: field.id,
            message: "Radio field must have at least two options",
            type: "error",
          });
        }
      }

      // Validate email field placeholder
      if (field.type === "email" && field.placeholder) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (
          !emailRegex.test(field.placeholder) &&
          field.placeholder.includes("@")
        ) {
          errors.push({
            fieldId: field.id,
            message: "Email placeholder should be a valid email format",
            type: "warning",
          });
        }
      }

      // Check for accessibility issues
      if (field.label && field.label.length < 3) {
        errors.push({
          fieldId: field.id,
          message: "Field label is too short for accessibility",
          type: "warning",
        });
      }
    });

    // Check form structure
    if (fields.length === 0) {
      errors.push({
        fieldId: "form",
        message: "Form must have at least one field",
        type: "error",
      });
    }

    // Check for too many fields
    if (fields.length > 50) {
      errors.push({
        fieldId: "form",
        message:
          "Form has too many fields (consider splitting into multiple forms)",
        type: "warning",
      });
    }

    // Check for required field balance
    const requiredFields = fields.filter((f) => f.required);
    if (requiredFields.length === fields.length && fields.length > 5) {
      errors.push({
        fieldId: "form",
        message:
          "Consider making some fields optional to improve user experience",
        type: "warning",
      });
    }

    return errors;
  }, [fields]);

  // Auto-validate on field changes
  useEffect(() => {
    setIsValidating(true);
    const timeoutId = setTimeout(() => {
      const errors = validateForm();
      setValidationErrors(errors);
      setIsValidating(false);
    }, 300); // Debounce validation

    return () => clearTimeout(timeoutId);
  }, [fields, validateForm]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const draggedId = active.id as string;

    // Check if it's a new field from palette
    if (draggedId.startsWith("palette-")) {
      const fieldType = draggedId.replace("palette-", "") as FormField["type"];

      const newField: FormField = {
        id: `field-${Date.now()}`,
        type: fieldType,
        label: `New ${fieldType} field`,
        required: false,
        position: fields.length,
        placeholder: getDefaultPlaceholder(fieldType),
        ...(fieldType === "select" && {
          options: [
            { label: "Option 1", value: "option1" },
            { label: "Option 2", value: "option2" },
            { label: "Option 3", value: "option3" },
          ],
        }),
        ...(fieldType === "radio" && {
          options: [
            { label: "Option A", value: "optionA" },
            { label: "Option B", value: "optionB" },
          ],
        }),
      };

      if (onFieldAdd) {
        onFieldAdd(newField);
      }
    } else {
      // Reordering existing fields
      const oldIndex = fields.findIndex((field) => field.id === draggedId);
      const newIndex = fields.findIndex((field) => field.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedFields = arrayMove(fields, oldIndex, newIndex).map(
          (field, index) => ({
            ...field,
            position: index,
          }),
        );
        onFieldsChange(reorderedFields);
      }
    }

    setActiveId(null);
  };

  const getDefaultPlaceholder = (fieldType: FormField["type"]): string => {
    switch (fieldType) {
      case "text":
        return "Enter text...";
      case "email":
        return "Enter your email...";
      case "number":
        return "Enter a number...";
      case "date":
        return "";
      case "textarea":
        return "Enter your message...";
      case "select":
        return "";
      case "checkbox":
        return "";
      case "radio":
        return "";
      default:
        return "";
    }
  };

  const handleFieldSelect = (fieldId: string) => {
    setSelectedField(selectedField === fieldId ? null : fieldId);
  };

  const handleFieldUpdate = (updatedField: FormField) => {
    if (onFieldUpdate) {
      onFieldUpdate(updatedField);
    }
  };

  const selectedFieldData = fields.find((f) => f.id === selectedField);
  const fieldErrors = validationErrors.filter(
    (error) => error.fieldId === selectedField,
  );
  const formErrors = validationErrors.filter(
    (error) => error.fieldId === "form",
  );
  const hasErrors = validationErrors.some((error) => error.type === "error");

  const generateFormCode = () => {
    const formCode = `
<form className="space-y-6" onSubmit={handleSubmit}>
${fields
  .map((field) => {
    switch (field.type) {
      case "text":
      case "email":
      case "number":
      case "date":
        return `  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      ${field.label}${field.required ? " *" : ""}
    </label>
    <input
      type="${field.type}"
      name="${field.id}"
      ${field.required ? "required" : ""}
      ${field.placeholder ? `placeholder="${field.placeholder}"` : ""}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>`;
      case "textarea":
        return `  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      ${field.label}${field.required ? " *" : ""}
    </label>
    <textarea
      name="${field.id}"
      ${field.required ? "required" : ""}
      ${field.placeholder ? `placeholder="${field.placeholder}"` : ""}
      rows="4"
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    ></textarea>
  </div>`;
      case "select":
        return `  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      ${field.label}${field.required ? " *" : ""}
    </label>
    <select
      name="${field.id}"
      ${field.required ? "required" : ""}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select an option</option>
${field.options?.map((option) => `      <option value="${typeof option === "string" ? option : option.value}">${typeof option === "string" ? option : option.label}</option>`).join("\n") || ""}
    </select>
  </div>`;
      case "radio":
        return `  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      ${field.label}${field.required ? " *" : ""}
    </label>
    <div className="space-y-2">
${
  field.options
    ?.map(
      (option) => `      <div className="flex items-center">
        <input
          type="radio"
          name="${field.id}"
          value="${typeof option === "string" ? option : option.value}"
          ${field.required ? "required" : ""}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
        />
        <label className="ml-2 block text-sm text-gray-900">
          ${typeof option === "string" ? option : option.label}
        </label>
      </div>`,
    )
    .join("\n") || ""
}
    </div>
  </div>`;
      case "checkbox":
        return `  <div className="flex items-center">
    <input
      type="checkbox"
      name="${field.id}"
      ${field.required ? "required" : ""}
      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
    />
    <label className="ml-2 block text-sm text-gray-900">
      ${field.label}${field.required ? " *" : ""}
    </label>
  </div>`;
      default:
        return "";
    }
  })
  .join("\n")}
  
  <button
    type="submit"
    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
    ${hasErrors ? "disabled" : ""}
  >
    Submit
  </button>
</form>`;
    return formCode;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`flex h-full ${className}`}>
        {/* Field Palette Sidebar */}
        {showPalette && (
          <div className="w-64 bg-gray-50 border-r">
            <FieldPalette />
          </div>
        )}

        {/* Form Builder Canvas */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPalette(!showPalette)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {showPalette ? "Hide" : "Show"} Palette
              </button>

              {/* Validation Status */}
              <div className="flex items-center gap-2 ml-4">
                {isValidating ? (
                  <div className="flex items-center text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                    <span className="text-sm">Validating...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    {hasErrors ? (
                      <div className="flex items-center text-red-600">
                        <AlertCircle size={16} className="mr-1" />
                        <span className="text-sm">
                          {
                            validationErrors.filter((e) => e.type === "error")
                              .length
                          }{" "}
                          errors
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center text-green-600">
                        <CheckCircle size={16} className="mr-1" />
                        <span className="text-sm">Valid</span>
                      </div>
                    )}
                    {validationErrors.filter((e) => e.type === "warning")
                      .length > 0 && (
                      <div className="flex items-center text-yellow-600 ml-2">
                        <AlertCircle size={16} className="mr-1" />
                        <span className="text-sm">
                          {
                            validationErrors.filter((e) => e.type === "warning")
                              .length
                          }{" "}
                          warnings
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode("builder")}
                  className={`px-3 py-2 text-sm ${
                    viewMode === "builder"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Settings size={16} className="inline mr-1" />
                  Builder
                </button>
                <button
                  onClick={() => setViewMode("preview")}
                  className={`px-3 py-2 text-sm border-l border-gray-300 ${
                    viewMode === "preview"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Eye size={16} className="inline mr-1" />
                  Preview
                </button>
                <button
                  onClick={() => setViewMode("code")}
                  className={`px-3 py-2 text-sm border-l border-gray-300 ${
                    viewMode === "code"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Code size={16} className="inline mr-1" />
                  Code
                </button>
              </div>

              <button
                className={`px-3 py-2 text-sm rounded-md ${
                  hasErrors
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                disabled={hasErrors}
                title={
                  hasErrors
                    ? "Fix validation errors before saving"
                    : "Save form"
                }
              >
                <Save size={16} className="inline mr-1" />
                Save Form
              </button>
            </div>
          </div>

          {/* Form Errors Display */}
          {formErrors.length > 0 && (
            <div className="bg-red-50 border-b border-red-200 p-3">
              <div className="flex items-center">
                <AlertCircle size={16} className="text-red-600 mr-2" />
                <span className="text-sm font-medium text-red-800">
                  Form Issues:
                </span>
              </div>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {formErrors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex">
            {/* Form Canvas */}
            <div className="flex-1 p-6 overflow-auto">
              {viewMode === "builder" && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Form Builder
                    </h2>

                    {fields.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-lg mb-2">No fields added yet</div>
                        <div className="text-sm">
                          Drag fields from the palette to get started
                        </div>
                      </div>
                    ) : (
                      <SortableContext
                        items={fields.map((f) => f.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-4">
                          {fields.map((field) => {
                            const fieldValidationErrors =
                              validationErrors.filter(
                                (error) => error.fieldId === field.id,
                              );
                            return (
                              <FormFieldComponent
                                key={field.id}
                                field={field}
                                isSelected={selectedField === field.id}
                                onSelect={() => handleFieldSelect(field.id)}
                                onRemove={() =>
                                  onFieldRemove && onFieldRemove(field.id)
                                }
                                onConfigure={() => handleFieldSelect(field.id)}
                                validationErrors={fieldValidationErrors}
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                    )}
                  </div>
                </div>
              )}

              {viewMode === "preview" && (
                <div className="max-w-2xl mx-auto">
                  <FormPreview
                    fields={fields}
                    validationErrors={validationErrors}
                  />
                </div>
              )}

              {viewMode === "code" && (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-gray-900 text-gray-100 rounded-lg p-6 overflow-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        Generated Form Code
                      </h3>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(generateFormCode())
                        }
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Copy Code
                      </button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
                      <code>{generateFormCode()}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Field Properties Panel */}
            {selectedFieldData && viewMode === "builder" && (
              <div className="w-80 bg-gray-50 border-l p-4 overflow-y-auto">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Field Properties
                </h3>

                {/* Field Validation Errors */}
                {fieldErrors.length > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center mb-2">
                      <AlertCircle size={16} className="text-red-600 mr-1" />
                      <span className="text-sm font-medium text-red-800">
                        Issues:
                      </span>
                    </div>
                    <ul className="text-sm text-red-700 space-y-1">
                      {fieldErrors.map((error, index) => (
                        <li
                          key={index}
                          className={
                            error.type === "warning" ? "text-yellow-700" : ""
                          }
                        >
                          {error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Type
                    </label>
                    <select
                      value={selectedFieldData.type}
                      onChange={(e) =>
                        handleFieldUpdate({
                          ...selectedFieldData,
                          type: e.target.value as FormField["type"],
                          // Reset type-specific properties
                          options: ["select", "radio"].includes(e.target.value)
                            ? e.target.value === "radio"
                              ? [
                                  { label: "Option A", value: "optionA" },
                                  { label: "Option B", value: "optionB" },
                                ]
                              : [
                                  { label: "Option 1", value: "option1" },
                                  { label: "Option 2", value: "option2" },
                                ]
                            : undefined,
                          placeholder: getDefaultPlaceholder(
                            e.target.value as FormField["type"],
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Select</option>
                      <option value="radio">Radio</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label *
                    </label>
                    <input
                      type="text"
                      value={selectedFieldData.label}
                      onChange={(e) =>
                        handleFieldUpdate({
                          ...selectedFieldData,
                          label: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter field label"
                    />
                  </div>

                  {!["checkbox", "radio"].includes(selectedFieldData.type) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Placeholder
                      </label>
                      <input
                        type="text"
                        value={selectedFieldData.placeholder || ""}
                        onChange={(e) =>
                          handleFieldUpdate({
                            ...selectedFieldData,
                            placeholder: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Enter placeholder text"
                      />
                    </div>
                  )}

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFieldData.required}
                      onChange={(e) =>
                        handleFieldUpdate({
                          ...selectedFieldData,
                          required: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Required field
                    </label>
                  </div>

                  {(selectedFieldData.type === "select" ||
                    selectedFieldData.type === "radio") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Options (one per line)
                      </label>
                      <textarea
                        value={
                          selectedFieldData.options
                            ?.map((opt) =>
                              typeof opt === "string" ? opt : opt.label,
                            )
                            .join("\n") || ""
                        }
                        onChange={(e) => {
                          const options = e.target.value
                            .split("\n")
                            .filter((opt) => opt.trim())
                            .map((opt) => ({
                              label: opt.trim(),
                              value: opt
                                .trim()
                                .toLowerCase()
                                .replace(/\s+/g, "_"),
                            }));
                          handleFieldUpdate({ ...selectedFieldData, options });
                        }}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedFieldData.type === "radio"
                          ? "Minimum 2 options required"
                          : "Minimum 1 option required"}
                      </p>
                    </div>
                  )}

                  {selectedFieldData.type === "textarea" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rows
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="10"
                        value={selectedFieldData.config?.rows || 4}
                        onChange={(e) =>
                          handleFieldUpdate({
                            ...selectedFieldData,
                            config: {
                              ...selectedFieldData.config,
                              rows: parseInt(e.target.value),
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
}

export default FormBuilder;
