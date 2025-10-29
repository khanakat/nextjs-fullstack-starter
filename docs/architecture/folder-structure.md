# 📁 Folder Structure

Understanding the **Next.js Fullstack Starter** project organization for efficient development.

## 🏗️ Project Overview

```
nextjs-fullstack-starter/
├── 📁 app/                    # Next.js 14 App Router (main application)
├── 📁 components/             # Reusable UI components
├── 📁 docs/                   # Documentation (you're here!)
├── 📁 hooks/                  # Custom React hooks
├── 📁 lib/                    # Utility libraries and configurations
├── 📁 prisma/                 # Database schema and seeds
├── 📁 public/                 # Static assets
├── 📁 scripts/                # Development and deployment scripts
├── 📁 store/                  # State management (Zustand)
├── 📁 types/                  # TypeScript type definitions
└── 📁 docker/                 # Docker configuration
```

---

## 📱 App Directory (`/app`)

**Next.js 14 App Router** - The heart of your application.

### **Structure**

```
app/
├── 🔐 (auth)/                 # Authentication routes (route group)
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   │       └── page.tsx       # Sign in page (Clerk)
│   ├── sign-up/
│   │   └── [[...sign-up]]/
│   │       └── page.tsx       # Sign up page (Clerk)
│   └── layout.tsx             # Auth layout (centered, minimal)
│
├── 🏠 (dashboard)/            # Protected routes (route group)
│   ├── dashboard/
│   │   ├── page.tsx           # Main dashboard
│   │   ├── loading.tsx        # Loading UI
│   │   └── error.tsx          # Error UI
│   ├── posts/
│   │   ├── page.tsx           # Posts list
│   │   ├── new/
│   │   │   └── page.tsx       # Create post
│   │   └── [id]/
│   │       ├── page.tsx       # View post
│   │       └── edit/
│   │           └── page.tsx   # Edit post
│   ├── profile/
│   │   └── page.tsx           # User profile
│   └── layout.tsx             # Dashboard layout (sidebar, nav)
│
├── 🌐 api/                    # API routes (backend)
│   ├── auth/                  # Authentication endpoints
│   ├── posts/                 # Posts CRUD
│   ├── users/                 # User management
│   └── webhook/               # External webhooks
│
├── 🏠 page.tsx                # Homepage (landing page)
├── 🎨 layout.tsx              # Root layout (providers, metadata)
├── 🌍 globals.css             # Global styles
├── ❌ not-found.tsx           # 404 page
├── 🔄 loading.tsx             # Global loading UI
└── 💥 error.tsx               # Global error UI
```

### **Route Groups Explained**

**`(auth)` - Authentication Routes**

- **Purpose**: Login/signup pages
- **Layout**: Centered, minimal design
- **Protection**: Public routes
- **Features**: Clerk authentication components

**`(dashboard)` - Protected Routes**

- **Purpose**: User-only content
- **Layout**: Sidebar navigation, header
- **Protection**: Requires authentication
- **Features**: CRUD operations, user data

---

## 🧩 Components Directory (`/components`)

**Reusable UI components** organized by purpose and shadcn/ui structure.

### **Structure**

```
components/
├── 🎨 ui/                     # shadcn/ui base components
│   ├── button.tsx             # Button variants
│   ├── card.tsx               # Card layouts
│   ├── dialog.tsx             # Modals and dialogs
│   ├── form.tsx               # Form components
│   ├── input.tsx              # Input fields
│   ├── table.tsx              # Data tables
│   ├── toast.tsx              # Notifications
│   └── ...                    # More shadcn/ui components
│
├── 🔧 layout/                 # Layout components
│   ├── header.tsx             # App header/navbar
│   ├── sidebar.tsx            # Navigation sidebar
│   ├── footer.tsx             # App footer
│   └── navigation.tsx         # Navigation menus
│
├── 📝 forms/                  # Form components
│   ├── post-form.tsx          # Create/edit post
│   ├── profile-form.tsx       # User profile
│   └── search-form.tsx        # Search functionality
│
├── 📊 data/                   # Data display components
│   ├── posts-table.tsx        # Posts data table
│   ├── user-list.tsx          # User listings
│   └── stats-cards.tsx        # Dashboard statistics
│
├── 🎯 features/               # Feature-specific components
│   ├── auth/                  # Authentication components
│   ├── posts/                 # Post-related components
│   └── dashboard/             # Dashboard components
│
└── 🔄 providers/              # Context providers
    ├── theme-provider.tsx     # Theme context
    ├── query-provider.tsx     # React Query
    └── toast-provider.tsx     # Toast notifications
```

### **Component Organization Rules**

1. **`/ui`** - Pure UI components from shadcn/ui
2. **`/layout`** - Layout and navigation components
3. **`/forms`** - Form-specific components
4. **`/data`** - Data display and tables
5. **`/features`** - Business logic components
6. **`/providers`** - Context and state providers

---

## 🎣 Hooks Directory (`/hooks`)

**Custom React hooks** for reusable logic.

### **Structure**

```
hooks/
├── 🔐 use-auth.ts             # Authentication helpers
├── 💾 use-posts.ts            # Posts data fetching
├── 🌓 use-theme.ts            # Theme management
├── 📱 use-mobile.ts           # Responsive breakpoints
├── 🔄 use-debounce.ts         # Input debouncing
├── 📋 use-clipboard.ts        # Clipboard operations
└── 🔔 use-toast.ts            # Toast notifications
```

### **Hook Examples**

**Data Fetching Hook:**

```typescript
// hooks/use-posts.ts
export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });
}
```

**Responsive Hook:**

```typescript
// hooks/use-mobile.ts
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  // ... responsive logic
  return isMobile;
}
```

---

## 📚 Lib Directory (`/lib`)

**Utility functions and configurations** - the toolkit of your app.

### **Structure**

```
lib/
├── 🗄️ prisma.ts              # Database client
├── 🔧 utils.ts               # Utility functions (cn, etc.)
├── ✅ validations.ts         # Zod schemas
├── 📧 email.ts               # Email utilities
├── 🔐 auth.ts                # Auth helpers
├── 📊 analytics.ts           # Analytics integration
├── 🎨 constants.ts           # App constants
└── 🌍 config.ts              # App configuration
```

### **Key Files**

**Database Client (`prisma.ts`):**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Utilities (`utils.ts`):**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US").format(date);
}
```

---

## 🗄️ Prisma Directory (`/prisma`)

**Database schema and seeding** - your data layer.

### **Structure**

```
prisma/
├── 📋 schema.prisma           # Database schema
├── 🌱 seed.ts                # Database seeding
└── 📁 migrations/             # Database migrations
    ├── 20231014_init/
    ├── 20231015_add_posts/
    └── migration_lock.toml
```

### **Schema Organization**

```prisma
// prisma/schema.prisma

// Generator and datasource
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Core models
model User { ... }
model Post { ... }

// Feature models
model Category { ... }
model Tag { ... }

// Junction tables
model PostTag { ... }
```

---

## 🎯 Store Directory (`/store`)

**State management with Zustand** - client-side state.

### **Structure**

```
store/
├── 🔐 auth-store.ts           # Authentication state
├── 🌓 theme-store.ts          # Theme preferences
├── 📝 post-store.ts           # Posts state
└── 🔔 notification-store.ts   # Notifications
```

### **Store Pattern**

```typescript
// store/auth-store.ts
import { create } from "zustand";

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
```

---

## 📁 Types Directory (`/types`)

**TypeScript type definitions** - type safety across the app.

### **Structure**

```
types/
├── 🔐 auth.ts                 # Authentication types
├── 📝 post.ts                 # Post-related types
├── 💾 database.ts             # Database types
├── 🌐 api.ts                  # API response types
└── 🎨 ui.ts                   # UI component types
```

### **Type Organization**

```typescript
// types/post.ts
export interface Post {
  id: string;
  title: string;
  content: string;
  published: boolean;
  author: User;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePostInput = Omit<
  Post,
  "id" | "createdAt" | "updatedAt" | "author"
>;
export type UpdatePostInput = Partial<CreatePostInput>;
```

---

## 🚀 Scripts Directory (`/scripts`)

**Development and deployment scripts** - automation tools.

### **Structure**

```
scripts/
├── 🗄️ db/                    # Database scripts
│   ├── postgres-docker.bat   # PostgreSQL Docker setup
│   ├── postgres-local.bat    # Local PostgreSQL setup
│   └── sqlite.bat            # SQLite setup
├── 🚀 deploy/                 # Deployment scripts
└── 🔧 setup/                  # Initial setup scripts
```

---

## 🌍 Public Directory (`/public`)

**Static assets** - images, icons, and files.

### **Structure**

```
public/
├── 🎨 images/                 # App images
├── 🔮 icons/                  # Custom icons
├── 📄 favicon.ico             # Browser icon
├── 🍎 apple-touch-icon.png    # iOS icon
└── 📱 manifest.json           # PWA manifest
```

---

## 📖 Docs Directory (`/docs`)

**Documentation structure** - guides and references.

### **Structure**

```
docs/
├── 📚 getting-started/        # Setup guides
├── 📖 guides/                 # Feature guides
├── 🎯 examples/               # Code examples
├── 🏗️ architecture/           # Architecture docs
├── 🔧 api-reference/          # API documentation
└── 📁 archive/                # Old documentation
```

---

## 🐳 Docker Directory (`/docker`)

**Containerization files** - deployment configuration.

### **Structure**

```
docker/
├── 🐘 postgres/               # PostgreSQL Docker setup
│   ├── Dockerfile
│   └── init.sql
├── 🐳 Dockerfile              # App container
└── 📋 docker-compose.yml      # Multi-container setup
```

---

## 📋 Configuration Files

**Root-level configuration** - project settings.

```
├── 📦 package.json             # Dependencies and scripts
├── ⚙️ next.config.js           # Next.js configuration
├── 🎨 tailwind.config.ts       # TailwindCSS setup
├── 📝 tsconfig.json            # TypeScript config
├── 🔧 .eslintrc.json           # ESLint rules
├── 🌍 .env.example             # Environment template
├── 🚫 .gitignore               # Git ignore rules
└── 📄 README.md                # Project documentation
```

---

## 🎯 Navigation Best Practices

### **File Naming Conventions**

| Pattern      | Use Case                | Example            |
| ------------ | ----------------------- | ------------------ |
| `kebab-case` | File and folder names   | `user-profile.tsx` |
| `PascalCase` | Components              | `UserProfile.tsx`  |
| `camelCase`  | Functions and variables | `getUserProfile()` |
| `UPPER_CASE` | Constants               | `API_BASE_URL`     |

### **Import Organization**

```typescript
// 1. External libraries
import React from "react";
import { NextRequest } from "next/server";

// 2. Internal utilities
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

// 3. Components
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";

// 4. Types
import type { User } from "@/types/auth";

// 5. Relative imports
import "./styles.css";
```

---

## 🔍 Finding Files

### **Common File Locations**

| Looking for...      | Check...                           |
| ------------------- | ---------------------------------- |
| **Pages**           | `/app/**/page.tsx`                 |
| **API Routes**      | `/app/api/**/route.ts`             |
| **Components**      | `/components/`                     |
| **Database Models** | `/prisma/schema.prisma`            |
| **Types**           | `/types/`                          |
| **Styles**          | `/app/globals.css`, `/components/` |
| **Configuration**   | Root directory                     |
| **Scripts**         | `/scripts/`                        |

### **Search Tips**

```bash
# Find all pages
find app -name "page.tsx"

# Find components
find components -name "*.tsx" | head -10

# Search for specific text
grep -r "useAuth" --include="*.tsx" --include="*.ts"
```

---

## 📚 Next Steps

Now that you understand the structure:

1. **[Quick Start](../getting-started/quick-start.md)** - Get the app running
2. **[Architecture Overview](./overview.md)** - Understand the big picture
3. **[Customization Guide](../guides/customization.md)** - Make it your own
4. **[Database Guide](../guides/database.md)** - Work with data

---

**🗂️ Happy organizing!** A well-structured project is a joy to work with.
