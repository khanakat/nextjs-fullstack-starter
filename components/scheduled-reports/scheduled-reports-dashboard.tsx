"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { ScheduledReportsList } from "./scheduled-reports-list";
import { ScheduledReportsHistory } from "./scheduled-reports-history";
import { ScheduledReportsStats } from "./scheduled-reports-stats";
import { CreateScheduledReportDialog } from "./create-scheduled-report-dialog";
import { useScheduledReportsRealtime } from "@/hooks/use-scheduled-reports-realtime";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ErrorBoundary } from "@/components/ui/error-boundary";

interface ScheduledReportsDashboardProps {
  organizationId: string;
}

export function ScheduledReportsDashboard({ organizationId }: ScheduledReportsDashboardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  // Real-time updates
  const {
    isConnected,
    isConnecting,
    error: realtimeError,
    lastEvent,
    reconnect,
  } = useScheduledReportsRealtime({
    organizationId,
    onExecutionStarted: (data) => {
      console.log("Execution started:", data);
      // Trigger refresh of stats and history
      setRefreshTrigger(prev => prev + 1);
    },
    onExecutionCompleted: (data) => {
      console.log("Execution completed:", data);
      // Trigger refresh of stats and history
      setRefreshTrigger(prev => prev + 1);
    },
    onExecutionFailed: (data) => {
      console.log("Execution failed:", data);
      // Trigger refresh of stats and history
      setRefreshTrigger(prev => prev + 1);
    },
    onReportCreated: (data) => {
      console.log("Report created:", data);
      // Trigger refresh of reports list and stats
      setRefreshTrigger(prev => prev + 1);
    },
    onReportUpdated: (data) => {
      console.log("Report updated:", data);
      // Trigger refresh of reports list
      setRefreshTrigger(prev => prev + 1);
    },
    onReportDeleted: (data) => {
      console.log("Report deleted:", data);
      // Trigger refresh of reports list and stats
      setRefreshTrigger(prev => prev + 1);
    },
    showToastNotifications: true,
    autoReconnect: true,
  });

  const handleReportCreated = useCallback(() => {
    setIsCreateDialogOpen(false);
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: "Success",
      message: "Scheduled report created successfully",
      type: "success",
    });
  }, [toast]);

  const handleReportUpdated = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: "Success",
      message: "Scheduled report updated successfully",
      type: "success",
    });
  }, [toast]);

  const handleReportDeleted = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: "Success",
      message: "Scheduled report deleted successfully",
      type: "success",
    });
  }, [toast]);

  const handleManualRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: "Refreshed",
      message: "Data has been refreshed",
      type: "info",
    });
  }, [toast]);

  const getConnectionStatus = () => {
    if (isConnecting) {
      return (
        <Badge variant="secondary" className="gap-1">
          <WifiOff className="h-3 w-3 animate-pulse" />
          Connecting...
        </Badge>
      );
    }
    
    if (isConnected) {
      return (
        <Badge variant="default" className="gap-1 bg-green-500">
          <Wifi className="h-3 w-3" />
          Live Updates
        </Badge>
      );
    }
    
    return (
      <Badge variant="destructive" className="gap-1">
        <WifiOff className="h-3 w-3" />
        Disconnected
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scheduled Reports</h1>
          <p className="text-muted-foreground">
            Manage and monitor your automated report generation and delivery
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {getConnectionStatus()}
            {realtimeError && (
              <Button
                variant="outline"
                size="sm"
                onClick={reconnect}
                className="text-destructive hover:text-destructive"
              >
                <WifiOff className="h-4 w-4 mr-1" />
                Reconnect
              </Button>
            )}
          </div>
          
          {/* Manual Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          {/* Create Report */}
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Report
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <ScheduledReportsStats 
        organizationId={organizationId} 
        refreshTrigger={refreshTrigger}
      />

      {/* Main Content */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Active Reports</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reports" className="space-y-4">
          <ErrorBoundary>
            <ScheduledReportsList
              organizationId={organizationId}
              refreshTrigger={refreshTrigger}
              onReportUpdated={handleReportUpdated}
              onReportDeleted={handleReportDeleted}
            />
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <ScheduledReportsHistory
            organizationId={organizationId}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <CreateScheduledReportDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        organizationId={organizationId}
        onReportCreated={handleReportCreated}
      />
    </div>
  );
}