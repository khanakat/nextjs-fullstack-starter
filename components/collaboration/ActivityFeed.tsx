import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCollaboration } from "./CollaborationProvider";
import {
  CollaborationEvent,
  CollaborationEventType,
} from "@/lib/collaboration/event-service";
import {
  Activity,
  FileEdit,
  MessageCircle,
  Users,
  Eye,
  Lock,
  Unlock,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
  className?: string;
  sessionId?: string;
  maxItems?: number;
  showFilters?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface ActivityItem {
  id: string;
  type: CollaborationEventType;
  userId: string;
  timestamp: Date;
  data: any;
  metadata?: any;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const EVENT_CONFIGS: Record<
  CollaborationEventType,
  {
    icon: React.ReactNode;
    color: string;
    getDescription: (event: CollaborationEvent) => string;
  }
> = {
  document_change: {
    icon: <FileEdit className="h-4 w-4" />,
    color: "text-blue-600",
    getDescription: (event) => {
      const ops = event.data.operations?.length || 0;
      return `made ${ops} change${ops !== 1 ? "s" : ""} to document`;
    },
  },
  cursor_move: {
    icon: <Eye className="h-4 w-4" />,
    color: "text-gray-500",
    getDescription: () => "moved cursor",
  },
  selection_change: {
    icon: <Eye className="h-4 w-4" />,
    color: "text-gray-500",
    getDescription: () => "changed selection",
  },
  typing_start: {
    icon: <FileEdit className="h-4 w-4" />,
    color: "text-green-600",
    getDescription: () => "started typing",
  },
  typing_stop: {
    icon: <FileEdit className="h-4 w-4" />,
    color: "text-gray-500",
    getDescription: () => "stopped typing",
  },
  comment_add: {
    icon: <MessageCircle className="h-4 w-4" />,
    color: "text-purple-600",
    getDescription: () => "added a comment",
  },
  comment_update: {
    icon: <MessageCircle className="h-4 w-4" />,
    color: "text-purple-600",
    getDescription: () => "updated a comment",
  },
  comment_delete: {
    icon: <MessageCircle className="h-4 w-4" />,
    color: "text-red-600",
    getDescription: () => "deleted a comment",
  },
  user_join: {
    icon: <Users className="h-4 w-4" />,
    color: "text-green-600",
    getDescription: () => "joined the session",
  },
  user_leave: {
    icon: <Users className="h-4 w-4" />,
    color: "text-orange-600",
    getDescription: () => "left the session",
  },
  presence_update: {
    icon: <Activity className="h-4 w-4" />,
    color: "text-blue-500",
    getDescription: (event) => {
      const status = event.data.status;
      return `is now ${status}`;
    },
  },
  document_lock: {
    icon: <Lock className="h-4 w-4" />,
    color: "text-red-600",
    getDescription: () => "locked the document",
  },
  document_unlock: {
    icon: <Unlock className="h-4 w-4" />,
    color: "text-green-600",
    getDescription: () => "unlocked the document",
  },
  version_create: {
    icon: <GitBranch className="h-4 w-4" />,
    color: "text-indigo-600",
    getDescription: (event) => {
      const version = event.data.version;
      return `created version ${version}`;
    },
  },
  conflict_detected: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-yellow-600",
    getDescription: () => "had a conflict resolved",
  },
  sync_request: {
    icon: <RefreshCw className="h-4 w-4" />,
    color: "text-gray-500",
    getDescription: () => "requested sync",
  },
  sync_response: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-green-500",
    getDescription: () => "completed sync",
  },
};

export function ActivityFeed({
  className,
  sessionId,
  maxItems = 50,
  showFilters = true,
  autoRefresh = true,
  refreshInterval = 5000,
}: ActivityFeedProps) {
  const { currentSession } = useCollaboration();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>(
    [],
  );
  const [selectedFilters, setSelectedFilters] = useState<
    Set<CollaborationEventType>
  >(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const targetSessionId = sessionId || currentSession;

  // Convert collaboration events to activity items
  const convertEventToActivity = useCallback(
    (event: CollaborationEvent): ActivityItem => {
      const config = EVENT_CONFIGS[event.type];

      return {
        id: event.id,
        type: event.type,
        userId: event.userId,
        timestamp: event.timestamp,
        data: event.data,
        metadata: event.metadata,
        description: config.getDescription(event),
        icon: config.icon,
        color: config.color,
      };
    },
    [],
  );

  // Fetch activities from API
  const fetchActivities = useCallback(async () => {
    if (!targetSessionId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/collaboration/events?sessionId=${targetSessionId}&limit=${maxItems}`,
      );
      if (response.ok) {
        const data = await response.json();
        const activityItems = data.events.map(convertEventToActivity);
        setActivities(activityItems);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setIsLoading(false);
    }
  }, [targetSessionId, maxItems, convertEventToActivity]);

  // Listen to real-time events
  const { onDocumentChange, onUserJoin, onUserLeave, onPresenceUpdate } =
    useCollaboration();

  useEffect(() => {
    const unsubscribers = [
      onDocumentChange((event) => {
        const activity = convertEventToActivity(event);
        setActivities((prev) => [activity, ...prev.slice(0, maxItems - 1)]);
      }),
      onUserJoin((event) => {
        const activity = convertEventToActivity(event);
        setActivities((prev) => [activity, ...prev.slice(0, maxItems - 1)]);
      }),
      onUserLeave((event) => {
        const activity = convertEventToActivity(event);
        setActivities((prev) => [activity, ...prev.slice(0, maxItems - 1)]);
      }),
      onPresenceUpdate((presence) => {
        const event: CollaborationEvent = {
          id: `presence_${Date.now()}`,
          sessionId: targetSessionId || "",
          type: "presence_update",
          data: presence,
          userId: presence.userId,
          timestamp: new Date(),
        };
        const activity = convertEventToActivity(event);
        setActivities((prev) => [activity, ...prev.slice(0, maxItems - 1)]);
      }),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [
    targetSessionId,
    maxItems,
    convertEventToActivity,
    onDocumentChange,
    onUserJoin,
    onUserLeave,
    onPresenceUpdate,
  ]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !targetSessionId) return;

    fetchActivities(); // Initial fetch

    const interval = setInterval(fetchActivities, refreshInterval);
    return () => clearInterval(interval);
  }, [targetSessionId, autoRefresh, refreshInterval, fetchActivities]);

  // Apply filters
  useEffect(() => {
    if (selectedFilters.size === 0) {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(
        activities.filter((activity) => selectedFilters.has(activity.type)),
      );
    }
  }, [activities, selectedFilters]);

  const toggleFilter = (eventType: CollaborationEventType) => {
    const newFilters = new Set(selectedFilters);
    if (newFilters.has(eventType)) {
      newFilters.delete(eventType);
    } else {
      newFilters.add(eventType);
    }
    setSelectedFilters(newFilters);
  };

  const clearFilters = () => {
    setSelectedFilters(new Set());
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getEventTypeLabel = (type: CollaborationEventType) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get unique event types from activities for filter options
  const availableEventTypes = Array.from(
    new Set(activities.map((a) => a.type)),
  );

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchActivities}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")}
              />
              Refresh
            </Button>

            {showFilters && (
              <div className="flex items-center gap-1">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {selectedFilters.size > 0
                    ? `${selectedFilters.size} filters`
                    : "All"}
                </span>
              </div>
            )}
          </div>
        </div>

        {showFilters && availableEventTypes.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {availableEventTypes.map((eventType) => (
                <Badge
                  key={eventType}
                  variant={
                    selectedFilters.has(eventType) ? "default" : "outline"
                  }
                  className="cursor-pointer text-xs"
                  onClick={() => toggleFilter(eventType)}
                >
                  {getEventTypeLabel(eventType)}
                </Badge>
              ))}
            </div>

            {selectedFilters.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 px-2 text-xs"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Last updated: {formatTimestamp(lastRefresh)}</span>
          {filteredActivities.length > 0 && (
            <>
              <span>•</span>
              <span>{filteredActivities.length} activities</span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-6 pb-6">
          {filteredActivities.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading activities...
                </div>
              ) : activities.length === 0 ? (
                "No activities yet"
              ) : (
                "No activities match the selected filters"
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg transition-colors",
                    index === 0 && "bg-muted/50", // Highlight newest
                    "hover:bg-muted/30",
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`/api/avatar/${activity.userId}`} />
                      <AvatarFallback className="text-xs">
                        {activity.userId.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        User {activity.userId.slice(0, 8)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {activity.description}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          activity.color,
                        )}
                      >
                        {activity.icon}
                        <span>{getEventTypeLabel(activity.type)}</span>
                      </div>
                      <span>•</span>
                      <span>{formatTimestamp(activity.timestamp)}</span>

                      {activity.metadata?.operationCount && (
                        <>
                          <span>•</span>
                          <span>
                            {activity.metadata.operationCount} operations
                          </span>
                        </>
                      )}
                    </div>

                    {/* Additional data for specific event types */}
                    {activity.type === "document_change" &&
                      activity.data.operations && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {activity.data.operations
                            .slice(0, 2)
                            .map((op: any, i: number) => (
                              <div key={i} className="font-mono">
                                {op.type}:{" "}
                                {op.content
                                  ? `"${op.content.slice(0, 30)}${op.content.length > 30 ? "..." : ""}"`
                                  : `pos ${op.position}`}
                              </div>
                            ))}
                          {activity.data.operations.length > 2 && (
                            <div className="text-muted-foreground">
                              +{activity.data.operations.length - 2} more
                              operations
                            </div>
                          )}
                        </div>
                      )}

                    {activity.type === "conflict_detected" &&
                      activity.data.conflicts && (
                        <div className="mt-1 text-xs text-yellow-600">
                          {activity.data.conflicts.length} conflict(s)
                          auto-resolved
                        </div>
                      )}
                  </div>

                  {index === 0 && (
                    <Badge variant="outline" className="text-xs">
                      New
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface ActivitySummaryProps {
  className?: string;
  sessionId?: string;
  timeRange?: "hour" | "day" | "week";
}

export function ActivitySummary({
  className,
  sessionId,
  timeRange = "hour",
}: ActivitySummaryProps) {
  const { currentSession } = useCollaboration();
  const [summary, setSummary] = useState({
    totalEvents: 0,
    activeUsers: 0,
    documentChanges: 0,
    comments: 0,
    conflicts: 0,
  });

  const targetSessionId = sessionId || currentSession;

  useEffect(() => {
    if (!targetSessionId) return;

    const fetchSummary = async () => {
      try {
        const response = await fetch(
          `/api/collaboration/summary?sessionId=${targetSessionId}&timeRange=${timeRange}`,
        );
        if (response.ok) {
          const data = await response.json();
          setSummary(data);
        }
      } catch (error) {
        console.error("Error fetching activity summary:", error);
      }
    };

    fetchSummary();
  }, [targetSessionId, timeRange]);

  const summaryItems = [
    {
      label: "Total Events",
      value: summary.totalEvents,
      icon: <Activity className="h-4 w-4" />,
      color: "text-blue-600",
    },
    {
      label: "Active Users",
      value: summary.activeUsers,
      icon: <Users className="h-4 w-4" />,
      color: "text-green-600",
    },
    {
      label: "Document Changes",
      value: summary.documentChanges,
      icon: <FileEdit className="h-4 w-4" />,
      color: "text-purple-600",
    },
    {
      label: "Comments",
      value: summary.comments,
      icon: <MessageCircle className="h-4 w-4" />,
      color: "text-orange-600",
    },
    {
      label: "Conflicts Resolved",
      value: summary.conflicts,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "text-yellow-600",
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-5 gap-4", className)}>
      {summaryItems.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className={cn("flex-shrink-0", item.color)}>{item.icon}</div>
              <div className="min-w-0">
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="text-xs text-muted-foreground">
                  {item.label}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
