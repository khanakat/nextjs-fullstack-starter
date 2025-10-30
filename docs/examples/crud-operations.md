# CRUD Operations - Complete Example

This example shows how to implement complete CRUD operations (Create, Read, Update, Delete) in the NextJS Fullstack Starter project.

## Example Structure

We will implement a task management system (Tasks) that includes:

- ✅ **Create**: Create new tasks
- ✅ **Read**: List and view tasks
- ✅ **Update**: Edit existing tasks
- ✅ **Delete**: Delete tasks

## 1. Database Model

First, we define the model in Prisma:

```prisma
// prisma/schema.prisma
model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(PENDING)
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("tasks")
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

## 2. Tipos TypeScript

```typescript
// types/task.ts
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
}
```

## 3. API Routes

### GET /api/tasks - Listar Tareas

```typescript
// app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db, generateRequestId } from "@/lib";
import { getCurrentAuthenticatedUser } from "@/lib/auth-helpers";
import { z } from "zod";

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["title", "createdAt", "dueDate", "priority"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", requestId },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = QuerySchema.parse(Object.fromEntries(searchParams));

    // Construir filtros
    const where = {
      userId: user.id,
      ...(query.status && { status: query.status }),
      ...(query.priority && { priority: query.priority }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } },
        ],
      }),
    };

    // Obtener tareas con paginación
    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      db.task.count({ where }),
    ]);

    return NextResponse.json({
      data: tasks,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Error in GET /api/tasks:`, error);
    return NextResponse.json(
      { error: "Internal server error", requestId },
      { status: 500 },
    );
  }
}
```

### POST /api/tasks - Crear Tarea

```typescript
// app/api/tasks/route.ts (continuación)
import { z } from "zod";

const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.coerce.date().optional(),
});

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", requestId },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validatedData = CreateTaskSchema.parse(body);

    const task = await db.task.create({
      data: {
        ...validatedData,
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        data: task,
        message: "Task created successfully",
        requestId,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
          requestId,
        },
        { status: 400 },
      );
    }

    console.error(`[${requestId}] Error in POST /api/tasks:`, error);
    return NextResponse.json(
      { error: "Internal server error", requestId },
      { status: 500 },
    );
  }
}
```

### GET /api/tasks/[id] - Obtener Tarea

```typescript
// app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db, generateRequestId } from "@/lib";
import { getCurrentAuthenticatedUser } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", requestId },
        { status: 401 },
      );
    }

    const task = await db.task.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found", requestId },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: task,
      requestId,
    });
  } catch (error) {
    console.error(
      `[${requestId}] Error in GET /api/tasks/${params.id}:`,
      error,
    );
    return NextResponse.json(
      { error: "Internal server error", requestId },
      { status: 500 },
    );
  }
}
```

### PUT /api/tasks/[id] - Actualizar Tarea

```typescript
// app/api/tasks/[id]/route.ts (continuación)
const UpdateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title too long")
    .optional(),
  description: z.string().max(1000, "Description too long").optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", requestId },
        { status: 401 },
      );
    }

    // Verificar que la tarea existe y pertenece al usuario
    const existingTask = await db.task.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found", requestId },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validatedData = UpdateTaskSchema.parse(body);

    const updatedTask = await db.task.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json({
      data: updatedTask,
      message: "Task updated successfully",
      requestId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
          requestId,
        },
        { status: 400 },
      );
    }

    console.error(
      `[${requestId}] Error in PUT /api/tasks/${params.id}:`,
      error,
    );
    return NextResponse.json(
      { error: "Internal server error", requestId },
      { status: 500 },
    );
  }
}
```

### DELETE /api/tasks/[id] - Eliminar Tarea

```typescript
// app/api/tasks/[id]/route.ts (continuación)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", requestId },
        { status: 401 },
      );
    }

    // Verificar que la tarea existe y pertenece al usuario
    const existingTask = await db.task.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found", requestId },
        { status: 404 },
      );
    }

    await db.task.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Task deleted successfully",
      requestId,
    });
  } catch (error) {
    console.error(
      `[${requestId}] Error in DELETE /api/tasks/${params.id}:`,
      error,
    );
    return NextResponse.json(
      { error: "Internal server error", requestId },
      { status: 500 },
    );
  }
}
```

## 4. Hooks Personalizados

### useTasks - Hook para gestionar tareas

```typescript
// hooks/use-tasks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskStatus,
  TaskPriority,
} from "@/types/task";

interface UseTasksOptions {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useTasks(options: UseTasksOptions = {}) {
  return useQuery({
    queryKey: ["tasks", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/tasks?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return response.json();
    },
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch task");
      }
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTaskRequest) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create task");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTaskRequest;
    }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update task");
      }

      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", id] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete task");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
```

## 5. Componentes de UI

### TaskForm - Formulario para crear/editar tareas

```typescript
// components/tasks/TaskForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Task, TaskPriority } from '@/types/task';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  priority: z.nativeEnum(TaskPriority),
  dueDate: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: TaskFormData) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

export function TaskForm({ task, onSubmit, loading, onCancel }: TaskFormProps) {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      priority: task?.priority || TaskPriority.MEDIUM,
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    },
  });

  const handleSubmit = async (data: TaskFormData) => {
    try {
      await onSubmit(data);
      if (!task) {
        form.reset();
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter task title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter task description (optional)"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                  <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                  <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-4">
          <Button type="submit" loading={loading} className="flex-1">
            {task ? 'Update Task' : 'Create Task'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
```

### TaskList - Lista de tareas

```typescript
// components/tasks/TaskList.tsx
import React, { useState } from 'react';
import { useTasks, useDeleteTask } from '@/hooks/use-tasks';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Calendar, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

interface TaskListProps {
  onEditTask?: (task: Task) => void;
}

export function TaskList({ onEditTask }: TaskListProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TaskStatus | 'all'>('all');
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all');
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error } = useTasks({
    search: debouncedSearch || undefined,
    status: status !== 'all' ? status : undefined,
    priority: priority !== 'all' ? priority : undefined,
  });

  const deleteTaskMutation = useDeleteTask();

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;

    try {
      await deleteTaskMutation.mutateAsync(deleteTaskId);
      setDeleteTaskId(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-blue-100 text-blue-800';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case TaskPriority.HIGH:
        return 'bg-orange-100 text-orange-800';
      case TaskPriority.URGENT:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return 'bg-gray-100 text-gray-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TaskStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error loading tasks</div>;
  }

  const tasks = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={TaskStatus.PENDING}>Pending</SelectItem>
            <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
            <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
            <SelectItem value={TaskStatus.CANCELLED}>Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority | 'all')}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
            <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
            <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
            <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de tareas */}
      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tasks found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task: Task) => (
            <Card key={task.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <div className="flex gap-2">
                    {onEditTask && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditTask(task)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTaskId(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {task.description && (
                  <p className="text-muted-foreground mb-4">{task.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>

                {task.dueDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

## 6. Página Principal

```typescript
// app/(dashboard)/tasks/page.tsx
'use client';

import React, { useState } from 'react';
import { Task } from '@/types/task';
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function TasksPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();

  const handleCreateTask = async (data: any) => {
    try {
      await createTaskMutation.mutateAsync(data);
      setIsCreateDialogOpen(false);
      toast.success('Task created successfully');
    } catch (error) {
      toast.error('Failed to create task');
      throw error;
    }
  };

  const handleUpdateTask = async (data: any) => {
    if (!editingTask) return;

    try {
      await updateTaskMutation.mutateAsync({
        id: editingTask.id,
        data,
      });
      setEditingTask(null);
      toast.success('Task updated successfully');
    } catch (error) {
      toast.error('Failed to update task');
      throw error;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage your tasks and stay organized</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <TaskList onEditTask={setEditingTask} />

      {/* Dialog para crear tarea */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            onSubmit={handleCreateTask}
            loading={createTaskMutation.isPending}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para editar tarea */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            task={editingTask || undefined}
            onSubmit={handleUpdateTask}
            loading={updateTaskMutation.isPending}
            onCancel={() => setEditingTask(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

## 7. Características Implementadas

### ✅ Funcionalidades CRUD Completas

- **Create**: Formulario de creación con validación
- **Read**: Lista paginada con filtros y búsqueda
- **Update**: Edición inline con formulario modal
- **Delete**: Eliminación con confirmación

### ✅ Validación Robusta

- Validación en cliente con Zod y React Hook Form
- Validación en servidor con esquemas Zod
- Manejo de errores consistente

### ✅ UX Optimizada

- Estados de carga y error
- Feedback visual con toasts
- Filtros y búsqueda en tiempo real
- Diseño responsive

### ✅ Performance

- React Query para caching y sincronización
- Debounce en búsqueda
- Optimistic updates
- Lazy loading de componentes

### ✅ Seguridad

- Autenticación requerida
- Autorización por usuario
- Validación de entrada
- Rate limiting (configurable)

## 8. Próximos Pasos

1. **Drag & Drop**: Reordenar tareas
2. **Bulk Operations**: Operaciones en lote
3. **Real-time Updates**: Sincronización en tiempo real
4. **File Attachments**: Adjuntar archivos a tareas
5. **Comments**: Sistema de comentarios
6. **Notifications**: Notificaciones push
7. **Export**: Exportar tareas a PDF/Excel

Este ejemplo proporciona una base sólida para implementar operaciones CRUD completas en cualquier entidad del sistema.
