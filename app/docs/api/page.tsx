"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Home, 
  Code, 
  Globe, 
  Lock, 
  Database, 
  Zap,
  Copy,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
  Terminal,
  Key,
  Shield,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface APIEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  auth: boolean;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  response: string;
  example: {
    request?: string;
    response: string;
  };
}

const endpoints: APIEndpoint[] = [
  {
    method: "GET",
    path: "/api/users",
    description: "Get all users with pagination",
    auth: true,
    parameters: [
      { name: "page", type: "number", required: false, description: "Page number (default: 1)" },
      { name: "limit", type: "number", required: false, description: "Items per page (default: 10)" },
      { name: "search", type: "string", required: false, description: "Search query" }
    ],
    response: "Array of user objects with pagination metadata",
    example: {
      response: `{
  "users": [
    {
      "id": "123",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}`
    }
  },
  {
    method: "POST",
    path: "/api/users",
    description: "Create a new user",
    auth: true,
    parameters: [
      { name: "email", type: "string", required: true, description: "User email address" },
      { name: "name", type: "string", required: true, description: "User full name" },
      { name: "password", type: "string", required: true, description: "User password (min 8 chars)" }
    ],
    response: "Created user object",
    example: {
      request: `{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "password": "securepassword123"
}`,
      response: `{
  "id": "456",
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "createdAt": "2024-01-15T11:00:00Z"
}`
    }
  },
  {
    method: "GET",
    path: "/api/users/:id",
    description: "Get a specific user by ID",
    auth: true,
    parameters: [
      { name: "id", type: "string", required: true, description: "User ID" }
    ],
    response: "User object",
    example: {
      response: `{
  "id": "123",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}`
    }
  },
  {
    method: "PUT",
    path: "/api/users/:id",
    description: "Update a user",
    auth: true,
    parameters: [
      { name: "id", type: "string", required: true, description: "User ID" },
      { name: "name", type: "string", required: false, description: "Updated name" },
      { name: "email", type: "string", required: false, description: "Updated email" }
    ],
    response: "Updated user object",
    example: {
      request: `{
  "name": "John Updated",
  "email": "john.updated@example.com"
}`,
      response: `{
  "id": "123",
  "email": "john.updated@example.com",
  "name": "John Updated",
  "updatedAt": "2024-01-15T12:00:00Z"
}`
    }
  },
  {
    method: "DELETE",
    path: "/api/users/:id",
    description: "Delete a user",
    auth: true,
    parameters: [
      { name: "id", type: "string", required: true, description: "User ID" }
    ],
    response: "Success message",
    example: {
      response: `{
  "message": "User deleted successfully",
  "id": "123"
}`
    }
  }
];

const methodColors = {
  GET: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  POST: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  PUT: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
  DELETE: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  PATCH: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
};

export default function APIPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 mb-8">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-200 flex items-center">
            <Home className="w-4 h-4 mr-1" />
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/docs" className="hover:text-slate-900 dark:hover:text-slate-200">
            Documentation
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 dark:text-slate-200 font-medium">API Reference</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6">
            <Code className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            API Reference
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Complete REST API documentation with endpoints, authentication, parameters, 
            and response examples. Build powerful integrations with our API.
          </p>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Globe className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Base URL</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">https://api.example.com</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Authentication</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Bearer Token</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Code className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Format</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">JSON</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Rate Limit</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">1000/hour</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Authentication */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
            Authentication
          </h2>
          <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>Bearer Token Authentication</span>
              </CardTitle>
              <CardDescription>
                Include your API token in the Authorization header for all authenticated requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`curl -H "Authorization: Bearer YOUR_API_TOKEN" \\
     -H "Content-Type: application/json" \\
     https://api.example.com/api/users`}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 bg-slate-800 border-slate-700 hover:bg-slate-700"
                    onClick={() => copyToClipboard(`curl -H "Authorization: Bearer YOUR_API_TOKEN" \\
     -H "Content-Type: application/json" \\
     https://api.example.com/api/users`, "auth-example")}
                  >
                    {copiedCode === "auth-example" ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Getting Your API Token
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        You can generate API tokens in your account settings. Keep your tokens secure and never share them publicly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Endpoints */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
            API Endpoints
          </h2>
          <div className="space-y-6">
            {endpoints.map((endpoint, index) => (
              <Card key={index} className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={methodColors[endpoint.method]}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-lg font-mono text-slate-900 dark:text-white">
                        {endpoint.path}
                      </code>
                      {endpoint.auth && (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="w-3 h-3 mr-1" />
                          Auth Required
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    {endpoint.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="parameters" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="parameters">Parameters</TabsTrigger>
                      <TabsTrigger value="request">Request</TabsTrigger>
                      <TabsTrigger value="response">Response</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="parameters" className="mt-4">
                      {endpoint.parameters && endpoint.parameters.length > 0 ? (
                        <div className="space-y-3">
                          {endpoint.parameters.map((param, paramIndex) => (
                            <div key={paramIndex} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <code className="text-sm font-mono text-slate-900 dark:text-white">
                                    {param.name}
                                  </code>
                                  <Badge variant="outline" className="text-xs">
                                    {param.type}
                                  </Badge>
                                  {param.required && (
                                    <Badge variant="destructive" className="text-xs">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {param.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          No parameters required for this endpoint.
                        </p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="request" className="mt-4">
                      {endpoint.example.request ? (
                        <div className="relative">
                          <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                            <code>{endpoint.example.request}</code>
                          </pre>
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2 bg-slate-800 border-slate-700 hover:bg-slate-700"
                            onClick={() => copyToClipboard(endpoint.example.request!, `request-${index}`)}
                          >
                            {copiedCode === `request-${index}` ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          No request body required for this endpoint.
                        </p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="response" className="mt-4">
                      <div className="relative">
                        <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{endpoint.example.response}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2 bg-slate-800 border-slate-700 hover:bg-slate-700"
                          onClick={() => copyToClipboard(endpoint.example.response, `response-${index}`)}
                        >
                          {copiedCode === `response-${index}` ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Error Handling */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
            Error Handling
          </h2>
          <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>HTTP Status Codes</span>
              </CardTitle>
              <CardDescription>
                Our API uses standard HTTP status codes to indicate success or failure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-600 dark:text-green-400">Success Codes</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <code>200</code>
                        <span className="text-slate-600 dark:text-slate-400">OK - Request successful</span>
                      </div>
                      <div className="flex justify-between">
                        <code>201</code>
                        <span className="text-slate-600 dark:text-slate-400">Created - Resource created</span>
                      </div>
                      <div className="flex justify-between">
                        <code>204</code>
                        <span className="text-slate-600 dark:text-slate-400">No Content - Successful deletion</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-red-600 dark:text-red-400">Error Codes</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <code>400</code>
                        <span className="text-slate-600 dark:text-slate-400">Bad Request - Invalid input</span>
                      </div>
                      <div className="flex justify-between">
                        <code>401</code>
                        <span className="text-slate-600 dark:text-slate-400">Unauthorized - Invalid token</span>
                      </div>
                      <div className="flex justify-between">
                        <code>404</code>
                        <span className="text-slate-600 dark:text-slate-400">Not Found - Resource not found</span>
                      </div>
                      <div className="flex justify-between">
                        <code>500</code>
                        <span className="text-slate-600 dark:text-slate-400">Server Error - Internal error</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Error Response Format</h4>
                  <div className="relative">
                    <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SDKs and Tools */}
        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
          <CardHeader>
            <CardTitle>SDKs and Tools</CardTitle>
            <CardDescription>
              Integrate with our API using your favorite tools and languages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild>
                <Link href="/docs/getting-started">
                  <Terminal className="w-4 h-4 mr-2" />
                  Quick Start Guide
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/showcase">
                  <Code className="w-4 h-4 mr-2" />
                  Live Examples
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="https://github.com/khanakat" target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-2" />
                  Postman Collection
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}