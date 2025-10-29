import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCollaboration } from "./CollaborationProvider";
import { UserPresence } from "@/lib/collaboration/event-service";
import { Users, Circle, Eye, Edit, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PresenceIndicatorProps {
  className?: string;
  showDetails?: boolean;
  maxUsers?: number;
  size?: "sm" | "md" | "lg";
}

export function PresenceIndicator({
  className,
  showDetails = false,
  maxUsers = 5,
  size = "md",
}: PresenceIndicatorProps) {
  const { activeUsers, connectionStatus } = useCollaboration();

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const getStatusColor = (status: UserPresence["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusIcon = (status: UserPresence["status"]) => {
    switch (status) {
      case "online":
        return <Circle className="h-2 w-2 fill-current" />;
      case "away":
        return <Clock className="h-2 w-2" />;
      case "busy":
        return <Edit className="h-2 w-2" />;
      case "offline":
        return <Circle className="h-2 w-2 fill-current opacity-50" />;
      default:
        return <Circle className="h-2 w-2 fill-current" />;
    }
  };

  const formatLastSeen = (lastSeen: Date | string) => {
    if (!lastSeen) return "Never";

    const now = new Date();
    const diff = now.getTime() - new Date(lastSeen).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const visibleUsers = activeUsers.slice(0, maxUsers);
  const hiddenCount = Math.max(0, activeUsers.length - maxUsers);

  if (connectionStatus === "disconnected" || connectionStatus === "error") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-muted-foreground",
          className,
        )}
      >
        <Circle className="h-2 w-2 fill-current text-gray-400" />
        <span className="text-sm">Offline</span>
      </div>
    );
  }

  if (activeUsers.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-muted-foreground",
          className,
        )}
      >
        <Users className="h-4 w-4" />
        <span className="text-sm">No active users</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        {/* User avatars */}
        <div className="flex -space-x-2">
          {visibleUsers.map((user) => (
            <Tooltip key={user.userId}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar
                    className={cn(
                      sizeClasses[size],
                      "border-2 border-background",
                    )}
                  >
                    <AvatarImage src={`/api/avatar/${user.userId}`} />
                    <AvatarFallback className="text-xs">
                      {user.userId.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Status indicator */}
                  <div
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background flex items-center justify-center",
                      getStatusColor(user.status),
                    )}
                  >
                    <div className="text-white">
                      {getStatusIcon(user.status)}
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1">
                  <div className="font-medium">User {user.userId}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        getStatusColor(user.status),
                      )}
                    />
                    <span className="capitalize">{user.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last seen: {formatLastSeen(user.lastSeen)}
                  </div>
                  {user.location && (
                    <div className="text-xs text-muted-foreground">
                      Location: {user.location}
                    </div>
                  )}
                  {user.documentId && (
                    <div className="text-xs text-muted-foreground">
                      Editing: {user.documentId}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Show count for hidden users */}
          {hiddenCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground",
                    sizeClasses[size],
                  )}
                >
                  <span className="text-xs font-medium">+{hiddenCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-sm">
                  {hiddenCount} more user{hiddenCount > 1 ? "s" : ""} online
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Connection status and details */}
        {showDetails && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Circle
                className={cn(
                  "h-2 w-2 mr-1 fill-current",
                  connectionStatus === "connected"
                    ? "text-green-500"
                    : "text-yellow-500",
                )}
              />
              {connectionStatus === "connected" ? "Live" : "Connecting"}
            </Badge>

            <span className="text-sm text-muted-foreground">
              {activeUsers.length} user{activeUsers.length !== 1 ? "s" : ""}{" "}
              online
            </span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

interface UserPresenceListProps {
  className?: string;
  showOfflineUsers?: boolean;
}

export function UserPresenceList({
  className,
  showOfflineUsers = false,
}: UserPresenceListProps) {
  const { activeUsers } = useCollaboration();

  const getStatusColor = (status: UserPresence["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const onlineUsers = activeUsers.filter((user) => user.status !== "offline");
  const offlineUsers = activeUsers.filter((user) => user.status === "offline");

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Users className="h-4 w-4" />
        Active Users ({onlineUsers.length})
      </div>

      <div className="space-y-1">
        {onlineUsers.map((user) => (
          <div
            key={user.userId}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
          >
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`/api/avatar/${user.userId}`} />
                <AvatarFallback className="text-xs">
                  {user.userId.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                  getStatusColor(user.status),
                )}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                User {user.userId}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="capitalize">{user.status}</span>
                {user.documentId && (
                  <>
                    <span>•</span>
                    <Eye className="h-3 w-3" />
                    <span className="truncate">{user.documentId}</span>
                  </>
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              {user.lastSeen
                ? new Date(user.lastSeen).toLocaleString()
                : "Never"}
            </div>
          </div>
        ))}

        {onlineUsers.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No users currently online
          </div>
        )}
      </div>

      {showOfflineUsers && offlineUsers.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-sm font-medium mt-4">
            <Circle className="h-4 w-4 text-muted-foreground" />
            Recently Active ({offlineUsers.length})
          </div>

          <div className="space-y-1">
            {offlineUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center gap-3 p-2 rounded-lg opacity-60"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`/api/avatar/${user.userId}`} />
                  <AvatarFallback className="text-xs">
                    {user.userId.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    User {user.userId}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last seen{" "}
                    {user.lastSeen
                      ? new Date(user.lastSeen).toLocaleString()
                      : "Never"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
