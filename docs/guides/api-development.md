# API Development Guide

This guide provides best practices and patterns for developing APIs in the NextJS Fullstack Starter project.

## API Structure

### Route Organization

```
app/api/
├── auth/                 # Authentication
├── users/               # User management
├── organizations/       # Organizations
├── workflows/          # Workflows
├── analytics/          # Analytics and metrics
├── reports/            # Reports system
├── integrations/       # External integrations
├── notifications/      # Notifications
└── mobile/            # Mobile-specific APIs
```

### Naming Conventions

- **Routes**: Use kebab-case (`/api/user-profiles`)
- **Files**: Use `route.ts` for endpoints
- **Parameters**: Use brackets `[id]` for dynamic routes

## Implementation Patterns

### 1. Estructura Básica de Route Handler

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db, generateRequestId } from "@/lib";
import { getCurrentAuthenticatedUser } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    // 1. Autenticación
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", requestId },
        { status: 401 },
      );
    }

    // 2. Validación de parámetros
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // 3. Lógica de negocio
    const data = await db.model.findMany({
      where: { userId: user.id },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 4. Respuesta exitosa
    return NextResponse.json({
      data,
      pagination: { page, limit, total: data.length },
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Error in GET /api/endpoint:`, error);
    return NextResponse.json(
      {
        error: "Internal server error",
        requestId,
      },
      { status: 500 },
    );
  }
}
```

### 2. Validación de Datos con Zod

```typescript
import { z } from "zod";

const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  role: z.enum(["USER", "ADMIN", "MODERATOR"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos de entrada
    const validatedData = CreateUserSchema.parse(body);

    // Procesar datos validados
    const user = await db.user.create({
      data: validatedData,
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    throw error;
  }
}
```

### 3. Manejo de Errores Consistente

```typescript
import { ApiError } from "@/lib/api-utils";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      throw new ApiError("Unauthorized", 401, "AUTH_REQUIRED");
    }

    const resource = await db.resource.findUnique({
      where: { id: params.id },
    });

    if (!resource) {
      throw new ApiError("Resource not found", 404, "RESOURCE_NOT_FOUND");
    }

    if (resource.userId !== user.id) {
      throw new ApiError("Forbidden", 403, "INSUFFICIENT_PERMISSIONS");
    }

    await db.resource.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          requestId: generateRequestId(),
        },
        { status: error.statusCode },
      );
    }

    // Error no manejado
    console.error("Unhandled error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

## Mejores Prácticas

### 1. Autenticación y Autorización

```typescript
// Verificar autenticación
const user = await getCurrentAuthenticatedUser();
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Verificar permisos específicos
if (!hasRole(user, "ADMIN")) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Verificar acceso a organización
await validateOrganizationAccess(user.id, organizationId);
```

### 2. Paginación Estándar

```typescript
interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  return {
    page: Math.max(1, parseInt(searchParams.get("page") || "1")),
    limit: Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "10")),
    ),
    sortBy: searchParams.get("sortBy") || "createdAt",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
  };
}
```

### 3. Rate Limiting

```typescript
import { rateLimit } from "@/lib/middleware/rate-limit";

export async function POST(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResult = await rateLimit(request, {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana
  });

  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Continuar con la lógica normal...
}
```

### 4. Logging y Monitoreo

```typescript
import { AuditService } from "@/lib/services";

export async function PUT(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    // Log de inicio
    console.log(`[${requestId}] PUT /api/resource started`);

    // Lógica de negocio...

    // Auditoría de cambios
    await AuditService.logAction({
      userId: user.id,
      action: "UPDATE_RESOURCE",
      resourceType: "Resource",
      resourceId: resource.id,
      metadata: { changes: updatedFields },
      requestId,
    });

    console.log(`[${requestId}] PUT /api/resource completed successfully`);
  } catch (error) {
    console.error(`[${requestId}] PUT /api/resource failed:`, error);
    throw error;
  }
}
```

## Patrones Avanzados

### 1. Middleware de Validación

```typescript
// lib/middleware/validation.ts
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return function (
    handler: (data: T, request: NextRequest) => Promise<NextResponse>,
  ) {
    return async function (request: NextRequest) {
      try {
        const body = await request.json();
        const validatedData = schema.parse(body);
        return await handler(validatedData, request);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: "Validation failed", details: error.errors },
            { status: 400 },
          );
        }
        throw error;
      }
    };
  };
}

// Uso
export const POST = withValidation(CreateUserSchema)(async (data, request) => {
  // data está tipado y validado
  const user = await db.user.create({ data });
  return NextResponse.json({ user });
});
```

### 2. Transacciones de Base de Datos

```typescript
export async function POST(request: NextRequest) {
  return await db.$transaction(async (tx) => {
    // Crear usuario
    const user = await tx.user.create({
      data: userData,
    });

    // Crear perfil asociado
    const profile = await tx.profile.create({
      data: {
        userId: user.id,
        ...profileData,
      },
    });

    // Enviar email de bienvenida
    await emailService.sendWelcomeEmail(user.email);

    return NextResponse.json({ user, profile });
  });
}
```

### 3. Caching de Respuestas

```typescript
import { cache } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const cacheKey = `api:users:${userId}:profile`;

  // Intentar obtener de cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Obtener de base de datos
  const data = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  // Guardar en cache por 5 minutos
  await cache.set(cacheKey, data, 300);

  return NextResponse.json(data);
}
```

## Testing de APIs

### 1. Tests de Integración

```typescript
// __tests__/api/users.test.ts
import { createMocks } from "node-mocks-http";
import handler from "@/app/api/users/route";

describe("/api/users", () => {
  it("should create a new user", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        name: "John Doe",
        email: "john@example.com",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.user.name).toBe("John Doe");
  });
});
```

### 2. Mocking de Dependencias

```typescript
// Mockear servicios externos
jest.mock("@/lib/services/email-service", () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/lib/db", () => ({
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
}));
```

## Documentación de APIs

### 1. Comentarios JSDoc

```typescript
/**
 * Obtiene la lista de usuarios con paginación
 *
 * @param request - Request object de Next.js
 * @returns Lista paginada de usuarios
 *
 * @example
 * GET /api/users?page=1&limit=10&sortBy=name&sortOrder=asc
 *
 * Response:
 * {
 *   "data": [...],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 10,
 *     "total": 100,
 *     "totalPages": 10
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  // Implementation...
}
```

### 2. Tipos TypeScript

```typescript
// types/api.ts
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  requestId: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role?: "USER" | "ADMIN" | "MODERATOR";
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}
```

## Recursos Adicionales

- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Zod Validation](https://zod.dev/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [API Testing Best Practices](https://blog.postman.com/api-testing-best-practices/)
