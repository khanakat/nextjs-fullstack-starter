"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Clock,
} from "lucide-react";

// Types
export type ValidationLevel = "error" | "warning" | "info" | "success";

export interface ValidationResult {
  isValid: boolean;
  level: ValidationLevel;
  message: string;
  field?: string;
  code?: string;
}

export interface ValidationRule {
  name: string;
  validator: (
    value: any,
    formData?: any,
  ) => ValidationResult | Promise<ValidationResult>;
  trigger?: "onChange" | "onBlur" | "onSubmit";
  debounce?: number;
  dependencies?: string[];
}

export interface FieldValidationConfig {
  rules: ValidationRule[];
  showValidationState?: boolean;
  showStrengthMeter?: boolean;
  realTimeValidation?: boolean;
  validateOnMount?: boolean;
}

export interface FormValidationConfig {
  fields: Record<string, FieldValidationConfig>;
  globalRules?: ValidationRule[];
  showSummary?: boolean;
  stopOnFirstError?: boolean;
}

export interface ValidationContextType {
  validateField: (
    fieldName: string,
    value: any,
    formData?: any,
  ) => Promise<ValidationResult[]>;
  validateForm: (formData: any) => Promise<ValidationResult[]>;
  getFieldValidation: (fieldName: string) => ValidationResult[];
  isFieldValid: (fieldName: string) => boolean;
  isFormValid: () => boolean;
  clearFieldValidation: (fieldName: string) => void;
  clearAllValidation: () => void;
}

// Validation Context
const ValidationContext = React.createContext<ValidationContextType | null>(
  null,
);

export function useValidation() {
  const context = React.useContext(ValidationContext);
  if (!context) {
    throw new Error("useValidation must be used within a ValidationProvider");
  }
  return context;
}

// Built-in validation rules
export const validationRules = {
  required: (message = "This field is required"): ValidationRule => ({
    name: "required",
    validator: (value) => ({
      isValid: value !== null && value !== undefined && value !== "",
      level: "error" as ValidationLevel,
      message,
      code: "REQUIRED",
    }),
    trigger: "onChange",
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    name: "minLength",
    validator: (value) => ({
      isValid: !value || value.length >= min,
      level: "error" as ValidationLevel,
      message: message || `Must be at least ${min} characters`,
      code: "MIN_LENGTH",
    }),
    trigger: "onChange",
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    name: "maxLength",
    validator: (value) => ({
      isValid: !value || value.length <= max,
      level: "error" as ValidationLevel,
      message: message || `Must be no more than ${max} characters`,
      code: "MAX_LENGTH",
    }),
    trigger: "onChange",
  }),

  pattern: (regex: RegExp, message = "Invalid format"): ValidationRule => ({
    name: "pattern",
    validator: (value) => ({
      isValid: !value || regex.test(value),
      level: "error" as ValidationLevel,
      message,
      code: "PATTERN",
    }),
    trigger: "onChange",
  }),

  email: (message = "Please enter a valid email address"): ValidationRule => ({
    name: "email",
    validator: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: !value || emailRegex.test(value),
        level: "error" as ValidationLevel,
        message,
        code: "EMAIL",
      };
    },
    trigger: "onChange",
  }),

  url: (message = "Please enter a valid URL"): ValidationRule => ({
    name: "url",
    validator: (value) => {
      try {
        if (!value)
          return {
            isValid: true,
            level: "success" as ValidationLevel,
            message: "",
          };
        new URL(value);
        return {
          isValid: true,
          level: "success" as ValidationLevel,
          message: "Valid URL",
        };
      } catch {
        return {
          isValid: false,
          level: "error" as ValidationLevel,
          message,
          code: "URL",
        };
      }
    },
    trigger: "onChange",
  }),

  numeric: (message = "Must be a valid number"): ValidationRule => ({
    name: "numeric",
    validator: (value) => ({
      isValid: !value || !isNaN(Number(value)),
      level: "error" as ValidationLevel,
      message,
      code: "NUMERIC",
    }),
    trigger: "onChange",
  }),

  min: (min: number, message?: string): ValidationRule => ({
    name: "min",
    validator: (value) => ({
      isValid: !value || Number(value) >= min,
      level: "error" as ValidationLevel,
      message: message || `Must be at least ${min}`,
      code: "MIN",
    }),
    trigger: "onChange",
  }),

  max: (max: number, message?: string): ValidationRule => ({
    name: "max",
    validator: (value) => ({
      isValid: !value || Number(value) <= max,
      level: "error" as ValidationLevel,
      message: message || `Must be no more than ${max}`,
      code: "MAX",
    }),
    trigger: "onChange",
  }),

  passwordStrength: (message = "Password is too weak"): ValidationRule => ({
    name: "passwordStrength",
    validator: (value) => {
      if (!value)
        return { isValid: true, level: "info" as ValidationLevel, message: "" };

      const strength = calculatePasswordStrength(value);

      if (strength.score >= 3) {
        return {
          isValid: true,
          level: "success" as ValidationLevel,
          message: "Strong password",
        };
      } else if (strength.score >= 2) {
        return {
          isValid: true,
          level: "warning" as ValidationLevel,
          message: "Moderate password",
        };
      } else {
        return {
          isValid: false,
          level: "error" as ValidationLevel,
          message,
          code: "WEAK_PASSWORD",
        };
      }
    },
    trigger: "onChange",
    debounce: 300,
  }),

  confirmPassword: (
    passwordField: string,
    message = "Passwords do not match",
  ): ValidationRule => ({
    name: "confirmPassword",
    validator: (value, formData) => ({
      isValid: !value || value === formData?.[passwordField],
      level: "error" as ValidationLevel,
      message,
      code: "PASSWORD_MISMATCH",
    }),
    trigger: "onChange",
    dependencies: [passwordField],
  }),

  async: (
    asyncValidator: (value: any) => Promise<boolean>,
    message = "Validation failed",
  ): ValidationRule => ({
    name: "async",
    validator: async (value) => {
      try {
        const isValid = await asyncValidator(value);
        return {
          isValid,
          level: "error" as ValidationLevel,
          message: isValid ? "Valid" : message,
          code: "ASYNC",
        };
      } catch (error) {
        return {
          isValid: false,
          level: "error" as ValidationLevel,
          message: "Validation error occurred",
          code: "ASYNC_ERROR",
        };
      }
    },
    trigger: "onBlur",
    debounce: 500,
  }),
};

// Password strength calculation
function calculatePasswordStrength(password: string) {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[^A-Za-z0-9]/.test(password),
  };

  Object.values(checks).forEach((check) => {
    if (check) score++;
  });

  return {
    score,
    checks,
    percentage: (score / 5) * 100,
    label:
      ["Very Weak", "Weak", "Fair", "Good", "Strong"][score] || "Very Weak",
  };
}

// Validation Provider Component
export function ValidationProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config: FormValidationConfig;
}) {
  const [fieldValidations, setFieldValidations] = useState<
    Record<string, ValidationResult[]>
  >({});
  useState<Record<string, NodeJS.Timeout>>({});

  const validateField = useCallback(
    async (
      fieldName: string,
      value: any,
      formData?: any,
    ): Promise<ValidationResult[]> => {
      const fieldConfig = config.fields[fieldName];
      if (!fieldConfig) return [];

      const results: ValidationResult[] = [];

      for (const rule of fieldConfig.rules) {
        try {
          const result = await rule.validator(value, formData);
          results.push({ ...result, field: fieldName });

          if (!result.isValid && config.stopOnFirstError) {
            break;
          }
        } catch (error) {
          results.push({
            isValid: false,
            level: "error",
            message: "Validation error occurred",
            field: fieldName,
            code: "VALIDATION_ERROR",
          });
        }
      }

      setFieldValidations((prev) => ({
        ...prev,
        [fieldName]: results,
      }));

      return results;
    },
    [config],
  );

  const validateForm = useCallback(
    async (formData: any): Promise<ValidationResult[]> => {
      const allResults: ValidationResult[] = [];

      // Validate all fields
      for (const fieldName of Object.keys(config.fields)) {
        const results = await validateField(
          fieldName,
          formData[fieldName],
          formData,
        );
        allResults.push(...results);
      }

      // Validate global rules
      if (config.globalRules) {
        for (const rule of config.globalRules) {
          try {
            const result = await rule.validator(formData);
            allResults.push(result);
          } catch (error) {
            allResults.push({
              isValid: false,
              level: "error",
              message: "Global validation error occurred",
              code: "GLOBAL_VALIDATION_ERROR",
            });
          }
        }
      }

      return allResults;
    },
    [config, validateField],
  );

  const getFieldValidation = useCallback(
    (fieldName: string): ValidationResult[] => {
      return fieldValidations[fieldName] || [];
    },
    [fieldValidations],
  );

  const isFieldValid = useCallback(
    (fieldName: string): boolean => {
      const results = getFieldValidation(fieldName);
      return results.every((result) => result.isValid);
    },
    [getFieldValidation],
  );

  const isFormValid = useCallback((): boolean => {
    return Object.keys(config.fields).every((fieldName) =>
      isFieldValid(fieldName),
    );
  }, [config.fields, isFieldValid]);

  const clearFieldValidation = useCallback((fieldName: string) => {
    setFieldValidations((prev) => {
      const newValidations = { ...prev };
      delete newValidations[fieldName];
      return newValidations;
    });
  }, []);

  const clearAllValidation = useCallback(() => {
    setFieldValidations({});
  }, []);

  const contextValue: ValidationContextType = {
    validateField,
    validateForm,
    getFieldValidation,
    isFieldValid,
    isFormValid,
    clearFieldValidation,
    clearAllValidation,
  };

  return (
    <ValidationContext.Provider value={contextValue}>
      {children}
    </ValidationContext.Provider>
  );
}

// Validation State Component
export function ValidationState({
  results,
  className,
  showIcon = true,
  compact = false,
}: {
  results: ValidationResult[];
  className?: string;
  showIcon?: boolean;
  compact?: boolean;
}) {
  if (results.length === 0) return null;

  const errorResults = results.filter((r) => !r.isValid && r.level === "error");
  const warningResults = results.filter((r) => r.level === "warning");
  const infoResults = results.filter((r) => r.level === "info");
  const successResults = results.filter(
    (r) => r.isValid && r.level === "success",
  );

  const getIcon = (level: ValidationLevel) => {
    switch (level) {
      case "error":
        return XCircle;
      case "warning":
        return AlertCircle;
      case "info":
        return Info;
      case "success":
        return CheckCircle2;
      default:
        return Info;
    }
  };

  const getColor = (level: ValidationLevel) => {
    switch (level) {
      case "error":
        return "text-destructive";
      case "warning":
        return "text-yellow-600";
      case "info":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className={cn("space-y-1", className)}>
      {[
        ...errorResults,
        ...warningResults,
        ...infoResults,
        ...successResults,
      ].map((result, index) => {
        const Icon = getIcon(result.level);
        const colorClass = getColor(result.level);

        return (
          <div
            key={index}
            className={cn(
              "flex items-start gap-2",
              compact ? "text-xs" : "text-sm",
              colorClass,
            )}
          >
            {showIcon && (
              <Icon
                className={cn(
                  "flex-shrink-0 mt-0.5",
                  compact ? "h-3 w-3" : "h-4 w-4",
                )}
              />
            )}
            <span>{result.message}</span>
          </div>
        );
      })}
    </div>
  );
}

// Password Strength Meter Component
export function PasswordStrengthMeter({
  password,
  className,
  showDetails = true,
}: {
  password: string;
  className?: string;
  showDetails?: boolean;
}) {
  const strength = useMemo(
    () => calculatePasswordStrength(password),
    [password],
  );

  if (!password) return null;

  const getStrengthColor = (score: number) => {
    if (score >= 4) return "bg-green-500";
    if (score >= 3) return "bg-yellow-500";
    if (score >= 2) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Progress
            value={strength.percentage}
            className={cn("h-2", getStrengthColor(strength.score))}
          />
        </div>
        <Badge
          variant={strength.score >= 3 ? "default" : "destructive"}
          className="text-xs"
        >
          {strength.label}
        </Badge>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(strength.checks).map(([check, passed]) => (
            <div
              key={check}
              className={cn(
                "flex items-center gap-1",
                passed ? "text-green-600" : "text-muted-foreground",
              )}
            >
              {passed ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              <span className="capitalize">
                {check === "length" ? "8+ characters" : check}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Validated Input Component
export function ValidatedInput({
  name,
  type = "text",
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  className,
  showValidationState = true,
  showPasswordStrength = false,
  realTimeValidation = true,
  disabled,
  required,
  ...props
}: {
  name: string;
  type?: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  showValidationState?: boolean;
  showPasswordStrength?: boolean;
  realTimeValidation?: boolean;
  disabled?: boolean;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const validation = useValidation();
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const results = validation.getFieldValidation(name);
  const isValid = validation.isFieldValid(name);
  const hasErrors = results.some((r) => !r.isValid && r.level === "error");

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      if (realTimeValidation) {
        setIsValidating(true);
        await validation.validateField(name, newValue);
        setIsValidating(false);
      }
    },
    [onChange, realTimeValidation, validation, name],
  );

  const handleBlur = useCallback(async () => {
    setIsValidating(true);
    await validation.validateField(name, value);
    setIsValidating(false);
    onBlur?.();
  }, [validation, name, value, onBlur]);

  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={name} className="flex items-center gap-2">
          {label}
          {required && <span className="text-destructive">*</span>}
          {isValidating && <Clock className="h-3 w-3 animate-spin" />}
        </Label>
      )}

      <div className="relative">
        <Input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            hasErrors && "border-destructive focus:ring-destructive",
            isValid &&
              results.length > 0 &&
              "border-green-500 focus:ring-green-500",
          )}
          {...props}
        />

        {type === "password" && (
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
        )}

        {isValid && results.length > 0 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>

      {showPasswordStrength && type === "password" && (
        <PasswordStrengthMeter password={value} />
      )}

      {showValidationState && <ValidationState results={results} />}
    </div>
  );
}

// Validation Summary Component
export function ValidationSummary({
  results,
  className,
  title = "Validation Summary",
  showSuccessCount = false,
}: {
  results: ValidationResult[];
  className?: string;
  title?: string;
  showSuccessCount?: boolean;
}) {
  const errorCount = results.filter(
    (r) => !r.isValid && r.level === "error",
  ).length;
  const warningCount = results.filter((r) => r.level === "warning").length;
  const successCount = results.filter(
    (r) => r.isValid && r.level === "success",
  ).length;

  if (results.length === 0) return null;

  return (
    <Card
      className={cn(
        "border-l-4",
        errorCount > 0 ? "border-l-destructive" : "border-l-green-500",
        className,
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {errorCount > 0 ? (
            <XCircle className="h-5 w-5 text-destructive" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
          {title}
        </CardTitle>
        <CardDescription>
          <div className="flex items-center gap-4 text-sm">
            {errorCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {errorCount} error{errorCount !== 1 ? "s" : ""}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 text-yellow-600 border-yellow-600"
              >
                <AlertCircle className="h-3 w-3" />
                {warningCount} warning{warningCount !== 1 ? "s" : ""}
              </Badge>
            )}
            {showSuccessCount && successCount > 0 && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 text-green-600 border-green-600"
              >
                <CheckCircle2 className="h-3 w-3" />
                {successCount} valid
              </Badge>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ValidationState results={results} />
      </CardContent>
    </Card>
  );
}

// Real-time Validation Hook
export function useRealTimeValidation(
  fieldName: string,
  value: any,
  formData?: any,
  debounce = 300,
) {
  const validation = useValidation();
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsValidating(true);
      await validation.validateField(fieldName, value, formData);
      setIsValidating(false);
    }, debounce);

    return () => clearTimeout(timer);
  }, [validation, fieldName, value, formData, debounce]);

  return {
    results: validation.getFieldValidation(fieldName),
    isValid: validation.isFieldValid(fieldName),
    isValidating,
  };
}
