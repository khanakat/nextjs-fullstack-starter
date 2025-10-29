"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { toast } from "sonner";
import {
  Search,
  Filter,
  Grid,
  List,
  Plus,
  Settings,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Mail,
  MessageSquare,
  CreditCard,
  BarChart,
  FileText,
  Shield,
  GitBranch,
  Package,
} from "lucide-react";

// Types
interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "connected" | "available" | "error";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  features: string[];
  setupComplexity: "simple" | "medium" | "complex";
  pricing: "free" | "paid" | "freemium";
  lastSync?: string;
  errorMessage?: string;
}

interface IntegrationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  integrations: string[];
  useCase: string;
  estimatedSetupTime: string;
}

// Mock data
const integrations: Integration[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Accept payments and manage subscriptions",
    category: "Payment",
    status: "connected",
    icon: CreditCard,
    color: "text-purple-600",
    features: ["Payment Processing", "Subscriptions", "Invoicing"],
    setupComplexity: "medium",
    pricing: "paid",
    lastSync: "2 minutes ago",
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Email delivery and marketing automation",
    category: "Communication",
    status: "connected",
    icon: Mail,
    color: "text-blue-600",
    features: ["Email Delivery", "Templates", "Analytics"],
    setupComplexity: "simple",
    pricing: "freemium",
    lastSync: "5 minutes ago",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Team communication and notifications",
    category: "Communication",
    status: "available",
    icon: MessageSquare,
    color: "text-green-600",
    features: ["Notifications", "Bot Integration", "File Sharing"],
    setupComplexity: "simple",
    pricing: "freemium",
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Web analytics and user behavior tracking",
    category: "Analytics",
    status: "error",
    icon: BarChart,
    color: "text-orange-600",
    features: ["User Tracking", "Conversion Analytics", "Reports"],
    setupComplexity: "medium",
    pricing: "free",
    errorMessage: "API key expired",
  },
  {
    id: "auth0",
    name: "Auth0",
    description: "Identity and access management",
    category: "Authentication",
    status: "connected",
    icon: Shield,
    color: "text-indigo-600",
    features: ["SSO", "Multi-factor Auth", "User Management"],
    setupComplexity: "complex",
    pricing: "freemium",
    lastSync: "1 hour ago",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Version control and code collaboration",
    category: "Development",
    status: "available",
    icon: GitBranch,
    color: "text-gray-800",
    features: ["Repository Access", "Webhooks", "Issue Tracking"],
    setupComplexity: "medium",
    pricing: "freemium",
  },
];

const integrationTemplates: IntegrationTemplate[] = [
  {
    id: "ecommerce-starter",
    name: "E-commerce Starter",
    description: "Complete setup for online store with payments and analytics",
    category: "E-commerce",
    integrations: ["stripe", "sendgrid", "google-analytics"],
    useCase: "Launch an online store quickly",
    estimatedSetupTime: "30 minutes",
  },
  {
    id: "saas-foundation",
    name: "SaaS Foundation",
    description: "Essential integrations for SaaS applications",
    category: "SaaS",
    integrations: ["auth0", "stripe", "sendgrid", "slack"],
    useCase: "Build a subscription-based service",
    estimatedSetupTime: "45 minutes",
  },
  {
    id: "team-productivity",
    name: "Team Productivity",
    description: "Streamline team communication and project management",
    category: "Productivity",
    integrations: ["slack", "github", "google-analytics"],
    useCase: "Improve team collaboration",
    estimatedSetupTime: "20 minutes",
  },
];

export default function IntegrationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("integrations");

  // Get unique categories
  const categories = [
    "all",
    ...Array.from(new Set(integrations.map((i) => i.category))),
  ];

  // Filter integrations
  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || integration.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "all" || integration.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleConnect = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/connect`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to connect integration");
      }

      toast.success("Integration connected successfully");
      // In a real app, you would update the integration status
    } catch (error) {
      console.error("Error connecting integration:", error);
      toast.error("Failed to connect integration");
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/disconnect`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect integration");
      }

      toast.success("Integration disconnected");
      // In a real app, you would update the integration status
    } catch (error) {
      console.error("Error disconnecting integration:", error);
      toast.error("Failed to disconnect integration");
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/integrations/templates/${templateId}/apply`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to apply template");
      }

      toast.success("Template applied successfully");
      // In a real app, you would navigate to setup or refresh the page
    } catch (error) {
      console.error("Error applying template:", error);
      toast.error("Failed to apply template");
    }
  };

  const getStatusIcon = (status: Integration["status"]) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: Integration["status"]) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="outline">Available</Badge>;
    }
  };

  const getComplexityColor = (complexity: Integration["setupComplexity"]) => {
    switch (complexity) {
      case "simple":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "complex":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPricingColor = (pricing: Integration["pricing"]) => {
    switch (pricing) {
      case "free":
        return "bg-green-100 text-green-800";
      case "freemium":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your favorite tools and services to enhance your workflow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Custom
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connected</p>
                <p className="text-2xl font-bold">
                  {integrations.filter((i) => i.status === "connected").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">
                  {integrations.filter((i) => i.status === "available").length}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold">
                  {integrations.filter((i) => i.status === "error").length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categories.length - 1}</p>
              </div>
              <Grid className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="integrations">
            <Package className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Integrations Grid/List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIntegrations.map((integration) => {
                const Icon = integration.icon;
                return (
                  <Card key={integration.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                            <Icon className={`w-6 h-6 ${integration.color}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            <CardDescription>{integration.description}</CardDescription>
                          </div>
                        </div>
                        {getStatusIcon(integration.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(integration.status)}
                          <Badge variant="outline">{integration.category}</Badge>
                          <Badge className={getComplexityColor(integration.setupComplexity)}>
                            {integration.setupComplexity}
                          </Badge>
                          <Badge className={getPricingColor(integration.pricing)}>
                            {integration.pricing}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium">Features:</p>
                          <div className="flex flex-wrap gap-1">
                            {integration.features.map((feature) => (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {integration.status === "connected" && integration.lastSync && (
                          <p className="text-xs text-muted-foreground">
                            Last sync: {integration.lastSync}
                          </p>
                        )}

                        {integration.status === "error" && integration.errorMessage && (
                          <p className="text-xs text-red-600">
                            Error: {integration.errorMessage}
                          </p>
                        )}

                        <div className="flex gap-2">
                          {integration.status === "connected" ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDisconnect(integration.id)}
                              >
                                Disconnect
                              </Button>
                              <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4 mr-1" />
                                Configure
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleConnect(integration.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Zap className="w-4 h-4 mr-1" />
                              Connect
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIntegrations.map((integration) => {
                const Icon = integration.icon;
                return (
                  <Card key={integration.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-muted rounded-lg">
                            <Icon className={`w-6 h-6 ${integration.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold">{integration.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {integration.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusBadge(integration.status)}
                              <Badge variant="outline">{integration.category}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {integration.status === "connected" ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDisconnect(integration.id)}
                              >
                                Disconnect
                              </Button>
                              <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleConnect(integration.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Zap className="w-4 h-4 mr-1" />
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {filteredIntegrations.length === 0 && (
            <Card className="p-12 text-center">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Package className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No integrations found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Integration Templates</h2>
            <p className="text-muted-foreground">
              Pre-configured integration bundles for common use cases
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrationTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{template.category}</Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{template.estimatedSetupTime}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Includes:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.integrations.map((integrationId) => {
                          const integration = integrations.find((i) => i.id === integrationId);
                          return integration ? (
                            <Badge key={integrationId} variant="secondary" className="text-xs">
                              {integration.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Use Case:</p>
                      <p className="text-sm text-muted-foreground">{template.useCase}</p>
                    </div>

                    <Button
                      onClick={() => handleUseTemplate(template.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}