"use client";

import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
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
import { Eye, EyeOff, X, AlertCircle } from "lucide-react";
import { TouchOptimizedButton } from "./touch-optimized-button";

interface MobileFormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

interface MobileTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  autoResize?: boolean;
}

interface MobileSelectProps {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}

/**
 * Mobile-optimized form field wrapper
 */
export function MobileFormField({
  label,
  error,
  required,
  className,
  children,
}: MobileFormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      {children}
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Mobile-optimized input with touch-friendly features
 */
export function MobileInput({
  label,
  error,
  showPasswordToggle = false,
  clearable = false,
  onClear,
  className,
  type = "text",
  ...props
}: MobileInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const inputType =
    showPasswordToggle && type === "password"
      ? showPassword
        ? "text"
        : "password"
      : type;

  const handleClear = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
    onClear?.();
  }, [onClear]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(!showPassword);
  }, [showPassword]);

  return (
    <MobileFormField label={label} error={error} required={props.required}>
      <div className="relative">
        <Input
          ref={inputRef}
          type={inputType}
          className={cn(
            "h-12 text-base", // Larger height and font size for mobile
            "pr-12", // Space for icons
            clearable && "pr-20", // More space if both clear and password toggle
            showPasswordToggle && "pr-12",
            clearable && showPasswordToggle && "pr-20",
            isFocused && "ring-2 ring-blue-500 dark:ring-blue-400",
            error && "border-red-500 dark:border-red-400",
            className,
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {/* Clear button */}
        {clearable && props.value && (
          <TouchOptimizedButton
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            onClick={handleClear}
            tabIndex={-1}
          >
            <X className="w-4 h-4" />
          </TouchOptimizedButton>
        )}

        {/* Password toggle */}
        {showPasswordToggle && type === "password" && (
          <TouchOptimizedButton
            variant="ghost"
            size="sm"
            className={cn(
              "absolute top-1/2 -translate-y-1/2 h-8 w-8 p-0",
              clearable ? "right-10" : "right-2",
            )}
            onClick={togglePasswordVisibility}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </TouchOptimizedButton>
        )}
      </div>
    </MobileFormField>
  );
}

/**
 * Mobile-optimized textarea with auto-resize
 */
export function MobileTextarea({
  label,
  error,
  autoResize = true,
  className,
  ...props
}: MobileTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleInput = useCallback(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [autoResize]);

  return (
    <MobileFormField label={label} error={error} required={props.required}>
      <Textarea
        ref={textareaRef}
        className={cn(
          "min-h-[96px] text-base resize-none", // Larger minimum height and font size
          isFocused && "ring-2 ring-blue-500 dark:ring-blue-400",
          error && "border-red-500 dark:border-red-400",
          className,
        )}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onInput={handleInput}
        {...props}
      />
    </MobileFormField>
  );
}

/**
 * Mobile-optimized select dropdown
 */
export function MobileSelect({
  label,
  error,
  placeholder,
  value,
  onValueChange,
  options,
  className,
}: MobileSelectProps) {
  return (
    <MobileFormField label={label} error={error}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className={cn(
            "h-12 text-base", // Larger height and font size
            error && "border-red-500 dark:border-red-400",
            className,
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="h-12 text-base" // Larger height for touch
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </MobileFormField>
  );
}

/**
 * Mobile-optimized checkbox with larger touch target
 */
export function MobileCheckbox({
  label,
  error,
  className,
  ...props
}: {
  label?: string;
  error?: string;
  className?: string;
} & React.ComponentProps<typeof Checkbox>) {
  return (
    <MobileFormField error={error} className={className}>
      <div className="flex items-center space-x-3 py-2">
        <Checkbox
          className="h-5 w-5" // Larger checkbox
          {...props}
        />
        {label && (
          <Label className="text-base font-normal cursor-pointer flex-1">
            {label}
          </Label>
        )}
      </div>
    </MobileFormField>
  );
}

/**
 * Mobile-optimized radio group
 */
export function MobileRadioGroup({
  label,
  error,
  options,
  value,
  onValueChange,
  className,
}: {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <MobileFormField label={label} error={error} className={className}>
      <RadioGroup
        value={value}
        onValueChange={onValueChange}
        className="space-y-3"
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-3 py-2">
            <RadioGroupItem
              value={option.value}
              id={option.value}
              className="h-5 w-5" // Larger radio button
            />
            <Label
              htmlFor={option.value}
              className="text-base font-normal cursor-pointer flex-1"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </MobileFormField>
  );
}

/**
 * Mobile-optimized form container
 */
export function MobileForm({
  children,
  onSubmit,
  className,
  ...props
}: {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
} & React.FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "space-y-6 p-4", // Generous spacing and padding
        className,
      )}
      {...props}
    >
      {children}
    </form>
  );
}

/**
 * Mobile form submit button
 */
export function MobileSubmitButton({
  children,
  loading = false,
  className,
  ...props
}: {
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <TouchOptimizedButton
      type="submit"
      className={cn(
        "w-full h-12 text-base font-medium", // Full width and larger
        className,
      )}
      loading={loading}
      {...props}
    >
      {children}
    </TouchOptimizedButton>
  );
}

/**
 * Mobile form validation hook
 */
export function useMobileForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules?: Partial<
    Record<keyof T, (value: any) => string | undefined>
  >,
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback(
    (field: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [field]: value }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors],
  );

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validate = useCallback(() => {
    if (!validationRules) return true;

    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationRules).forEach((field) => {
      const rule = validationRules[field as keyof T];
      if (rule) {
        const error = rule(values[field as keyof T]);
        if (error) {
          newErrors[field as keyof T] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
}
