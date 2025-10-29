"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useConditionalUser } from "@/components/conditional-clerk";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Activity,
  MessageSquare,
  Clock,
  Eye,
  Settings,
  Plus,
  Search,
} from "lucide-react";
import { CollaborationProvider } from "@/components/collaboration/CollaborationProvider";
import { TeamPresence } from "@/components/collaboration/TeamPresence";
import { ActivityFeed } from "@/components/collaboration/ActivityFeed";
import { toast } from "sonner";

interface CollaborationSession {
  id: string;
  type: string;
  title: string;
  status: "active" | "paused" | "ended";
  participantCount: number;
  createdAt: string;
  lastActivity: string;
  metadata?: any;
}

interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  totalParticipants: number;
  averageSessionDuration: number;
  recentActivity: number;
}

function CollaborationDashboardContent() {
  const { user, isLoaded, isSignedIn } = useConditionalUser();
  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (user && isSignedIn) {
      fetchSessions();
      fetchStats();
    }
  }, [user, isSignedIn]);

  // Show loading state during authentication
  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Funciones de Colaboración</CardTitle>
              <CardDescription>
                Inicia sesión para acceder a las potentes herramientas de colaboración
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600">Colaboración en tiempo real</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Activity className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600">Seguimiento de actividad del equipo</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Eye className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600">Presencia y estado del equipo</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Settings className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600">Gestión de sesiones de colaboración</span>
                </div>
              </div>
              <div className="pt-4">
                <Link href="/sign-in" className="w-full">
                  <Button className="w-full" size="lg">
                    Iniciar Sesión
                  </Button>
                </Link>
                <p className="mt-3 text-center text-sm text-gray-500">
                  ¿No tienes una cuenta?{" "}
                  <Link href="/sign-up" className="text-blue-600 hover:underline">
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/collaboration/sessions");
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load collaboration sessions");
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/collaboration/events?action=metrics");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await fetch("/api/collaboration/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "general",
          title: `Collaboration Session - ${new Date().toLocaleString()}`,
          metadata: {
            createdFrom: "dashboard",
          },
        }),
      });

      if (response.ok) {
        const newSession = await response.json();
        setSessions((prev) => [newSession, ...prev]);
        toast.success("New collaboration session created");
      } else {
        toast.error("Failed to create session");
      }
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create session");
    }
  };

  const joinSession = async (sessionId: string) => {
    try {
      const response = await fetch(
        `/api/collaboration/sessions/${sessionId}/join`,
        {
          method: "POST",
        },
      );

      if (response.ok) {
        toast.success("Joined collaboration session");
        // Redirect to the collaboration interface
        window.open(`/collaboration/session/${sessionId}`, "_blank");
      } else {
        toast.error("Failed to join session");
      }
    } catch (error) {
      console.error("Error joining session:", error);
      toast.error("Failed to join session");
    }
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || session.type === filterType;
    const matchesStatus =
      filterStatus === "all" || session.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      case "ended":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <CollaborationProvider>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Collaboration Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and monitor real-time collaboration sessions
            </p>
          </div>
          <Button
            onClick={createNewSession}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Session
          </Button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Sessions
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSessions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Sessions
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.activeSessions}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Participants
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalParticipants}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Duration
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(stats.averageSessionDuration)}m
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recent Activity
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recentActivity}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="presence">Team Presence</TabsTrigger>
            <TabsTrigger value="activity">Activity Feed</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search sessions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="workflow">Workflow</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={filterStatus}
                      onValueChange={setFilterStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="ended">Ended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sessions List */}
            <div className="grid gap-4">
              {filteredSessions.map((session) => (
                <Card
                  key={session.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(session.status)}`}
                        ></div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {session.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <Badge variant="outline">{session.type}</Badge>
                            <span>{session.participantCount} participants</span>
                            <span>
                              Created{" "}
                              {new Date(session.createdAt).toLocaleDateString()}
                            </span>
                            <span>
                              Last activity{" "}
                              {new Date(session.lastActivity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => joinSession(session.id)}
                          disabled={session.status === "ended"}
                        >
                          {session.status === "active" ? "Join" : "View"}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredSessions.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No sessions found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm ||
                      filterType !== "all" ||
                      filterStatus !== "all"
                        ? "Try adjusting your filters to see more sessions."
                        : "Create your first collaboration session to get started."}
                    </p>
                    {!searchTerm &&
                      filterType === "all" &&
                      filterStatus === "all" && (
                        <Button onClick={createNewSession}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Session
                        </Button>
                      )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="presence">
            <Card>
              <CardHeader>
                <CardTitle>Team Presence</CardTitle>
                <CardDescription>
                  See who's online and active in your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeamPresence layout="detailed" showActivity={true} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Feed</CardTitle>
                <CardDescription>
                  Recent collaboration activities across all sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityFeed showFilters={true} autoRefresh={true} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Collaboration Settings</CardTitle>
                <CardDescription>
                  Configure collaboration preferences and defaults
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Default Session Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="defaultType">
                          Default Session Type
                        </Label>
                        <Select defaultValue="general">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="document">Document</SelectItem>
                            <SelectItem value="workflow">Workflow</SelectItem>
                            <SelectItem value="analytics">Analytics</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="autoSave">
                          Auto-save Interval (minutes)
                        </Label>
                        <Input
                          id="autoSave"
                          type="number"
                          defaultValue="5"
                          min="1"
                          max="60"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Presence Settings
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded"
                        />
                        <span className="text-sm">Show typing indicators</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded"
                        />
                        <span className="text-sm">Show cursor positions</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded"
                        />
                        <span className="text-sm">
                          Enable presence notifications
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button>Save Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CollaborationProvider>
  );
}

export default function CollaborationDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.message);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collaboration dashboard...</p>
        </div>
      </div>
    );
  }

  try {
    return <CollaborationDashboardContent />;
  } catch (err) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error loading dashboard</h2>
          <p className="text-gray-600 mb-4">Please try refreshing the page</p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }
}