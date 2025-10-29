import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCollaboration } from "./CollaborationProvider";
import { UserPresence } from "@/lib/collaboration/event-service";
import {
  Users,
  Circle,
  Clock,
  MapPin,
  Activity,
  Eye,
  EyeOff,
  Settings,
  MessageCircle,
  Phone,
  Video,
  MoreHorizontal,
  Crown,
  Shield,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamPresenceProps {
  className?: string;
  sessionId?: string;
  showLocation?: boolean;
  showActivity?: boolean;
  maxUsers?: number;
  layout?: "compact" | "detailed" | "grid";
}

interface ExtendedUserPresence extends UserPresence {
  role?: "owner" | "admin" | "member" | "viewer";
  avatar?: string;
  name?: string;
  email?: string;
  department?: string;
  timezone?: string;
  permissions?: string[];
  activity?: string;
}

const STATUS_CONFIGS = {
  online: {
    color: "bg-green-500",
    textColor: "text-green-600",
    label: "Online",
    icon: <Circle className="h-3 w-3 fill-current" />,
  },
  away: {
    color: "bg-yellow-500",
    textColor: "text-yellow-600",
    label: "Away",
    icon: <Clock className="h-3 w-3 fill-current" />,
  },
  busy: {
    color: "bg-red-500",
    textColor: "text-red-600",
    label: "Busy",
    icon: <Circle className="h-3 w-3 fill-current" />,
  },
  offline: {
    color: "bg-gray-400",
    textColor: "text-gray-500",
    label: "Offline",
    icon: <Circle className="h-3 w-3" />,
  },
};

const ROLE_CONFIGS = {
  owner: {
    icon: <Crown className="h-3 w-3" />,
    color: "text-yellow-600",
    label: "Owner",
  },
  admin: {
    icon: <Shield className="h-3 w-3" />,
    color: "text-blue-600",
    label: "Admin",
  },
  member: {
    icon: <User className="h-3 w-3" />,
    color: "text-gray-600",
    label: "Member",
  },
  viewer: {
    icon: <Eye className="h-3 w-3" />,
    color: "text-gray-500",
    label: "Viewer",
  },
};

export function TeamPresence({
  className,
  sessionId,
  showLocation = true,
  showActivity = true,
  maxUsers = 50,
  layout = "detailed",
}: TeamPresenceProps) {
  const { currentSession } = useCollaboration();
  const [users, setUsers] = useState<ExtendedUserPresence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showOffline, setShowOffline] = useState(false);

  const targetSessionId = sessionId || currentSession;

  // Fetch extended user information
  const fetchUserDetails = useCallback(async () => {
    if (!targetSessionId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/collaboration/presence?sessionId=${targetSessionId}&includeOffline=${showOffline}`,
      );
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching user presence:", error);
    } finally {
      setIsLoading(false);
    }
  }, [targetSessionId, showOffline]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  // Update users from real-time presence updates
  const { onPresenceUpdate } = useCollaboration();

  const handlePresenceUpdate = useCallback((presence: UserPresence) => {
    setUsers((prev) => {
      const existingIndex = prev.findIndex((u) => u.userId === presence.userId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...presence };
        return updated;
      } else {
        return [...prev, presence as ExtendedUserPresence];
      }
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onPresenceUpdate(handlePresenceUpdate);
    return unsubscribe;
  }, [onPresenceUpdate, handlePresenceUpdate]);

  const onlineUsers = users.filter((u) => u.status === "online");
  const awayUsers = users.filter((u) => u.status === "away");
  const busyUsers = users.filter((u) => u.status === "busy");
  const offlineUsers = users.filter((u) => u.status === "offline");

  const formatLastSeen = (lastSeen: Date) => {
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

  const formatLocation = (location: string) => {
    // Parse location string (e.g., "/dashboard/analytics?tab=reports")
    const parts = location.split("?")[0].split("/").filter(Boolean);
    if (parts.length === 0) return "Home";

    const page = parts[parts.length - 1];
    return page.charAt(0).toUpperCase() + page.slice(1).replace(/-/g, " ");
  };

  const UserCard = ({
    user,
    compact = false,
  }: {
    user: ExtendedUserPresence;
    compact?: boolean;
  }) => {
    const statusConfig = STATUS_CONFIGS[user.status];
    const roleConfig = user.role ? ROLE_CONFIGS[user.role] : null;

    if (compact) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage
                    src={user.avatar || `/api/avatar/${user.userId}`}
                  />
                  <AvatarFallback className="text-xs">
                    {(user.name || user.userId).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                    statusConfig.color,
                  )}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-1">
                <div className="font-medium">
                  {user.name || `User ${user.userId.slice(0, 8)}`}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {statusConfig.icon}
                  <span className={statusConfig.textColor}>
                    {statusConfig.label}
                  </span>
                </div>
                {showLocation && user.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{formatLocation(user.location)}</span>
                  </div>
                )}
                {user.status !== "online" && (
                  <div className="text-xs text-muted-foreground">
                    Last seen {formatLastSeen(user.lastSeen)}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar || `/api/avatar/${user.userId}`} />
            <AvatarFallback>
              {(user.name || user.userId).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
              statusConfig.color,
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium truncate">
              {user.name || `User ${user.userId.slice(0, 8)}`}
            </span>
            {roleConfig && (
              <div className={cn("flex items-center gap-1", roleConfig.color)}>
                {roleConfig.icon}
                <span className="text-xs">{roleConfig.label}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div
              className={cn("flex items-center gap-1", statusConfig.textColor)}
            >
              {statusConfig.icon}
              <span>{statusConfig.label}</span>
            </div>

            {showLocation && user.location && (
              <>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">
                    {formatLocation(user.location)}
                  </span>
                </div>
              </>
            )}
          </div>

          {user.status !== "online" && (
            <div className="text-xs text-muted-foreground mt-1">
              Last seen {formatLastSeen(user.lastSeen)}
            </div>
          )}

          {showActivity && user.activity && (
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span className="truncate">{user.activity}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {user.status === "online" && (
            <>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Video className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (layout === "compact") {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Team ({onlineUsers.length} online)
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOffline(!showOffline)}
            >
              {showOffline ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(showOffline ? users : onlineUsers)
              .slice(0, maxUsers)
              .map((user) => (
                <UserCard key={user.userId} user={user} compact />
              ))}
            {users.length > maxUsers && (
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs font-medium">
                +{users.length - maxUsers}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (layout === "grid") {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Presence
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOffline(!showOffline)}
              >
                {showOffline ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {showOffline ? "Hide Offline" : "Show Offline"}
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(showOffline ? users : onlineUsers)
              .slice(0, maxUsers)
              .map((user) => (
                <div
                  key={user.userId}
                  className="p-3 rounded-lg border bg-card"
                >
                  <UserCard user={user} />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detailed layout (default)
  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Presence
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOffline(!showOffline)}
            >
              {showOffline ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showOffline ? "Hide Offline" : "Show Offline"}
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status summary */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>{onlineUsers.length} online</span>
          </div>
          {awayUsers.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span>{awayUsers.length} away</span>
            </div>
          )}
          {busyUsers.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span>{busyUsers.length} busy</span>
            </div>
          )}
          {showOffline && offlineUsers.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-gray-400" />
              <span>{offlineUsers.length} offline</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="px-6 pb-6 space-y-1">
            {/* Online users */}
            {onlineUsers.length > 0 && (
              <div className="space-y-1">
                {onlineUsers.map((user) => (
                  <UserCard key={user.userId} user={user} />
                ))}
              </div>
            )}

            {/* Away users */}
            {awayUsers.length > 0 && (
              <>
                {onlineUsers.length > 0 && <Separator className="my-4" />}
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground px-3 py-1">
                    Away ({awayUsers.length})
                  </div>
                  {awayUsers.map((user) => (
                    <UserCard key={user.userId} user={user} />
                  ))}
                </div>
              </>
            )}

            {/* Busy users */}
            {busyUsers.length > 0 && (
              <>
                {(onlineUsers.length > 0 || awayUsers.length > 0) && (
                  <Separator className="my-4" />
                )}
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground px-3 py-1">
                    Busy ({busyUsers.length})
                  </div>
                  {busyUsers.map((user) => (
                    <UserCard key={user.userId} user={user} />
                  ))}
                </div>
              </>
            )}

            {/* Offline users */}
            {showOffline && offlineUsers.length > 0 && (
              <>
                {(onlineUsers.length > 0 ||
                  awayUsers.length > 0 ||
                  busyUsers.length > 0) && <Separator className="my-4" />}
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground px-3 py-1">
                    Offline ({offlineUsers.length})
                  </div>
                  {offlineUsers.slice(0, 10).map((user) => (
                    <UserCard key={user.userId} user={user} />
                  ))}
                  {offlineUsers.length > 10 && (
                    <div className="text-center py-2">
                      <Button variant="ghost" size="sm">
                        Show {offlineUsers.length - 10} more offline users
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}

            {users.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground py-8">
                No users in this session
              </div>
            )}

            {isLoading && (
              <div className="text-center text-muted-foreground py-8">
                Loading team presence...
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface QuickPresenceProps {
  className?: string;
  maxUsers?: number;
}

export function QuickPresence({ className, maxUsers = 5 }: QuickPresenceProps) {
  const { activeUsers } = useCollaboration();
  const onlineUsers = activeUsers.slice(0, maxUsers);
  const remainingCount = Math.max(0, activeUsers.length - maxUsers);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {onlineUsers.map((user, index) => (
        <TooltipProvider key={user.userId}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar
                className={cn(
                  "h-6 w-6 border-2 border-background",
                  index > 0 && "-ml-2",
                )}
              >
                <AvatarImage src={`/api/avatar/${user.userId}`} />
                <AvatarFallback className="text-xs">
                  {user.userId.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                User {user.userId.slice(0, 8)} is online
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}

      {remainingCount > 0 && (
        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium -ml-2 border-2 border-background">
          +{remainingCount}
        </div>
      )}

      {activeUsers.length === 0 && (
        <div className="text-xs text-muted-foreground">No one else online</div>
      )}
    </div>
  );
}
