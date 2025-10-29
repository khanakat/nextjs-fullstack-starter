# Project Organization - Patterns and Conventions

## 📂 Folder Structure

### Organization Principles

This project follows the patterns established in `.references` to maintain consistency and scalability.

### Current Structure

```
d:\Projects\Typescript\fullstack-template\
├── .references/                     # Reference projects
│   ├── airbnb/
│   ├── discord/
│   ├── ecommerce-store/
│   ├── notion/
│   └── ...
├── app/                            # Next.js 14 App Router
│   ├── (auth)/                     # Group: Authentication
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/                # Group: Main Dashboard
│   │   ├── layout.tsx              # Shared layout
│   │   ├── dashboard/              # Dashboard main page
│   │   ├── analytics/              # Analytics dashboard
│   │   ├── email/                  # Email system
│   │   ├── payments/               # Payment system
│   │   ├── realtime/               # Real-time features
│   │   ├── seo/                    # SEO tools
│   │   └── upload/                 # File system
│   ├── api/                        # API Routes
│   │   ├── auth/
│   │   ├── notifications/
│   │   ├── stripe/
│   │   └── uploadthing/
│   ├── globals.css
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Main page
│   ├── robots.ts
│   └── sitemap.ts
├── components/                     # Reusable components
├── hooks/                          # Custom React hooks
├── lib/                           # Utilities and configurations
├── actions/                       # Server actions
├── store/                         # Global state (Zustand)
├── types/                         # TypeScript definitions
└── prisma/                        # Database schema
```

## 🎯 Grouping Patterns

### Route Groups `(name)`

We use route groups to organize related pages without affecting the URL:

#### `(auth)` - Authentication

- **Purpose**: Authentication pages
- **Layout**: Auth-specific layout
- **Routes**: `/sign-in`, `/sign-up`

#### `(dashboard)` - Main Dashboard

- **Purpose**: All authenticated dashboard pages
- **Layout**: Layout with navigation and notifications
- **Routes**: `/dashboard`, `/realtime`, `/upload`, etc.

### Advantages of This Organization

1. **Shared Layouts**: Each group can have its own layout
2. **Clean URLs**: Groups don't appear in URLs
3. **Separation of Concerns**: Each group handles a specific aspect
4. **Scalability**: Easy to add new groups when needed

## 📁 Naming Conventions

### Files and Folders

```
kebab-case/          # Folders
PascalCase.tsx       # React components
camelCase.ts         # Utilities and functions
page.tsx             # Next.js pages
layout.tsx           # Next.js layouts
loading.tsx          # Loading states
error.tsx            # Error pages
not-found.tsx        # 404 page
route.ts             # API routes
```

### Components

```
components/
├── ui/                           # Basic components (shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
├── forms/                        # Specific forms
│   ├── auth-form.tsx
│   └── contact-form.tsx
├── layout/                       # Layout components
│   ├── navbar.tsx
│   └── footer.tsx
└── feature-specific/             # Feature-based components
    ├── upload-demo.tsx
    ├── email-demo.tsx
    └── notification-center.tsx
```

## 🔧 Implementation Patterns

### Server Actions

```typescript
// actions/auth-actions.ts
export async function signInUser(formData: FormData) {
  "use server";
  // Server logic
}
```

### API Routes

```typescript
// app/api/notifications/route.ts
export async function GET(request: Request) {
  // Endpoint logic
}
```

### React Hooks

```typescript
// hooks/use-notifications.ts
export function useNotifications() {
  // Hook logic
}
```

### Configurations

```typescript
// lib/config.ts
export const appConfig = {
  // Centralized configurations
};
```

## 🎨 UI/UX Patterns

### Visual Consistency

- **Design System**: shadcn/ui as base
- **Themes**: Dark/light mode support
- **Responsive**: Mobile-first approach
- **Accessibility**: WAI-ARIA compliance

### Navigation

- **Navbar**: Consistent across dashboard
- **Breadcrumbs**: For deep navigation
- **Sidebar**: For complex sections

### Loading States

```tsx
// Consistent pattern for loading states
{
  loading ? <div className="animate-spin">Loading...</div> : <ActualContent />;
}
```

## 📚 References and Inspiration

### Reference Projects Used

1. **Discord Clone** - Real-time system
2. **Notion Clone** - Editor and components
3. **Airbnb Clone** - Layout and navigation
4. **E-commerce Store** - Payments and products
5. **LMS Platform** - Dashboard and analytics

### Adopted Patterns

- **Colocation**: Keep related files together
- **Feature-first**: Organize by functionality, not by file type
- **Progressive Disclosure**: Show information gradually
- **Convention over Configuration**: Clear conventions vs configuration

## 🚀 Maintenance and Scalability

### Adding New Features

1. **New Route Group**: If it's a completely new section
2. **New Page**: Within `(dashboard)` if it's part of the dashboard
3. **New Components**: In the appropriate folder by functionality
4. **New APIs**: Following the `api/` structure

### Safe Refactoring

1. **Maintain Patterns**: Follow established conventions
2. **Tests**: Ensure changes don't break existing functionality
3. **Documentation**: Update documentation with significant changes
4. **References**: Consult `.references` for inspiration

## ✅ Organization Checklist

- [x] Route groups properly organized
- [x] Shared layouts implemented
- [x] Naming conventions followed
- [x] Components organized by functionality
- [x] APIs consistently structured
- [x] Documentation updated
- [x] Reference patterns applied

This organization ensures the project is maintainable, scalable, and easy to understand for new developers joining the project.
