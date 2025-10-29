"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  addDays,
} from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  MoreHorizontal,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Play,
  XCircle,
  Eye,
  FileText,
} from "lucide-react";

import {
  WorkflowTask,
  WorkflowTaskStatus,
  WorkflowPriority,
} from "@/lib/types/workflows";

// ============================================================================
// TASK ITEM COMPONENT
// ============================================================================

interface TaskItemProps {
  task: WorkflowTask;
  onComplete: (task: WorkflowTask, comment?: string) => void;
  onReject: (task: WorkflowTask, comment?: string) => void;
  onView: (task: WorkflowTask) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onComplete,
  onReject,
  onView,
}) => {
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comment, setComment] = useState("");

  const getPriorityColor = (priority: WorkflowPriority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "normal":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: WorkflowTaskStatus) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const isOverdue = task.dueDate && isAfter(new Date(), new Date(task.dueDate));
  const isDueSoon =
    task.dueDate &&
    isBefore(new Date(), new Date(task.dueDate)) &&
    isAfter(new Date(task.dueDate), addDays(new Date(), -1));

  const handleComplete = () => {
    onComplete(task, comment);
    setComment("");
    setShowCompleteDialog(false);
  };

  const handleReject = () => {
    onReject(task, comment);
    setComment("");
    setShowRejectDialog(false);
  };

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${
        isOverdue
          ? "border-red-300 bg-red-50"
          : isDueSoon
            ? "border-yellow-300 bg-yellow-50"
            : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg font-semibold">
                {task.name}
              </CardTitle>
              <Badge className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
              <Badge className={getStatusColor(task.status)}>
                {task.status.replace("_", " ")}
              </Badge>
            </div>
            <CardDescription>
              {task.description || "No description provided"}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(task)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {task.status === "pending" && (
                <>
                  <DropdownMenuItem onClick={() => setShowCompleteDialog(true)}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowRejectDialog(true)}
                    className="text-red-600"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Task Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>Assigned to you</span>
            </div>
            {task.dueDate && (
              <div
                className={`flex items-center gap-1 ${
                  isOverdue
                    ? "text-red-600"
                    : isDueSoon
                      ? "text-yellow-600"
                      : ""
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>
                  Due{" "}
                  {formatDistanceToNow(new Date(task.dueDate), {
                    addSuffix: true,
                  })}
                </span>
                {isOverdue && <AlertTriangle className="w-4 h-4 ml-1" />}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>
                Created {format(new Date(task.createdAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>

          {/* Workflow Info */}
          <div className="text-sm">
            <span className="text-muted-foreground">Workflow: </span>
            <span className="font-medium">
              Workflow Instance {task.instanceId}
            </span>
          </div>

          {/* Actions */}
          {task.status === "pending" && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => setShowCompleteDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
              <Button size="sm" variant="outline" onClick={() => onView(task)}>
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              Mark this task as completed. You can optionally add a comment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Comment (Optional)</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add any notes or comments about completing this task..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700"
            >
              Complete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Task</DialogTitle>
            <DialogDescription>
              Reject this task and provide a reason for rejection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Please provide a reason for rejecting this task..."
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!comment.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// ============================================================================
// TASK DASHBOARD COMPONENT
// ============================================================================

interface TaskDashboardProps {
  userId?: string;
}

export const TaskDashboard: React.FC<TaskDashboardProps> = ({ userId }) => {
  const router = useRouter();
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter] = useState<WorkflowTaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<
    WorkflowPriority | "all"
  >("all");
  const [sortBy, setSortBy] = useState<"dueDate" | "createdAt" | "priority">(
    "dueDate",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeTab, setActiveTab] = useState("pending");

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (priorityFilter !== "all") {
        params.append("priority", priorityFilter);
      }
      if (userId) {
        params.append("assigneeId", userId);
      }
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const response = await fetch(`/api/workflows/tasks?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, sortBy, sortOrder, userId]);

  // Fetch tasks
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCompleteTask = async (task: WorkflowTask, comment?: string) => {
    try {
      const response = await fetch(`/api/workflows/tasks/${task.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "complete",
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete task");
      }

      toast.success("Task completed successfully");
      fetchTasks();
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error("Failed to complete task");
    }
  };

  const handleRejectTask = async (task: WorkflowTask, comment?: string) => {
    try {
      const response = await fetch(`/api/workflows/tasks/${task.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reject",
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject task");
      }

      toast.success("Task rejected");
      fetchTasks();
    } catch (error) {
      console.error("Error rejecting task:", error);
      toast.error("Failed to reject task");
    }
  };

  const handleViewTask = (task: WorkflowTask) => {
    router.push(`/workflows/tasks/${task.id}`);
  };

  // Filter tasks based on search term and active tab
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false);

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && task.status === "pending") ||
      (activeTab === "in_progress" && task.status === "in_progress") ||
      (activeTab === "completed" && task.status === "completed") ||
      (activeTab === "overdue" &&
        task.dueDate &&
        isAfter(new Date(), new Date(task.dueDate)) &&
        task.status === "pending");

    return matchesSearch && matchesTab;
  });

  // Calculate stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    overdue: tasks.filter(
      (t) =>
        t.dueDate &&
        isAfter(new Date(), new Date(t.dueDate)) &&
        t.status === "pending",
    ).length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
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
          <h1 className="text-3xl font-bold">Task Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your workflow tasks and assignments
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.pending}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.inProgress}
                </p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
              <Play className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completed}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {stats.overdue}
                </p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={priorityFilter}
          onValueChange={(value: WorkflowPriority | "all") =>
            setPriorityFilter(value)
          }
        >
          <SelectTrigger className="w-32">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(value: "dueDate" | "createdAt" | "priority") =>
            setSortBy(value)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dueDate">Due Date</SelectItem>
            <SelectItem value="createdAt">Created Date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          {sortOrder === "asc" ? (
            <SortAsc className="w-4 h-4" />
          ) : (
            <SortDesc className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Task Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({stats.inProgress})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({stats.completed})
          </TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({stats.overdue})</TabsTrigger>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredTasks.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground">
                {searchTerm || priorityFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : `No ${activeTab === "all" ? "" : activeTab} tasks at the moment`}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleCompleteTask}
                  onReject={handleRejectTask}
                  onView={handleViewTask}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer Stats */}
      {filteredTasks.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
          <span>
            Showing {filteredTasks.length} of {tasks.length} tasks
          </span>
          <div className="flex items-center gap-4">
            <span>
              Completion Rate:{" "}
              {Math.round((stats.completed / stats.total) * 100)}%
            </span>
            <Progress
              value={(stats.completed / stats.total) * 100}
              className="w-24 h-2"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDashboard;
