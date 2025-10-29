"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Shield,
  Settings,
  TestTube,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface IntegrationTemplate {
  id: string;
  name: string;
  description: string;
  provider: string;
  category: string;
  providerMetadata: {
    name: string;
    description: string;
    icon: string;
    color: string;
    capabilities: string[];
    authType: "oauth2" | "api_key" | "basic" | "custom";
    requiredFields: Array<{
      key: string;
      label: string;
      type: "text" | "password" | "url" | "select";
      required: boolean;
      description?: string;
      options?: string[];
    }>;
    oauthConfig?: {
      authUrl: string;
      tokenUrl: string;
      scopes: string[];
      redirectUri: string;
    };
  };
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isComplete: boolean;
  isOptional?: boolean;
}

interface IntegrationSetupWizardProps {
  template: IntegrationTemplate;
  onComplete: (integration: any) => void;
  onCancel: () => void;
}

export default function IntegrationSetupWizard({
  template,
  onComplete,
  onCancel,
}: IntegrationSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [integrationData, setIntegrationData] = useState({
    name: `${template.providerMetadata.name} Integration`,
    description: "",
    config: {} as Record<string, any>,
    credentials: {} as Record<string, any>,
  });
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const steps: SetupStep[] = [
    {
      id: "basic",
      title: "Basic Information",
      description: "Configure basic integration settings",
      component: BasicInfoStep,
      isComplete: false,
    },
    {
      id: "authentication",
      title: "Authentication",
      description: "Set up authentication credentials",
      component: AuthenticationStep,
      isComplete: false,
    },
    {
      id: "configuration",
      title: "Configuration",
      description: "Configure integration-specific settings",
      component: ConfigurationStep,
      isComplete: false,
      isOptional: true,
    },
    {
      id: "test",
      title: "Test Connection",
      description: "Verify the integration works correctly",
      component: TestConnectionStep,
      isComplete: false,
    },
    {
      id: "review",
      title: "Review & Create",
      description: "Review settings and create the integration",
      component: ReviewStep,
      isComplete: false,
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepComplete = (stepData: any) => {
    setIntegrationData((prev) => ({
      ...prev,
      ...stepData,
    }));

    // Mark current step as complete
    steps[currentStep].isComplete = true;
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: template.id,
          name: integrationData.name,
          description: integrationData.description,
          config: integrationData.config,
          credentials: integrationData.credentials,
        }),
      });

      if (response.ok) {
        const integration = await response.json();
        toast.success("Integration created successfully!");
        onComplete(integration);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create integration");
      }
    } catch (error) {
      console.error("Failed to create integration:", error);
      toast.error("Failed to create integration");
    } finally {
      setLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: template.providerMetadata.color }}
          >
            {template.providerMetadata.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Set up {template.providerMetadata.name}
            </h1>
            <p className="text-gray-600">
              {template.providerMetadata.description}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              Step {currentStep + 1} of {steps.length}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between mt-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${
                    index === currentStep
                      ? "bg-blue-600 text-white"
                      : step.isComplete
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-600"
                  }
                `}
                >
                  {step.isComplete ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs mt-1 text-center max-w-20">
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                  flex-1 h-0.5 mx-2
                  ${step.isComplete ? "bg-green-600" : "bg-gray-200"}
                `}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {steps[currentStep].title}
            {steps[currentStep].isOptional && (
              <Badge variant="secondary">Optional</Badge>
            )}
          </CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <CurrentStepComponent
            template={template}
            data={integrationData}
            onComplete={handleStepComplete}
            testResult={testResult}
            setTestResult={setTestResult}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Create Integration
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP COMPONENTS
// ============================================================================

function BasicInfoStep({ template, data, onComplete }: any) {
  const [formData, setFormData] = useState({
    name: data.name || `${template.providerMetadata.name} Integration`,
    description: data.description || "",
  });

  const handleSubmit = () => {
    onComplete(formData);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Integration Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter a name for this integration"
        />
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Describe what this integration will be used for"
          rows={3}
        />
      </div>

      <div className="pt-4">
        <Button onClick={handleSubmit} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}

function AuthenticationStep({ template, data, onComplete }: any) {
  const [credentials, setCredentials] = useState(data.credentials || {});
  const [loading, setLoading] = useState(false);
  const authType = template.providerMetadata.authType;

  const handleOAuthFlow = async () => {
    setLoading(true);
    try {
      // Create a temporary integration to get OAuth URL
      const response = await fetch("/api/integrations/oauth/authorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: template.provider,
          templateId: template.id,
        }),
      });

      if (response.ok) {
        const { authUrl } = await response.json();
        window.open(authUrl, "oauth", "width=600,height=600");

        // Listen for OAuth completion
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === "oauth_success") {
            setCredentials(event.data.credentials);
            onComplete({ credentials: event.data.credentials });
            window.removeEventListener("message", handleMessage);
          }
        };

        window.addEventListener("message", handleMessage);
      }
    } catch (error) {
      toast.error("Failed to start OAuth flow");
    } finally {
      setLoading(false);
    }
  };

  const handleManualCredentials = () => {
    onComplete({ credentials });
  };

  if (authType === "oauth2") {
    return (
      <div className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            This integration uses OAuth 2.0 for secure authentication. You'll be
            redirected to {template.providerMetadata.name} to authorize access.
          </AlertDescription>
        </Alert>

        <div className="text-center py-8">
          <Button
            onClick={handleOAuthFlow}
            disabled={loading}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Connect to {template.providerMetadata.name}
          </Button>
        </div>

        {Object.keys(credentials).length > 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Successfully authenticated with {template.providerMetadata.name}!
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {template.providerMetadata.requiredFields?.map((field: any) => (
        <div key={field.key}>
          <Label htmlFor={field.key}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id={field.key}
            type={field.type === "password" ? "password" : "text"}
            value={credentials[field.key] || ""}
            onChange={(e) =>
              setCredentials((prev: Record<string, string>) => ({
                ...prev,
                [field.key]: e.target.value,
              }))
            }
            placeholder={field.description}
            required={field.required}
          />
          {field.description && (
            <p className="text-sm text-gray-600 mt-1">{field.description}</p>
          )}
        </div>
      ))}

      <div className="pt-4">
        <Button onClick={handleManualCredentials} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}

function ConfigurationStep({ template, data, onComplete }: any) {
  const [config, setConfig] = useState(data.config || {});

  const handleSubmit = () => {
    onComplete({ config });
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          Configure additional settings for your{" "}
          {template.providerMetadata.name} integration. These settings can be
          changed later.
        </AlertDescription>
      </Alert>

      {/* Provider-specific configuration options */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="syncFrequency">Sync Frequency</Label>
          <select
            id="syncFrequency"
            className="w-full p-2 border rounded-md"
            value={config.syncFrequency || "hourly"}
            onChange={(e) =>
              setConfig((prev: Record<string, any>) => ({
                ...prev,
                syncFrequency: e.target.value,
              }))
            }
          >
            <option value="realtime">Real-time</option>
            <option value="hourly">Every hour</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="manual">Manual only</option>
          </select>
        </div>

        <div>
          <Label htmlFor="retryAttempts">Retry Attempts</Label>
          <Input
            id="retryAttempts"
            type="number"
            min="1"
            max="10"
            value={config.retryAttempts || 3}
            onChange={(e) =>
              setConfig((prev: Record<string, any>) => ({
                ...prev,
                retryAttempts: parseInt(e.target.value),
              }))
            }
          />
        </div>
      </div>

      <div className="pt-4">
        <Button onClick={handleSubmit} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}

function TestConnectionStep({
  template,
  data,
  onComplete,
  testResult,
  setTestResult,
}: any) {
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/integrations/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: template.provider,
          credentials: data.credentials,
          config: data.config,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: "Connection test successful!",
          details: result,
        });
        onComplete({ testPassed: true });
      } else {
        setTestResult({
          success: false,
          message: result.error || "Connection test failed",
          details: result,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to test connection",
        details: error,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <TestTube className="h-4 w-4" />
        <AlertDescription>
          Test your connection to ensure the integration is configured
          correctly.
        </AlertDescription>
      </Alert>

      <div className="text-center py-8">
        <Button
          onClick={handleTest}
          disabled={testing}
          size="lg"
          variant="outline"
        >
          {testing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <TestTube className="h-4 w-4 mr-2" />
          )}
          Test Connection
        </Button>
      </div>

      {testResult && (
        <Alert
          className={
            testResult.success
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          {testResult.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={testResult.success ? "text-green-800" : "text-red-800"}
          >
            {testResult.message}
          </AlertDescription>
        </Alert>
      )}

      {testResult?.success && (
        <div className="pt-4">
          <Button
            onClick={() => onComplete({ testPassed: true })}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}

function ReviewStep({ template, data, onComplete }: any) {
  return (
    <div className="space-y-6">
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertDescription>
          Review your integration settings before creating the integration.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Name:</span> {data.name}
            </div>
            <div>
              <span className="font-medium">Provider:</span>{" "}
              {template.providerMetadata.name}
            </div>
            {data.description && (
              <div>
                <span className="font-medium">Description:</span>{" "}
                {data.description}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Auth Type:</span>{" "}
              {template.providerMetadata.authType}
            </div>
            <div>
              <span className="font-medium">Sync Frequency:</span>{" "}
              {data.config?.syncFrequency || "hourly"}
            </div>
            <div>
              <span className="font-medium">Retry Attempts:</span>{" "}
              {data.config?.retryAttempts || 3}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <Button onClick={() => onComplete({})} className="w-full">
          Ready to Create
        </Button>
      </div>
    </div>
  );
}
