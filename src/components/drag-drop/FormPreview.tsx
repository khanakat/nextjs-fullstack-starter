"use client";

import React, { useState } from "react";
import { FormField } from "@/src/types/drag-drop";
import { Eye, Copy, Check, AlertCircle, CheckCircle } from "lucide-react";

interface ValidationError {
  fieldId: string;
  message: string;
  type: "error" | "warning";
}

interface FormPreviewProps {
  fields: FormField[];
  validationErrors?: ValidationError[];
}

export function FormPreview({
  fields,
  validationErrors = [],
}: FormPreviewProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [copied, setCopied] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const hasErrors = validationErrors.some((error) => error.type === "error");
  const formErrors = validationErrors.filter(
    (error) => error.fieldId === "form",
  );

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const validateFormData = () => {
    const errors: string[] = [];

    fields.forEach((field) => {
      if (
        field.required &&
        (!formData[field.id] || formData[field.id] === "")
      ) {
        errors.push(`${field.label} is required`);
      }

      if (field.type === "email" && formData[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.id])) {
          errors.push(`${field.label} must be a valid email address`);
        }
      }
    });

    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    const formValidationErrors = validateFormData();

    if (hasErrors || formValidationErrors.length > 0) {
      alert("Please fix all errors before submitting the form.");
      return;
    }

    // Form data would be processed here (e.g., sent to API)
    alert(
      "Form submitted successfully!\n\nData:\n" +
        JSON.stringify(formData, null, 2),
    );
  };

  const copyFormData = () => {
    navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFieldErrors = (fieldId: string) => {
    return validationErrors.filter((error) => error.fieldId === fieldId);
  };

  const renderField = (field: FormField) => {
    const fieldErrors = getFieldErrors(field.id);
    const hasFieldErrors = fieldErrors.some((error) => error.type === "error");
    const hasFieldWarnings = fieldErrors.some(
      (error) => error.type === "warning",
    );

    const commonProps = {
      id: field.id,
      name: field.id,
      required: field.required,
      className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
        hasFieldErrors
          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
          : hasFieldWarnings
            ? "border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500"
            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
      }`,
      value: formData[field.id] || "",
      onChange: (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) => handleInputChange(field.id, e.target.value),
    };

    const renderFieldInput = () => {
      switch (field.type) {
        case "text":
        case "email":
        case "number":
        case "date":
          return (
            <input
              {...commonProps}
              type={field.type}
              placeholder={field.placeholder}
            />
          );
        case "textarea":
          return (
            <textarea
              {...commonProps}
              placeholder={field.placeholder}
              rows={field.config?.rows || 4}
              className={commonProps.className + " resize-none"}
            />
          );
        case "select":
          return (
            <select {...commonProps}>
              <option value="">Select an option</option>
              {field.options?.map((option, index) => (
                <option
                  key={index}
                  value={typeof option === "string" ? option : option.value}
                >
                  {typeof option === "string" ? option : option.label}
                </option>
              ))}
            </select>
          );
        case "radio":
          return (
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="radio"
                    id={`${field.id}-${index}`}
                    name={field.id}
                    value={typeof option === "string" ? option : option.value}
                    checked={
                      formData[field.id] ===
                      (typeof option === "string" ? option : option.value)
                    }
                    onChange={(e) =>
                      handleInputChange(field.id, e.target.value)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    required={field.required}
                  />
                  <label
                    htmlFor={`${field.id}-${index}`}
                    className="ml-2 block text-sm text-gray-900"
                  >
                    {typeof option === "string" ? option : option.label}
                  </label>
                </div>
              ))}
            </div>
          );
        case "checkbox":
          return (
            <div className="flex items-center">
              <input
                type="checkbox"
                id={field.id}
                name={field.id}
                checked={!!formData[field.id]}
                onChange={(e) => handleInputChange(field.id, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                required={field.required}
              />
              <label
                htmlFor={field.id}
                className="ml-2 block text-sm text-gray-900"
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div key={field.id} className="space-y-2">
        {field.type !== "checkbox" && (
          <label
            htmlFor={field.id}
            className="block text-sm font-medium text-gray-700"
          >
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {renderFieldInput()}

        {/* Field Validation Errors */}
        {fieldErrors.length > 0 && (
          <div className="text-sm">
            {fieldErrors.map((error, index) => (
              <div
                key={index}
                className={`flex items-center gap-1 ${
                  error.type === "error" ? "text-red-600" : "text-yellow-600"
                }`}
              >
                <AlertCircle size={14} />
                <span>{error.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const formValidationErrors = submitAttempted ? validateFormData() : [];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Eye size={20} className="text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Form Preview</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Validation Status */}
          <div className="flex items-center gap-2">
            {hasErrors ? (
              <div className="flex items-center text-red-600">
                <AlertCircle size={16} className="mr-1" />
                <span className="text-sm">Has errors</span>
              </div>
            ) : (
              <div className="flex items-center text-green-600">
                <CheckCircle size={16} className="mr-1" />
                <span className="text-sm">Valid</span>
              </div>
            )}
          </div>

          <button
            onClick={copyFormData}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy Data"}
          </button>
        </div>
      </div>

      {/* Form Errors Display */}
      {formErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center mb-2">
            <AlertCircle size={16} className="text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-800">
              Form Configuration Issues:
            </span>
          </div>
          <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
            {formErrors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Form Validation Errors */}
      {formValidationErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center mb-2">
            <AlertCircle size={16} className="text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-800">
              Please fix the following errors:
            </span>
          </div>
          <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
            {formValidationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {fields.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-lg mb-2">No fields to preview</div>
          <div className="text-sm">Add some fields to see the form preview</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map(renderField)}

          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={hasErrors}
              className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                hasErrors
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              }`}
            >
              {hasErrors ? "Fix errors to submit" : "Submit Form"}
            </button>
          </div>
        </form>
      )}

      {/* Form Data Display */}
      {Object.keys(formData).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Current Form Data:
          </h3>
          <pre className="text-xs bg-gray-50 p-3 rounded-md overflow-auto max-h-40">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default FormPreview;
