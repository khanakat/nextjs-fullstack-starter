"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Plus,
  Minus,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  Hash,
  Type,
  List,
  CheckSquare,
  ToggleLeft,
  FileText,
  Mail,
  Phone,
  Link,
  AlertCircle,
  Trash2,
  GripVertical,
} from "lucide-react";

// Types
export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "tel"
  | "url"
  | "textarea"
  | "select"
  | "multiselect"
  | "checkbox"
  | "radio"
  | "switch"
  | "date"
  | "time"
  | "datetime-local"
  | "file"
  | "hidden"
  | "group"
  | "repeater";

export interface FieldOption {
  label: string;
  value: string;
  disabled?: boolean;
  description?: string;
}

export interface ValidationRule {
  type: "required" | "min" | "max" | "pattern" | "custom";
  value?: any;
  message: string;
  validator?: (value: any, formData: any) => boolean;
}

export interface ConditionalLogic {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "greater_than"
    | "less_than"
    | "is_empty"
    | "is_not_empty";
  value: any;
  action: "show" | "hide" | "enable" | "disable" | "require";
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  hidden?: boolean;
  options?: FieldOption[];
  validation?: ValidationRule[];
  conditional?: ConditionalLogic[];
  className?: string;
  attributes?: Record<string, any>;
  // For group fields
  fields?: FormField[];
  // For repeater fields
  minItems?: number;
  maxItems?: number;
  addButtonText?: string;
  removeButtonText?: string;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  conditional?: ConditionalLogic[];
}

export interface FormSchema {
  id: string;
  title: string;
  description?: string;
  sections: FormSection[];
  submitButtonText?: string;
  resetButtonText?: string;
  showResetButton?: boolean;
}

export interface DynamicFormProps {
  schema: FormSchema;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void> | void;
  onFieldChange?: (
    fieldId: string,
    value: any,
    formData: Record<string, any>,
  ) => void;
  onValidationChange?: (
    isValid: boolean,
    errors: Record<string, string[]>,
  ) => void;
  className?: string;
  disabled?: boolean;
  showValidationSummary?: boolean;
}

export interface FieldRendererProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string[];
  disabled?: boolean;
  formData: Record<string, any>;
}

// Field type icons
const fieldTypeIcons: Record<
  FieldType,
  React.ComponentType<{ className?: string }>
> = {
  text: Type,
  email: Mail,
  password: Eye,
  number: Hash,
  tel: Phone,
  url: Link,
  textarea: FileText,
  select: List,
  multiselect: List,
  checkbox: CheckSquare,
  radio: CheckSquare,
  switch: ToggleLeft,
  date: Calendar,
  time: Clock,
  "datetime-local": Calendar,
  file: FileText,
  hidden: EyeOff,
  group: FileText,
  repeater: FileText,
};

// Validation functions
function validateField(
  field: FormField,
  value: any,
  formData: Record<string, any>,
): string[] {
  const errors: string[] = [];

  if (!field.validation) return errors;

  for (const rule of field.validation) {
    switch (rule.type) {
      case "required":
        if (
          !value ||
          (Array.isArray(value) && value.length === 0) ||
          value === ""
        ) {
          errors.push(rule.message);
        }
        break;
      case "min":
        if (typeof value === "string" && value.length < rule.value) {
          errors.push(rule.message);
        } else if (typeof value === "number" && value < rule.value) {
          errors.push(rule.message);
        }
        break;
      case "max":
        if (typeof value === "string" && value.length > rule.value) {
          errors.push(rule.message);
        } else if (typeof value === "number" && value > rule.value) {
          errors.push(rule.message);
        }
        break;
      case "pattern":
        if (typeof value === "string" && !new RegExp(rule.value).test(value)) {
          errors.push(rule.message);
        }
        break;
      case "custom":
        if (rule.validator && !rule.validator(value, formData)) {
          errors.push(rule.message);
        }
        break;
    }
  }

  return errors;
}

// Conditional logic evaluation
function evaluateCondition(
  condition: ConditionalLogic,
  formData: Record<string, any>,
): boolean {
  const fieldValue = formData[condition.field];

  switch (condition.operator) {
    case "equals":
      return fieldValue === condition.value;
    case "not_equals":
      return fieldValue !== condition.value;
    case "contains":
      return (
        typeof fieldValue === "string" && fieldValue.includes(condition.value)
      );
    case "not_contains":
      return (
        typeof fieldValue === "string" && !fieldValue.includes(condition.value)
      );
    case "greater_than":
      return typeof fieldValue === "number" && fieldValue > condition.value;
    case "less_than":
      return typeof fieldValue === "number" && fieldValue < condition.value;
    case "is_empty":
      return (
        !fieldValue ||
        fieldValue === "" ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      );
    case "is_not_empty":
      return (
        fieldValue &&
        fieldValue !== "" &&
        (!Array.isArray(fieldValue) || fieldValue.length > 0)
      );
    default:
      return true;
  }
}

// Field Renderer Component
function FieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled,
  formData,
}: FieldRendererProps) {
  const [showPassword, setShowPassword] = useState(false);
  const hasError = error && error.length > 0;
  const IconComponent = fieldTypeIcons[field.type];

  // Handle repeater field
  if (field.type === "repeater") {
    const items = Array.isArray(value) ? value : [];
    const canAdd = !field.maxItems || items.length < field.maxItems;
    const canRemove = !field.minItems || items.length > field.minItems;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">{field.label}</Label>
          {canAdd && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newItem =
                  field.fields?.reduce(
                    (acc, f) => {
                      acc[f.id] = f.defaultValue || "";
                      return acc;
                    },
                    {} as Record<string, any>,
                  ) || {};
                onChange([...items, newItem]);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {field.addButtonText || "Add Item"}
            </Button>
          )}
        </div>

        {field.description && (
          <p className="text-sm text-muted-foreground">{field.description}</p>
        )}

        <div className="space-y-4">
          {items.map((item: any, index: number) => (
            <Card key={index} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Item {index + 1}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 cursor-grab"
                    >
                      <GripVertical className="h-4 w-4" />
                    </Button>
                    {canRemove && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newItems = items.filter((_, i) => i !== index);
                          onChange(newItems);
                        }}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {field.fields?.map((subField) => (
                    <FieldRenderer
                      key={subField.id}
                      field={subField}
                      value={item[subField.id]}
                      onChange={(newValue) => {
                        const newItems = [...items];
                        newItems[index] = {
                          ...newItems[index],
                          [subField.id]: newValue,
                        };
                        onChange(newItems);
                      }}
                      disabled={disabled || subField.disabled}
                      formData={formData}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <IconComponent className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No items added yet</p>
          </div>
        )}
      </div>
    );
  }

  // Handle group field
  if (field.type === "group") {
    return (
      <div className="space-y-4">
        <Label className="text-base font-medium">{field.label}</Label>
        {field.description && (
          <p className="text-sm text-muted-foreground">{field.description}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
          {field.fields?.map((subField) => (
            <FieldRenderer
              key={subField.id}
              field={subField}
              value={value?.[subField.id]}
              onChange={(newValue) => {
                onChange({ ...value, [subField.id]: newValue });
              }}
              disabled={disabled || subField.disabled}
              formData={formData}
            />
          ))}
        </div>
      </div>
    );
  }

  const commonProps = {
    id: field.id,
    disabled: disabled || field.disabled,
    readOnly: field.readonly,
    className: cn(hasError && "border-destructive", field.className),
    ...field.attributes,
  };

  return (
    <div className="space-y-2">
      {field.type !== "hidden" &&
        field.type !== "checkbox" &&
        field.type !== "switch" && (
          <Label htmlFor={field.id} className="flex items-center gap-2">
            <IconComponent className="h-4 w-4" />
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
        )}

      {field.description && field.type !== "hidden" && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}

      {/* Render field based on type */}
      {field.type === "text" && (
        <Input
          {...commonProps}
          type="text"
          placeholder={field.placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === "email" && (
        <Input
          {...commonProps}
          type="email"
          placeholder={field.placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === "password" && (
        <div className="relative">
          <Input
            {...commonProps}
            type={showPassword ? "text" : "password"}
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {field.type === "number" && (
        <Input
          {...commonProps}
          type="number"
          placeholder={field.placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.valueAsNumber || "")}
        />
      )}

      {field.type === "tel" && (
        <Input
          {...commonProps}
          type="tel"
          placeholder={field.placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === "url" && (
        <Input
          {...commonProps}
          type="url"
          placeholder={field.placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === "textarea" && (
        <Textarea
          {...commonProps}
          placeholder={field.placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      )}

      {field.type === "select" && (
        <Select
          value={value || ""}
          onValueChange={onChange}
          disabled={commonProps.disabled}
        >
          <SelectTrigger className={commonProps.className}>
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                <div>
                  <div>{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === "multiselect" && (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`${field.id}-${option.value}`}
                checked={Array.isArray(value) && value.includes(option.value)}
                onCheckedChange={(checked) => {
                  const currentValues = Array.isArray(value) ? value : [];
                  if (checked) {
                    onChange([...currentValues, option.value]);
                  } else {
                    onChange(currentValues.filter((v) => v !== option.value));
                  }
                }}
                disabled={commonProps.disabled || option.disabled}
              />
              <Label
                htmlFor={`${field.id}-${option.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {option.label}
                {option.description && (
                  <span className="block text-xs text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </Label>
            </div>
          ))}
        </div>
      )}

      {field.type === "checkbox" && (
        <div className="flex items-center space-x-2">
          <Checkbox
            {...commonProps}
            checked={!!value}
            onCheckedChange={onChange}
          />
          <Label
            htmlFor={field.id}
            className="text-sm font-normal cursor-pointer"
          >
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
      )}

      {field.type === "radio" && (
        <RadioGroup
          value={value || ""}
          onValueChange={onChange}
          disabled={commonProps.disabled}
        >
          {field.options?.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem
                value={option.value}
                id={`${field.id}-${option.value}`}
                disabled={option.disabled}
              />
              <Label
                htmlFor={`${field.id}-${option.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {option.label}
                {option.description && (
                  <span className="block text-xs text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {field.type === "switch" && (
        <div className="flex items-center space-x-2">
          <Switch
            {...commonProps}
            checked={!!value}
            onCheckedChange={onChange}
          />
          <Label
            htmlFor={field.id}
            className="text-sm font-normal cursor-pointer"
          >
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
      )}

      {(field.type === "date" ||
        field.type === "time" ||
        field.type === "datetime-local") && (
        <Input
          {...commonProps}
          type={field.type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === "file" && (
        <Input
          {...commonProps}
          type="file"
          onChange={(e) => onChange(e.target.files)}
        />
      )}

      {field.type === "hidden" && (
        <input {...commonProps} type="hidden" value={value || ""} />
      )}

      {/* Error display */}
      {hasError && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            {error.map((err, index) => (
              <p key={index}>{err}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Dynamic Form Component
export function DynamicForm({
  schema,
  initialData = {},
  onSubmit,
  onFieldChange,
  onValidationChange,
  className,
  disabled = false,
  showValidationSummary = true,
}: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(schema.sections.filter((s) => s.defaultCollapsed).map((s) => s.id)),
  );

  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string[]> = {};

    const validateFieldsRecursively = (fields: FormField[]) => {
      fields.forEach((field) => {
        if (field.type === "group" && field.fields) {
          validateFieldsRecursively(field.fields);
        } else if (field.type === "repeater" && field.fields) {
          const items = Array.isArray(formData[field.id])
            ? formData[field.id]
            : [];
          items.forEach((item: any, index: number) => {
            field.fields?.forEach((subField) => {
              const fieldErrors = validateField(
                subField,
                item[subField.id],
                formData,
              );
              if (fieldErrors.length > 0) {
                newErrors[`${field.id}[${index}].${subField.id}`] = fieldErrors;
              }
            });
          });
        } else {
          const fieldErrors = validateField(
            field,
            formData[field.id],
            formData,
          );
          if (fieldErrors.length > 0) {
            newErrors[field.id] = fieldErrors;
          }
        }
      });
    };

    schema.sections.forEach((section) => {
      validateFieldsRecursively(section.fields);
    });

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidationChange?.(isValid, newErrors);
    return isValid;
  }, [formData, schema.sections, onValidationChange]);

  // Handle field change
  const handleFieldChange = useCallback(
    (fieldId: string, value: any) => {
      const newFormData = { ...formData, [fieldId]: value };
      setFormData(newFormData);
      onFieldChange?.(fieldId, value, newFormData);

      // Clear errors for this field
      if (errors[fieldId]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[fieldId];
          return newErrors;
        });
      }
    },
    [formData, errors, onFieldChange],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error("Form submission failed:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onSubmit, validateForm],
  );

  // Handle form reset
  const handleReset = useCallback(() => {
    setFormData(initialData);
    setErrors({});
  }, [initialData]);

  // Toggle section collapse
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Check if field should be visible/enabled based on conditional logic
  const evaluateFieldConditions = useCallback(
    (conditions: ConditionalLogic[] | undefined) => {
      if (!conditions) return { visible: true, enabled: true, required: false };

      let visible = true;
      let enabled = true;
      let required = false;

      conditions.forEach((condition) => {
        const conditionMet = evaluateCondition(condition, formData);

        switch (condition.action) {
          case "show":
            if (!conditionMet) visible = false;
            break;
          case "hide":
            if (conditionMet) visible = false;
            break;
          case "enable":
            if (!conditionMet) enabled = false;
            break;
          case "disable":
            if (conditionMet) enabled = false;
            break;
          case "require":
            if (conditionMet) required = true;
            break;
        }
      });

      return { visible, enabled, required };
    },
    [formData],
  );

  // Render fields recursively
  const renderFields = useCallback(
    (fields: FormField[]) => {
      return fields.map((field) => {
        const conditions = evaluateFieldConditions(field.conditional);

        if (!conditions.visible) return null;

        return (
          <FieldRenderer
            key={field.id}
            field={{
              ...field,
              required: field.required || conditions.required,
            }}
            value={formData[field.id]}
            onChange={(value) => handleFieldChange(field.id, value)}
            error={errors[field.id]}
            disabled={disabled || !conditions.enabled}
            formData={formData}
          />
        );
      });
    },
    [formData, errors, disabled, evaluateFieldConditions, handleFieldChange],
  );

  const totalErrors = Object.keys(errors).length;
  const hasErrors = totalErrors > 0;

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-8", className)}>
      {/* Form Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{schema.title}</h1>
        {schema.description && (
          <p className="text-muted-foreground">{schema.description}</p>
        )}
      </div>

      {/* Validation Summary */}
      {showValidationSummary && hasErrors && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Please fix the following errors
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {Object.entries(errors).map(([fieldId, fieldErrors]) => (
                <div key={fieldId} className="text-sm">
                  <span className="font-medium">{fieldId}:</span>
                  <ul className="ml-4 list-disc">
                    {fieldErrors.map((error, index) => (
                      <li key={index} className="text-destructive">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Sections */}
      {schema.sections.map((section) => {
        const sectionConditions = evaluateFieldConditions(section.conditional);
        if (!sectionConditions.visible) return null;

        const isCollapsed = collapsedSections.has(section.id);

        return (
          <Card key={section.id}>
            <CardHeader
              className={cn(
                section.collapsible && "cursor-pointer hover:bg-muted/50",
                "transition-colors",
              )}
              onClick={
                section.collapsible
                  ? () => toggleSection(section.id)
                  : undefined
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{section.title}</CardTitle>
                  {section.description && (
                    <CardDescription className="mt-1">
                      {section.description}
                    </CardDescription>
                  )}
                </div>
                {section.collapsible && (
                  <Button variant="ghost" size="sm" type="button">
                    {isCollapsed ? (
                      <Plus className="h-4 w-4" />
                    ) : (
                      <Minus className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>

            {(!section.collapsible || !isCollapsed) && (
              <CardContent className="space-y-6">
                {renderFields(section.fields)}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex items-center gap-4">
          {schema.showResetButton && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={disabled || isSubmitting}
            >
              {schema.resetButtonText || "Reset"}
            </Button>
          )}

          {hasErrors && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {totalErrors} error{totalErrors !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <Button
          type="submit"
          disabled={disabled || isSubmitting || hasErrors}
          className="flex items-center gap-2"
        >
          {isSubmitting && <Clock className="h-4 w-4 animate-spin" />}
          {schema.submitButtonText || "Submit"}
        </Button>
      </div>
    </form>
  );
}

// Form Builder utility functions
export const formBuilder = {
  createField: (
    overrides: Partial<FormField> & Pick<FormField, "id" | "type" | "label">,
  ): FormField => ({
    placeholder: "",
    required: false,
    disabled: false,
    readonly: false,
    hidden: false,
    ...overrides,
  }),

  createSection: (
    overrides: Partial<FormSection> &
      Pick<FormSection, "id" | "title" | "fields">,
  ): FormSection => ({
    collapsible: false,
    defaultCollapsed: false,
    ...overrides,
  }),

  createSchema: (
    overrides: Partial<FormSchema> &
      Pick<FormSchema, "id" | "title" | "sections">,
  ): FormSchema => ({
    submitButtonText: "Submit",
    resetButtonText: "Reset",
    showResetButton: false,
    ...overrides,
  }),
};

// Preset form schemas
export const presetSchemas = {
  contactForm: formBuilder.createSchema({
    id: "contact-form",
    title: "Contact Us",
    description: "Get in touch with our team",
    sections: [
      formBuilder.createSection({
        id: "personal-info",
        title: "Personal Information",
        fields: [
          formBuilder.createField({
            id: "firstName",
            type: "text",
            label: "First Name",
            required: true,
            validation: [
              { type: "required", message: "First name is required" },
              {
                type: "min",
                value: 2,
                message: "First name must be at least 2 characters",
              },
            ],
          }),
          formBuilder.createField({
            id: "lastName",
            type: "text",
            label: "Last Name",
            required: true,
            validation: [
              { type: "required", message: "Last name is required" },
              {
                type: "min",
                value: 2,
                message: "Last name must be at least 2 characters",
              },
            ],
          }),
          formBuilder.createField({
            id: "email",
            type: "email",
            label: "Email Address",
            required: true,
            validation: [
              { type: "required", message: "Email is required" },
              {
                type: "pattern",
                value: "^[^@]+@[^@]+\\.[^@]+$",
                message: "Please enter a valid email address",
              },
            ],
          }),
        ],
      }),
      formBuilder.createSection({
        id: "message",
        title: "Your Message",
        fields: [
          formBuilder.createField({
            id: "subject",
            type: "select",
            label: "Subject",
            required: true,
            options: [
              { label: "General Inquiry", value: "general" },
              { label: "Technical Support", value: "support" },
              { label: "Sales Question", value: "sales" },
              { label: "Partnership", value: "partnership" },
            ],
            validation: [
              { type: "required", message: "Please select a subject" },
            ],
          }),
          formBuilder.createField({
            id: "message",
            type: "textarea",
            label: "Message",
            placeholder: "Tell us how we can help you...",
            required: true,
            validation: [
              { type: "required", message: "Message is required" },
              {
                type: "min",
                value: 10,
                message: "Message must be at least 10 characters",
              },
            ],
          }),
        ],
      }),
    ],
  }),
};
