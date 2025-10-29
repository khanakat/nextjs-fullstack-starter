"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  User,
  Globe,
  Monitor,
  Code,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Smartphone,
} from "lucide-react";
import { format } from "date-fns";
import {
  AuditLogWithRelations,
  AuditLogSeverity,
  AuditLogStatus,
  AuditLogCategory,
} from "@/lib/types/audit";

// ============================================================================
// TYPES
// ============================================================================

interface AuditLogDetailsProps {
  logId: string;
  onBack?: () => void;
}

// ============================================================================
// AUDIT LOG DETAILS COMPONENT
// ============================================================================

export function AuditLogDetails({ logId, onBack }: AuditLogDetailsProps) {
  const [log, setLog] = useState<AuditLogWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchLogDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/audit/logs/${logId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch audit log details");
      }

      const data = await response.json();
      setLog(data);
    } catch (error) {
      console.error("Error fetching audit log details:", error);
      toast.error("Failed to fetch audit log details");
    } finally {
      setLoading(false);
    }
  }, [logId]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (logId) {
      fetchLogDetails();
    }
  }, [logId, fetchLogDetails]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case AuditLogSeverity.CRITICAL:
        return "bg-red-100 text-red-800 border-red-200";
      case AuditLogSeverity.HIGH:
        return "bg-orange-100 text-orange-800 border-orange-200";
      case AuditLogSeverity.MEDIUM:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case AuditLogSeverity.LOW:
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case AuditLogStatus.SUCCESS:
        return "bg-green-100 text-green-800 border-green-200";
      case AuditLogStatus.FAILURE:
        return "bg-red-100 text-red-800 border-red-200";
      case AuditLogStatus.WARNING:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case AuditLogStatus.SUCCESS:
        return <CheckCircle className="h-4 w-4" />;
      case AuditLogStatus.FAILURE:
        return <XCircle className="h-4 w-4" />;
      case AuditLogStatus.WARNING:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case AuditLogCategory.SECURITY:
        return <AlertTriangle className="h-5 w-5" />;
      case AuditLogCategory.USER:
        return <User className="h-5 w-5" />;
      case AuditLogCategory.SYSTEM:
        return <Monitor className="h-5 w-5" />;
      case AuditLogCategory.DATA:
        return <Code className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const formatMetadata = (metadata: any) => {
    if (!metadata) return null;

    try {
      return JSON.stringify(metadata, null, 2);
    } catch {
      return String(metadata);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading audit log details...</span>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Audit log not found</p>
        {onBack && (
          <Button variant="outline" onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Audit Log Details</h1>
            <p className="text-muted-foreground">ID: {log.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getCategoryIcon(log.category)}
          <Badge variant="outline" className={getSeverityColor(log.severity)}>
            {log.severity}
          </Badge>
          <Badge variant="outline" className={getStatusColor(log.status)}>
            {getStatusIcon(log.status)}
            {log.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Action
                  </label>
                  <p className="font-medium">{log.action}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Resource
                  </label>
                  <p className="font-medium">{log.resource}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Category
                  </label>
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(log.category)}
                    <span className="font-medium">{log.category}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Timestamp
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">
                      {format(new Date(log.createdAt), "PPpp")}
                    </span>
                  </div>
                </div>
              </div>

              {(log as any).description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Description
                  </label>
                  <p className="mt-1">{(log as any).description}</p>
                </div>
              )}

              {log.resourceId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Resource ID
                  </label>
                  <p className="font-mono text-sm bg-muted p-2 rounded">
                    {log.resourceId}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Request Information */}
          {((log as any).requestMethod ||
            (log as any).requestUrl ||
            (log as any).requestHeaders ||
            (log as any).requestBody) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Request Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(log as any).requestMethod && (log as any).requestUrl && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Request
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {(log as any).requestMethod}
                      </Badge>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {(log as any).requestUrl}
                      </code>
                    </div>
                  </div>
                )}

                {(log as any).requestHeaders && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Headers
                    </label>
                    <ScrollArea className="h-32 mt-1">
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        {formatMetadata((log as any).requestHeaders)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                {(log as any).requestBody && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Request Body
                    </label>
                    <ScrollArea className="h-32 mt-1">
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        {formatMetadata((log as any).requestBody)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Response Information */}
          {((log as any).responseStatus ||
            (log as any).responseHeaders ||
            (log as any).responseBody) && (
            <Card>
              <CardHeader>
                <CardTitle>Response Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(log as any).responseStatus && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Status Code
                    </label>
                    <Badge
                      variant="outline"
                      className={
                        (log as any).responseStatus >= 400
                          ? "border-red-200 text-red-800"
                          : "border-green-200 text-green-800"
                      }
                    >
                      {(log as any).responseStatus}
                    </Badge>
                  </div>
                )}

                {(log as any).responseHeaders && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Headers
                    </label>
                    <ScrollArea className="h-32 mt-1">
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        {formatMetadata((log as any).responseHeaders)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                {(log as any).responseBody && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Response Body
                    </label>
                    <ScrollArea className="h-32 mt-1">
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        {formatMetadata((log as any).responseBody)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Changes */}
          {(log.oldValues || log.newValues) && (
            <Card>
              <CardHeader>
                <CardTitle>Data Changes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {log.oldValues && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Previous Values
                    </label>
                    <ScrollArea className="h-32 mt-1">
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        {formatMetadata(log.oldValues)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                {log.newValues && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      New Values
                    </label>
                    <ScrollArea className="h-32 mt-1">
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        {formatMetadata(log.newValues)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional Metadata */}
          {log.metadata && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {formatMetadata(log.metadata)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Information */}
          {log.user && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Name
                  </label>
                  <p className="font-medium">{log.user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-sm">{log.user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    User ID
                  </label>
                  <p className="font-mono text-xs bg-muted p-1 rounded">
                    {log.userId}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Organization Information */}
          {log.organization && (
            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Name
                  </label>
                  <p className="font-medium">{log.organization.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Organization ID
                  </label>
                  <p className="font-mono text-xs bg-muted p-1 rounded">
                    {log.organizationId}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {log.ipAddress && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    IP Address
                  </label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-mono text-sm">{log.ipAddress}</span>
                  </div>
                </div>
              )}

              {log.userAgent && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    User Agent
                  </label>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <p className="text-xs break-all">{log.userAgent}</p>
                  </div>
                </div>
              )}

              {log.sessionId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Session ID
                  </label>
                  <p className="font-mono text-xs bg-muted p-1 rounded break-all">
                    {log.sessionId}
                  </p>
                </div>
              )}

              {(log as any).correlationId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Correlation ID
                  </label>
                  <p className="font-mono text-xs bg-muted p-1 rounded break-all">
                    {(log as any).correlationId}
                  </p>
                </div>
              )}

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Created
                </label>
                <p className="text-sm">
                  {format(new Date(log.createdAt), "PPpp")}
                </p>
              </div>

              {(log as any).updatedAt &&
                (log as any).updatedAt !== log.createdAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Updated
                    </label>
                    <p className="text-sm">
                      {format(new Date((log as any).updatedAt), "PPpp")}
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Compliance & Retention */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance & Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(log as any).complianceStandards &&
                (log as any).complianceStandards.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Standards
                    </label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(log as any).complianceStandards.map(
                        (standard: any, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {standard}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {(log as any).retentionDate && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Retention Until
                  </label>
                  <p className="text-sm">
                    {format(new Date((log as any).retentionDate), "PPP")}
                  </p>
                </div>
              )}

              {(log as any).isArchived && (
                <div>
                  <Badge
                    variant="outline"
                    className="bg-yellow-50 text-yellow-800 border-yellow-200"
                  >
                    Archived
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
