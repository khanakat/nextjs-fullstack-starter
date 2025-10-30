"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ScheduledReportStatus } from "@/lib/types/scheduled-reports";

interface RealtimeEvent {
  type: "execution_started" | "execution_completed" | "execution_failed" | "report_created" | "report_updated" | "report_deleted";
  data: {
    scheduledReportId: string;
    executionId?: string;
    status?: ScheduledReportStatus | "pending" | "running" | "completed" | "failed";
    error?: string;
    duration?: number;
    recipientCount?: number;
    deliveredCount?: number;
    failedDeliveries?: number;
    timestamp: string;
  };
}

interface UseScheduledReportsRealtimeOptions {
  organizationId: string;
  onExecutionStarted?: (data: RealtimeEvent["data"]) => void;
  onExecutionCompleted?: (data: RealtimeEvent["data"]) => void;
  onExecutionFailed?: (data: RealtimeEvent["data"]) => void;
  onReportCreated?: (data: RealtimeEvent["data"]) => void;
  onReportUpdated?: (data: RealtimeEvent["data"]) => void;
  onReportDeleted?: (data: RealtimeEvent["data"]) => void;
  showToastNotifications?: boolean;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

interface UseScheduledReportsRealtimeReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastEvent: RealtimeEvent | null;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useScheduledReportsRealtime({
  organizationId,
  onExecutionStarted,
  onExecutionCompleted,
  onExecutionFailed,
  onReportCreated,
  onReportUpdated,
  onReportDeleted,
  showToastNotifications = true,
  autoReconnect = true,
  reconnectInterval = 5000,
}: UseScheduledReportsRealtimeOptions): UseScheduledReportsRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  
  // Use refs to store current callback functions to avoid dependency issues
  const callbacksRef = useRef({
    onExecutionStarted,
    onExecutionCompleted,
    onExecutionFailed,
    onReportCreated,
    onReportUpdated,
    onReportDeleted,
  });
  
  // Update callbacks ref when props change
  useEffect(() => {
    callbacksRef.current = {
      onExecutionStarted,
      onExecutionCompleted,
      onExecutionFailed,
      onReportCreated,
      onReportUpdated,
      onReportDeleted,
    };
  }, [onExecutionStarted, onExecutionCompleted, onExecutionFailed, onReportCreated, onReportUpdated, onReportDeleted]);
  
  const { toast } = useToast();
  
  const showNotification = useCallback((event: RealtimeEvent) => {
    if (!showToastNotifications) return;
    
    switch (event.type) {
      case "execution_started":
        toast({
          title: "Report Execution Started",
          message: `Scheduled report execution has begun`,
          type: "info",
        });
        break;
      case "execution_completed":
        toast({
          title: "Report Execution Completed",
          message: `Report delivered to ${event.data.deliveredCount || 0} recipients`,
          type: "success",
        });
        break;
      case "execution_failed":
        toast({
          title: "Report Execution Failed",
          message: event.data.error || "An error occurred during report execution",
          type: "error",
        });
        break;
      case "report_created":
        toast({
          title: "Report Created",
          message: "A new scheduled report has been created",
          type: "success",
        });
        break;
      case "report_updated":
        toast({
          title: "Report Updated",
          message: "A scheduled report has been updated",
          type: "success",
        });
        break;
      case "report_deleted":
        toast({
          title: "Report Deleted",
          message: "A scheduled report has been deleted",
          type: "info",
        });
        break;
    }
  }, [showToastNotifications, toast]);
  
  const handleEvent = useCallback((event: RealtimeEvent) => {
    setLastEvent(event);
    
    const callbacks = callbacksRef.current;
    
    switch (event.type) {
      case "execution_started":
        callbacks.onExecutionStarted?.(event.data);
        break;
      case "execution_completed":
        callbacks.onExecutionCompleted?.(event.data);
        break;
      case "execution_failed":
        callbacks.onExecutionFailed?.(event.data);
        break;
      case "report_created":
        callbacks.onReportCreated?.(event.data);
        break;
      case "report_updated":
        callbacks.onReportUpdated?.(event.data);
        break;
      case "report_deleted":
        callbacks.onReportDeleted?.(event.data);
        break;
    }
    
    showNotification(event);
  }, [showNotification]); // Only depend on showNotification
  
  const connect = useCallback(() => {
    // Prevent multiple connections or connecting when already connected
    if (eventSourceRef.current || !organizationId || isConnecting || isConnected) {
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      const eventSource = new EventSource(
        `/api/scheduled-reports/stream?organizationId=${organizationId}`
      );
      
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        console.log("[ScheduledReports SSE] Connection opened");
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data: RealtimeEvent = JSON.parse(event.data);
          console.log("[ScheduledReports SSE] Event received:", data);
          handleEvent(data);
        } catch (err) {
          console.error("[ScheduledReports SSE] Error parsing event data:", err);
          setError("Error parsing event data");
        }
      };
      
      eventSource.onerror = (err) => {
        console.error("[ScheduledReports SSE] Connection error:", err);
        setIsConnected(false);
        setIsConnecting(false);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          setError("Connection closed by server");
          
          if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            console.log(
              `[ScheduledReports SSE] Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
            );
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
              }
              setIsConnected(false);
              setIsConnecting(false);
              // Use a small delay before reconnecting to prevent rapid reconnection loops
              setTimeout(() => {
                if (!eventSourceRef.current && !isConnected && !isConnecting) {
                  connect();
                }
              }, 1000);
            }, reconnectInterval);
          } else {
            setError("Maximum reconnection attempts reached");
          }
        } else {
          setError("Connection error occurred");
        }
      };
      
      // Handle specific event types
      eventSource.addEventListener("execution_started", (event) => {
        try {
          const data = JSON.parse(event.data);
          handleEvent({ type: "execution_started", data });
        } catch (err) {
          console.error("[ScheduledReports SSE] Error parsing execution_started event:", err);
        }
      });
      
      eventSource.addEventListener("execution_completed", (event) => {
        try {
          const data = JSON.parse(event.data);
          handleEvent({ type: "execution_completed", data });
        } catch (err) {
          console.error("[ScheduledReports SSE] Error parsing execution_completed event:", err);
        }
      });
      
      eventSource.addEventListener("execution_failed", (event) => {
        try {
          const data = JSON.parse(event.data);
          handleEvent({ type: "execution_failed", data });
        } catch (err) {
          console.error("[ScheduledReports SSE] Error parsing execution_failed event:", err);
        }
      });
      
      eventSource.addEventListener("report_created", (event) => {
        try {
          const data = JSON.parse(event.data);
          handleEvent({ type: "report_created", data });
        } catch (err) {
          console.error("[ScheduledReports SSE] Error parsing report_created event:", err);
        }
      });
      
      eventSource.addEventListener("report_updated", (event) => {
        try {
          const data = JSON.parse(event.data);
          handleEvent({ type: "report_updated", data });
        } catch (err) {
          console.error("[ScheduledReports SSE] Error parsing report_updated event:", err);
        }
      });
      
      eventSource.addEventListener("report_deleted", (event) => {
        try {
          const data = JSON.parse(event.data);
          handleEvent({ type: "report_deleted", data });
        } catch (err) {
          console.error("[ScheduledReports SSE] Error parsing report_deleted event:", err);
        }
      });
      
    } catch (err) {
      console.error("[ScheduledReports SSE] Error creating EventSource:", err);
      setError("Failed to establish connection");
      setIsConnecting(false);
    }
  }, [organizationId, handleEvent, autoReconnect, reconnectInterval]); // handleEvent is now stable
  
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
    console.log("[ScheduledReports SSE] Connection closed");
  }, []);
  
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connect();
    }, Math.max(1000, reconnectInterval / 2)); // Use at least 1 second delay
  }, [disconnect, connect, reconnectInterval]);
  
  // Auto-connect on mount and handle cleanup
  useEffect(() => {
    if (organizationId && !isConnected && !isConnecting && !eventSourceRef.current) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [organizationId]); // Only depend on organizationId to prevent infinite loops
  
  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, optionally disconnect to save resources
        console.log("[ScheduledReports SSE] Page hidden");
      } else {
        // Page is visible, ensure connection is active
        console.log("[ScheduledReports SSE] Page visible");
        // Use a timeout to check connection state and reconnect if needed
        setTimeout(() => {
          if (organizationId) {
            const currentIsConnected = eventSourceRef.current?.readyState === EventSource.OPEN;
            if (!currentIsConnected) {
              connect();
            }
          }
        }, 500); // Small delay to prevent rapid reconnections
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [organizationId, connect]); // Minimal dependencies
  
  return {
    isConnected,
    isConnecting,
    error,
    lastEvent,
    connect,
    disconnect,
    reconnect,
  };
}

export type { RealtimeEvent, UseScheduledReportsRealtimeOptions, UseScheduledReportsRealtimeReturn };