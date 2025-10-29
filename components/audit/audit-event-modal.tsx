"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { Separator } from '@/components/ui/separator'
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
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
  Shield,
  Activity,
  Database,
  FileText,
  Copy,
  ExternalLink,
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

interface AuditEventModalProps {
  logId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// AUDIT EVENT MODAL COMPONENT
// ============================================================================

export function AuditEventModal({
  logId,
  open,
  onOpenChange,
}: AuditEventModalProps) {
  const [log, setLog] = useState<AuditLogWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchLogDetails = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/audit/logs/${id}`);

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
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (open && logId) {
      fetchLogDetails(logId);
      setActiveTab("overview");
    } else {
      setLog(null);
    }
  }, [open, logId]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleOpenInNewTab = () => {
    if (logId) {
      window.open(`/audit/logs/${logId}`, "_blank");
    }
  };

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case AuditLogCategory.AUTHENTICATION:
        return <User className="h-4 w-4" />;
      case AuditLogCategory.AUTHORIZATION:
        return <Shield className="h-4 w-4" />;
      case AuditLogCategory.DATA:
        return <Database className="h-4 w-4" />;
      case AuditLogCategory.SYSTEM:
        return <Monitor className="h-4 w-4" />;
      case AuditLogCategory.SECURITY:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                {log && getCategoryIcon(log.category)}
                Audit Event Details
              </DialogTitle>
              <DialogDescription>
                {log ? `Event ID: ${log.id}` : "Loading event details..."}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {log && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyToClipboard(log.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInNewTab}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading event details...</span>
          </div>
        ) : log ? (
          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="context">Context</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Event Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                          <Badge variant="outline">{log.category}</Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Severity
                        </label>
                        <Badge className={getSeverityColor(log.severity)}>
                          {log.severity}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Status
                        </label>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <Badge className={getStatusColor(log.status)}>
                            {log.status}
                          </Badge>
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
                        <p className="mt-1 p-3 bg-muted rounded-md">
                          {(log as any).description}
                        </p>
                      </div>
                    )}

                    {log.resourceId && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Resource ID
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                            {log.resourceId}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCopyToClipboard(log.resourceId!)
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Name
                          </label>
                          <p className="font-medium">
                            {log.user.name || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Email
                          </label>
                          <p className="font-medium">{log.user.email}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          User ID
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                            {log.userId}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyToClipboard(log.userId!)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Technical Tab */}
              <TabsContent value="technical" className="space-y-4">
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
                    <CardContent className="space-y-3">
                      {(log as any).requestMethod && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Method
                          </label>
                          <Badge variant="outline" className="ml-2">
                            {(log as any).requestMethod}
                          </Badge>
                        </div>
                      )}

                      {(log as any).requestUrl && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            URL
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                              {(log as any).requestUrl}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCopyToClipboard((log as any).requestUrl)
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {(log as any).requestHeaders && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Headers
                          </label>
                          <ScrollArea className="h-32 mt-1">
                            <pre className="p-3 bg-muted rounded text-xs font-mono">
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
                            <pre className="p-3 bg-muted rounded text-xs font-mono">
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
                      <CardTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Response Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(log as any).responseStatus && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Status Code
                          </label>
                          <Badge
                            variant="outline"
                            className={`ml-2 ${
                              (log as any).responseStatus >= 200 &&
                              (log as any).responseStatus < 300
                                ? "bg-green-100 text-green-800 border-green-200"
                                : (log as any).responseStatus >= 400
                                  ? "bg-red-100 text-red-800 border-red-200"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-200"
                            }`}
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
                            <pre className="p-3 bg-muted rounded text-xs font-mono">
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
                            <pre className="p-3 bg-muted rounded text-xs font-mono">
                              {formatMetadata((log as any).responseBody)}
                            </pre>
                          </ScrollArea>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* System Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      System Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {log.ipAddress && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          IP Address
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-4 w-4" />
                          <code className="p-1 bg-muted rounded text-sm font-mono">
                            {log.ipAddress}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCopyToClipboard(log.ipAddress!)
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {log.userAgent && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          User Agent
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <Smartphone className="h-4 w-4" />
                          <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                            {log.userAgent}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCopyToClipboard(log.userAgent!)
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {(log as any).sessionId && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Session ID
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                            {(log as any).sessionId}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCopyToClipboard((log as any).sessionId)
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Context Tab */}
              <TabsContent value="context" className="space-y-4">
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
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                            {log.organizationId}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCopyToClipboard(log.organizationId || "")
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Additional Context */}
                {((log as any).referrer ||
                  (log as any).location ||
                  (log as any).deviceInfo) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Context</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(log as any).referrer && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Referrer
                          </label>
                          <p className="font-mono text-sm bg-muted p-2 rounded break-all">
                            {(log as any).referrer}
                          </p>
                        </div>
                      )}

                      {(log as any).location && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Location
                          </label>
                          <p className="font-medium">{(log as any).location}</p>
                        </div>
                      )}

                      {(log as any).deviceInfo && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Device Information
                          </label>
                          <ScrollArea className="h-24 mt-1">
                            <pre className="p-3 bg-muted rounded text-xs font-mono">
                              {formatMetadata((log as any).deviceInfo)}
                            </pre>
                          </ScrollArea>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Metadata Tab */}
              <TabsContent value="metadata" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Raw Metadata
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {log.metadata ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Metadata Content
                          </label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCopyToClipboard(
                                formatMetadata(log.metadata) || "",
                              )
                            }
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                        </div>
                        <ScrollArea className="h-64">
                          <pre className="p-4 bg-muted rounded text-xs font-mono">
                            {formatMetadata(log.metadata)}
                          </pre>
                        </ScrollArea>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No metadata available for this event
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Raw Event Data */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Raw Event Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Complete Event Object
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopyToClipboard(JSON.stringify(log, null, 2))
                        }
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy All
                      </Button>
                    </div>
                    <ScrollArea className="h-64">
                      <pre className="p-4 bg-muted rounded text-xs font-mono">
                        {JSON.stringify(log, null, 2)}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Event not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AuditEventModal;
