"use client";

import React, { useState, useCallback, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Clock,
  FileText,
  User,
  CreditCard,
  Settings,
} from "lucide-react";

// Types
export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<any>;
  validation?: (data: any) => Promise<string[]> | string[];
  optional?: boolean;
  disabled?: boolean;
  hidden?: boolean;
}

export interface WizardContextType {
  currentStep: number;
  steps: WizardStep[];
  data: Record<string, any>;
  errors: Record<string, string[]>;
  isLoading: boolean;
  isValid: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  goToStep: (step: number) => void;
  nextStep: () => Promise<void>;
  previousStep: () => void;
  updateData: (stepId: string, stepData: any) => void;
  setErrors: (stepId: string, errors: string[]) => void;
  validateStep: (stepIndex: number) => Promise<boolean>;
  submitWizard: () => Promise<void>;
}

export interface FormWizardProps {
  steps: WizardStep[];
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onStepChange?: (step: number, stepId: string) => void;
  initialData?: Record<string, any>;
  className?: string;
  showProgress?: boolean;
  showStepList?: boolean;
  allowSkipOptional?: boolean;
  persistData?: boolean;
  storageKey?: string;
}

export interface StepNavigationProps {
  className?: string;
  showStepNumbers?: boolean;
  compact?: boolean;
}

export interface StepContentProps {
  className?: string;
  showHeader?: boolean;
  showDescription?: boolean;
}

// Context
const WizardContext = createContext<WizardContextType | null>(null);

// Hook
export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a FormWizard");
  }
  return context;
}

// Step Navigation Component
export function StepNavigation({
  className,
  showStepNumbers = true,
  compact = false,
}: StepNavigationProps) {
  const { currentStep, steps, goToStep, errors } = useWizard();

  return (
    <nav className={cn("space-y-1", className)}>
      {steps.map((step, index) => {
        if (step.hidden) return null;

        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const hasErrors = errors[step.id]?.length > 0;
        const isDisabled =
          step.disabled || (!isCompleted && !isActive && index > currentStep);
        const IconComponent = step.icon;

        return (
          <button
            key={step.id}
            onClick={() => !isDisabled && goToStep(index)}
            disabled={isDisabled}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
              "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring",
              isActive && "bg-primary/10 border border-primary/20",
              isCompleted && "bg-muted/30",
              isDisabled && "opacity-50 cursor-not-allowed",
              hasErrors && "bg-destructive/10 border border-destructive/20",
              compact && "p-2",
            )}
          >
            {/* Step indicator */}
            <div
              className={cn(
                "flex items-center justify-center rounded-full border-2 transition-colors",
                compact ? "w-6 h-6" : "w-8 h-8",
                isActive && "border-primary bg-primary text-primary-foreground",
                isCompleted && "border-green-500 bg-green-500 text-white",
                hasErrors &&
                  "border-destructive bg-destructive text-destructive-foreground",
                !isActive &&
                  !isCompleted &&
                  !hasErrors &&
                  "border-muted-foreground/30",
              )}
            >
              {isCompleted ? (
                <Check className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
              ) : hasErrors ? (
                <AlertCircle className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
              ) : showStepNumbers ? (
                <span
                  className={cn(
                    "text-xs font-medium",
                    compact && "text-[10px]",
                  )}
                >
                  {index + 1}
                </span>
              ) : (
                IconComponent && (
                  <IconComponent
                    className={cn(compact ? "h-3 w-3" : "h-4 w-4")}
                  />
                )
              )}
            </div>

            {/* Step content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "font-medium truncate",
                    compact ? "text-sm" : "text-sm",
                    isActive && "text-primary",
                    hasErrors && "text-destructive",
                  )}
                >
                  {step.title}
                </p>
                {step.optional && (
                  <Badge variant="outline" className="text-xs">
                    Optional
                  </Badge>
                )}
              </div>
              {!compact && step.description && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {step.description}
                </p>
              )}
              {hasErrors && (
                <p className="text-xs text-destructive mt-1">
                  {errors[step.id].length} error
                  {errors[step.id].length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );
}

// Step Content Component
export function StepContent({
  className,
  showHeader = true,
  showDescription = true,
}: StepContentProps) {
  const { currentStep, steps, errors, isLoading } = useWizard();
  const step = steps[currentStep];
  const stepErrors = errors[step.id] || [];
  const StepComponent = step.component;
  const IconComponent = step.icon;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Step Header */}
      {showHeader && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {IconComponent && (
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <IconComponent className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{step.title}</h2>
              {showDescription && step.description && (
                <p className="text-muted-foreground">{step.description}</p>
              )}
            </div>
          </div>

          {stepErrors.length > 0 && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">
                    Please fix the following errors:
                  </p>
                  <ul className="text-sm text-destructive space-y-1">
                    {stepErrors.map((error, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-destructive/70">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step Component */}
      <div
        className={cn(
          "relative",
          isLoading && "opacity-50 pointer-events-none",
        )}
      >
        <StepComponent />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 animate-spin" />
              Validating...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wizard Controls Component
export function WizardControls({ className }: { className?: string }) {
  const {
    currentStep,
    steps,
    canGoNext,
    canGoPrevious,
    nextStep,
    previousStep,
    submitWizard,
    isLoading,
  } = useWizard();

  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <Button
        variant="outline"
        onClick={previousStep}
        disabled={!canGoPrevious || isLoading}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <div className="flex items-center gap-2">
        {currentStepData.optional && (
          <Button
            variant="ghost"
            onClick={nextStep}
            disabled={isLoading}
            className="text-muted-foreground"
          >
            Skip
          </Button>
        )}

        {isLastStep ? (
          <Button
            onClick={submitWizard}
            disabled={!canGoNext || isLoading}
            className="flex items-center gap-2"
          >
            {isLoading && <Clock className="h-4 w-4 animate-spin" />}
            Complete
          </Button>
        ) : (
          <Button
            onClick={nextStep}
            disabled={!canGoNext || isLoading}
            className="flex items-center gap-2"
          >
            {isLoading && <Clock className="h-4 w-4 animate-spin" />}
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Progress Component
export function WizardProgress({ className }: { className?: string }) {
  const { currentStep, steps } = useWizard();
  const visibleSteps = steps.filter((step) => !step.hidden);
  const progress = ((currentStep + 1) / visibleSteps.length) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Step {currentStep + 1} of {visibleSteps.length}
        </span>
        <span className="font-medium">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}

// Main Form Wizard Component
export function FormWizard({
  steps,
  onSubmit,
  onStepChange,
  initialData = {},
  className,
  showProgress = true,
  showStepList = true,
  allowSkipOptional = true,
  persistData = false,
  storageKey = "form-wizard-data",
}: FormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<Record<string, any>>(() => {
    if (persistData && typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      return saved ? { ...initialData, ...JSON.parse(saved) } : initialData;
    }
    return initialData;
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Filter out hidden steps
  const visibleSteps = steps.filter((step) => !step.hidden);
  const currentStepData = visibleSteps[currentStep];

  // Persist data to localStorage
  const persistDataToStorage = useCallback(
    (newData: Record<string, any>) => {
      if (persistData && typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(newData));
      }
    },
    [persistData, storageKey],
  );

  // Update step data
  const updateData = useCallback(
    (stepId: string, stepData: any) => {
      const newData = { ...data, [stepId]: stepData };
      setData(newData);
      persistDataToStorage(newData);

      // Clear errors for this step
      if (errors[stepId]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[stepId];
          return newErrors;
        });
      }
    },
    [data, errors, persistDataToStorage],
  );

  // Set errors for a step
  const setStepErrors = useCallback((stepId: string, stepErrors: string[]) => {
    setErrors((prev) => ({
      ...prev,
      [stepId]: stepErrors,
    }));
  }, []);

  // Validate step
  const validateStep = useCallback(
    async (stepIndex: number): Promise<boolean> => {
      const step = visibleSteps[stepIndex];
      if (!step.validation) return true;

      setIsLoading(true);
      try {
        const stepData = data[step.id];
        const validationErrors = await step.validation(stepData);

        if (validationErrors.length > 0) {
          setStepErrors(step.id, validationErrors);
          return false;
        }

        // Clear errors if validation passes
        if (errors[step.id]) {
          setStepErrors(step.id, []);
        }

        return true;
      } catch (error) {
        setStepErrors(step.id, ["Validation failed. Please try again."]);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [visibleSteps, data, errors, setStepErrors],
  );

  // Navigation functions
  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < visibleSteps.length) {
        setCurrentStep(step);
        onStepChange?.(step, visibleSteps[step].id);
      }
    },
    [visibleSteps, onStepChange],
  );

  const nextStep = useCallback(async () => {
    const isValid = await validateStep(currentStep);
    if (!isValid && !allowSkipOptional) return;
    if (!isValid && !currentStepData.optional) return;

    if (currentStep < visibleSteps.length - 1) {
      goToStep(currentStep + 1);
    }
  }, [
    currentStep,
    visibleSteps.length,
    validateStep,
    allowSkipOptional,
    currentStepData,
    goToStep,
  ]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  // Submit wizard
  const submitWizard = useCallback(async () => {
    // Validate all steps
    setIsLoading(true);
    let allValid = true;

    for (let i = 0; i < visibleSteps.length; i++) {
      const isValid = await validateStep(i);
      if (!isValid && !visibleSteps[i].optional) {
        allValid = false;
      }
    }

    if (!allValid) {
      setIsLoading(false);
      return;
    }

    try {
      await onSubmit(data);

      // Clear persisted data on successful submission
      if (persistData && typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error("Form submission failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [visibleSteps, validateStep, onSubmit, data, persistData, storageKey]);

  // Computed properties
  const canGoNext = currentStep < visibleSteps.length - 1;
  const canGoPrevious = currentStep > 0;
  const isValid = Object.keys(errors).every(
    (stepId) => errors[stepId].length === 0,
  );

  const contextValue: WizardContextType = {
    currentStep,
    steps: visibleSteps,
    data,
    errors,
    isLoading,
    isValid,
    canGoNext,
    canGoPrevious,
    goToStep,
    nextStep,
    previousStep,
    updateData,
    setErrors: setStepErrors,
    validateStep,
    submitWizard,
  };

  return (
    <WizardContext.Provider value={contextValue}>
      <div className={cn("space-y-6", className)}>
        {showProgress && <WizardProgress />}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Step Navigation */}
          {showStepList && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Steps</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <StepNavigation />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <div className={cn(showStepList ? "lg:col-span-3" : "lg:col-span-4")}>
            <Card>
              <CardContent className="p-6">
                <StepContent />
                <Separator className="my-6" />
                <WizardControls />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </WizardContext.Provider>
  );
}

// Preset wizard configurations
export const defaultWizardSteps: WizardStep[] = [
  {
    id: "personal",
    title: "Personal Information",
    description: "Basic information about yourself",
    icon: User,
    component: () => <div>Personal Information Form</div>,
  },
  {
    id: "account",
    title: "Account Details",
    description: "Set up your account preferences",
    icon: Settings,
    component: () => <div>Account Details Form</div>,
  },
  {
    id: "payment",
    title: "Payment Information",
    description: "Add your payment method",
    icon: CreditCard,
    component: () => <div>Payment Information Form</div>,
    optional: true,
  },
  {
    id: "review",
    title: "Review & Submit",
    description: "Review your information before submitting",
    icon: FileText,
    component: () => <div>Review Form</div>,
  },
];
