"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  MessageCircle,
  FileText,
  Video,
  Plus,
  Search,
  Clock,
  MoreVertical,
  ChevronRight,
  RefreshCw,
  Paperclip,
  Send,
  Mic,
  Camera,
} from "lucide-react";

import { useNetworkAwareLoading } from "@/hooks/use-mobile-performance";
import { useOffline } from "@/hooks/use-offline";

interface CollaborationItem {
  id: string;
  type: "document" | "meeting" | "chat" | "project";
  title: string;
  description?: string;
  participants: Participant[];
  lastActivity: string;
  status: "active" | "scheduled" | "completed" | "draft";
  unreadCount?: number;
  isOwner: boolean;
  thumbnail?: string;
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "offline" | "away";
  role?: string;
}

interface CollaborationStats {
  activeCollaborations: number;
  totalParticipants: number;
  documentsShared: number;
  meetingsScheduled: number;
}

/**
 * Mobile-optimized Collaboration Interface
 */
export function MobileCollaboration() {
  const [collaborations, setCollaborations] = useState<CollaborationItem[]>([]);
  const [stats, setStats] = useState<CollaborationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { loadingStrategy } = useNetworkAwareLoading();
  const { isOnline, getCachedData, setCachedData, executeOrQueue } =
    useOffline();

  // Load collaboration data
  useEffect(() => {
    const loadCollaborations = async () => {
      setIsLoading(true);

      try {
        // Try to get cached data first if offline
        if (!isOnline) {
          const cachedCollaborations = getCachedData("collaborations-list");
          const cachedStats = getCachedData("collaboration-stats");
          if (cachedCollaborations && cachedStats) {
            setCollaborations(cachedCollaborations);
            setStats(cachedStats);
            setIsLoading(false);
            return;
          }
        }

        // Fetch fresh data
        const [collaborationsResponse, statsResponse] = await Promise.all([
          fetch("/api/collaboration", {
            headers: {
              "Cache-Control":
                loadingStrategy === "conservative" ? "max-age=300" : "no-cache",
            },
          }),
          fetch("/api/collaboration/stats", {
            headers: {
              "Cache-Control":
                loadingStrategy === "conservative" ? "max-age=300" : "no-cache",
            },
          }),
        ]);

        if (collaborationsResponse.ok && statsResponse.ok) {
          const collaborationsData = await collaborationsResponse.json();
          const statsData = await statsResponse.json();

          setCollaborations(collaborationsData.collaborations || []);
          setStats(statsData);

          setCachedData(
            "collaborations-list",
            collaborationsData.collaborations || [],
          );
          setCachedData("collaboration-stats", statsData);
          setLastUpdated(new Date());
        } else {
          // Fallback to cached data or mock data
          const cachedCollaborations = getCachedData("collaborations-list");
          const cachedStats = getCachedData("collaboration-stats");

          if (cachedCollaborations && cachedStats) {
            setCollaborations(cachedCollaborations);
            setStats(cachedStats);
          } else {
            // Mock data for demo
            const mockCollaborations: CollaborationItem[] = [
              {
                id: "1",
                type: "document",
                title: "Q1 Strategy Document",
                description: "Quarterly planning and strategy document",
                participants: [
                  {
                    id: "1",
                    name: "John Doe",
                    status: "online",
                    role: "Editor",
                  },
                  {
                    id: "2",
                    name: "Jane Smith",
                    status: "away",
                    role: "Reviewer",
                  },
                  {
                    id: "3",
                    name: "Mike Johnson",
                    status: "offline",
                    role: "Viewer",
                  },
                ],
                lastActivity: "2024-01-15T14:30:00Z",
                status: "active",
                unreadCount: 3,
                isOwner: true,
              },
              {
                id: "2",
                type: "meeting",
                title: "Weekly Team Sync",
                description: "Weekly team synchronization meeting",
                participants: [
                  { id: "1", name: "John Doe", status: "online" },
                  { id: "4", name: "Sarah Wilson", status: "online" },
                  { id: "5", name: "Tom Brown", status: "away" },
                ],
                lastActivity: "2024-01-15T16:00:00Z",
                status: "scheduled",
                isOwner: false,
              },
              {
                id: "3",
                type: "chat",
                title: "Project Alpha Discussion",
                participants: [
                  { id: "1", name: "John Doe", status: "online" },
                  { id: "2", name: "Jane Smith", status: "online" },
                  { id: "6", name: "Alex Chen", status: "offline" },
                ],
                lastActivity: "2024-01-15T13:45:00Z",
                status: "active",
                unreadCount: 7,
                isOwner: false,
              },
            ];

            const mockStats: CollaborationStats = {
              activeCollaborations: 5,
              totalParticipants: 12,
              documentsShared: 8,
              meetingsScheduled: 3,
            };

            setCollaborations(mockCollaborations);
            setStats(mockStats);
          }
        }
      } catch (error) {
        console.error("Failed to load collaborations:", error);
        // Try cached data as fallback
        const cachedCollaborations = getCachedData("collaborations-list");
        const cachedStats = getCachedData("collaboration-stats");
        if (cachedCollaborations && cachedStats) {
          setCollaborations(cachedCollaborations);
          setStats(cachedStats);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCollaborations();
  }, [isOnline, loadingStrategy, getCachedData, setCachedData]);

  // Filter collaborations
  const filteredCollaborations = collaborations.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "meeting":
        return <Video className="w-4 h-4 text-green-500" />;
      case "chat":
        return <MessageCircle className="w-4 h-4 text-purple-500" />;
      case "project":
        return <Users className="w-4 h-4 text-orange-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "scheduled":
        return "secondary";
      case "completed":
        return "outline";
      case "draft":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getParticipantStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const handleJoinCollaboration = async (collaborationId: string) => {
    try {
      await executeOrQueue(
        {
          type: "create",
          entity: "collaboration",
          data: { id: collaborationId },
        },
        async () => {
          const response = await fetch(
            `/api/collaboration/${collaborationId}/join`,
            {
              method: "POST",
            },
          );

          if (!response.ok) {
            throw new Error("Failed to join collaboration");
          }

          return response.json();
        },
      );

      // Navigate to collaboration
      window.location.href = `/collaboration/${collaborationId}`;
    } catch (error) {
      console.error("Failed to join collaboration:", error);
    }
  };

  const refreshData = () => {
    setLastUpdated(null);
    setCollaborations([]);
    setStats(null);
    setIsLoading(true);
    // Trigger reload
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Collaboration</h2>
          <RefreshCw className="w-5 h-5 animate-spin" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Collaboration</h2>
          {lastUpdated && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={!isOnline}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => (window.location.href = "/collaboration/new")}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Active</span>
              </div>
              <div className="text-2xl font-bold">
                {stats.activeCollaborations}
              </div>
              <div className="text-xs text-gray-600">
                {stats.totalParticipants} participants
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Documents</span>
              </div>
              <div className="text-2xl font-bold">{stats.documentsShared}</div>
              <div className="text-xs text-gray-600">
                {stats.meetingsScheduled} meetings
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search collaborations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {["all", "document", "meeting", "chat", "project"].map((type) => (
            <Button
              key={type}
              variant={filterType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(type)}
              className="whitespace-nowrap"
            >
              {type === "all" ? (
                <Users className="w-3 h-3 mr-1" />
              ) : (
                getTypeIcon(type)
              )}
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Collaborations List */}
      <div className="space-y-3">
        {filteredCollaborations.map((item) => (
          <Card
            key={item.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getTypeIcon(item.type)}
                    <h3 className="font-medium text-sm">{item.title}</h3>
                    {item.unreadCount && item.unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="text-xs px-1.5 py-0.5 h-5"
                      >
                        {item.unreadCount}
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(item.lastActivity).toLocaleDateString()}
                    </span>
                    {item.isOwner && (
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0.5 h-5"
                      >
                        Owner
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge
                    variant={getStatusColor(item.status) as any}
                    className="text-xs"
                  >
                    {item.status}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Participants */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {item.participants.slice(0, 3).map((participant) => (
                      <div key={participant.id} className="relative">
                        <Avatar className="w-6 h-6 border-2 border-white">
                          <AvatarImage src={participant.avatar} />
                          <AvatarFallback className="text-xs">
                            {participant.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${getParticipantStatusColor(participant.status)}`}
                        />
                      </div>
                    ))}
                    {item.participants.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                        <span className="text-xs font-medium">
                          +{item.participants.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {item.participants.length} participant
                    {item.participants.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinCollaboration(item.id);
                  }}
                  className="h-7 px-3"
                >
                  {item.type === "meeting" ? "Join" : "Open"}
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCollaborations.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || filterType !== "all"
              ? "No collaborations match your criteria"
              : "No active collaborations"}
          </p>
          <Button
            onClick={() => (window.location.href = "/collaboration/new")}
            className="mt-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start Collaboration
          </Button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-12 flex-col gap-1"
          onClick={() => (window.location.href = "/collaboration/documents")}
        >
          <FileText className="w-4 h-4" />
          <span className="text-xs">Documents</span>
        </Button>

        <Button
          variant="outline"
          className="h-12 flex-col gap-1"
          onClick={() => (window.location.href = "/collaboration/meetings")}
        >
          <Video className="w-4 h-4" />
          <span className="text-xs">Meetings</span>
        </Button>
      </div>

      {/* Quick Chat */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Quick Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              className="flex-1 text-sm"
              disabled={!isOnline}
            />
            <Button size="sm" disabled={!isOnline}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" disabled={!isOnline}>
              <Paperclip className="w-3 h-3" />
            </Button>
            <Button variant="outline" size="sm" disabled={!isOnline}>
              <Mic className="w-3 h-3" />
            </Button>
            <Button variant="outline" size="sm" disabled={!isOnline}>
              <Camera className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Some collaboration features may be limited while offline</p>
        </div>
      )}
    </div>
  );
}
