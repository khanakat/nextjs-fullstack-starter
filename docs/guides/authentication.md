# 🔐 Authentication Guide

Complete guide to authentication in **Next.js Fullstack Starter** using Clerk.

## 🎯 Overview

This template uses **Clerk** for authentication, providing:

- 🔒 **Secure authentication** with multiple sign-in options
- 👥 **User management** with profiles and metadata
- 🛡️ **Protected routes** and API endpoints
- 📧 **Email verification** and password reset
- 🌐 **Social login** (Google, GitHub, etc.)
- 📱 **Multi-device** support

---

## 🚀 Quick Setup

### **1. Get Clerk Credentials**

1. **Create Account**: Visit [https://clerk.com](https://clerk.com)
2. **New Application**: Click "Add Application"
3. **Choose Provider**: Select authentication methods
4. **Copy Keys**: Get your API keys from the dashboard

### **2. Configure Environment**

Add to your `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### **3. Test Authentication**

```bash
npm run dev
```

Visit [http://localhost:3000/sign-up](http://localhost:3000/sign-up) to test!

---

## 🏗️ How It Works

### **File Structure**

```
app/
├── (auth)/           # Authentication routes (grouped)
│   ├── sign-in/     # Sign in page
│   ├── sign-up/     # Sign up page
│   └── layout.tsx   # Auth layout
├── (dashboard)/     # Protected routes (grouped)
│   ├── dashboard/   # User dashboard
│   └── layout.tsx   # Protected layout
├── layout.tsx       # Root layout with ClerkProvider
└── middleware.ts    # Route protection
```

### **Key Components**

**Root Layout (`app/layout.tsx`)**

```tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

**Middleware (`middleware.ts`)**

```tsx
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/about", "/contact"],
  ignoredRoutes: ["/api/webhook"],
});
```

---

## 🔧 Configuration Options

### **Authentication Methods**

Enable in your Clerk Dashboard:

| Method        | Description        | Setup Required |
| ------------- | ------------------ | -------------- |
| **Email**     | Email + password   | ✅ Built-in    |
| **Phone**     | SMS verification   | ✅ Built-in    |
| **Google**    | OAuth with Google  | 🔧 OAuth setup |
| **GitHub**    | OAuth with GitHub  | 🔧 OAuth setup |
| **Apple**     | Sign in with Apple | 🔧 OAuth setup |
| **Microsoft** | Microsoft accounts | 🔧 OAuth setup |

### **Social OAuth Setup**

**Google OAuth:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/select project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add to Clerk Dashboard

**GitHub OAuth:**

1. Go to GitHub Settings > Developer Settings
2. Create new OAuth App
3. Set Authorization callback URL: `https://clerk.yourapp.com/v1/oauth_callback`
4. Add credentials to Clerk

### **Custom Redirect URLs**

```env
# After sign in/up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Custom auth pages (optional)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/register
```

---

## 👥 User Management

### **User Data Access**

**Client Side:**

```tsx
import { useUser } from "@clerk/nextjs";

function Profile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome {user?.firstName}!</h1>
      <p>Email: {user?.emailAddresses[0]?.emailAddress}</p>
    </div>
  );
}
```

**Server Side:**

```tsx
import { currentUser } from "@clerk/nextjs";

export default async function ServerProfile() {
  const user = await currentUser();

  return (
    <div>
      <h1>Server: {user?.firstName}</h1>
    </div>
  );
}
```

### **User Metadata**

**Public Metadata** (visible to all):

```tsx
await clerkClient.users.updateUser(userId, {
  publicMetadata: { plan: "pro", credits: 100 },
});
```

**Private Metadata** (admin only):

```tsx
await clerkClient.users.updateUser(userId, {
  privateMetadata: { internalNotes: "VIP customer" },
});
```

**Unsafe Metadata** (user controlled):

```tsx
await user.update({
  unsafeMetadata: { preferences: { theme: "dark" } },
});
```

---

## 🛡️ Protecting Routes

### **Middleware Protection**

Edit `middleware.ts`:

```tsx
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Public routes (no auth required)
  publicRoutes: ["/", "/about", "/pricing"],

  // Ignored routes (skip middleware)
  ignoredRoutes: ["/api/webhook"],

  // Debug mode
  debug: process.env.NODE_ENV === "development",
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### **Component-Level Protection**

**Protect entire pages:**

```tsx
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <div>Protected content</div>;
}
```

**Conditional rendering:**

```tsx
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

function Navigation() {
  return (
    <nav>
      <SignedOut>
        <SignInButton />
      </SignedOut>

      <SignedIn>
        <UserButton />
      </SignedIn>
    </nav>
  );
}
```

---

## 🔗 API Route Protection

### **Protect API Endpoints**

```tsx
// app/api/protected/route.ts
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Protected API logic here
  return NextResponse.json({ data: "Secret data" });
}
```

### **Role-Based Access**

```tsx
// Check user role in API
import { clerkClient } from "@clerk/nextjs";

export async function POST(request: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await clerkClient.users.getUser(userId);
  const userRole = user.publicMetadata.role;

  if (userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Admin-only logic
}
```

---

## 🎨 Customization

### **Theme Customization**

```tsx
// app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: "dark", // or 'light'
        variables: {
          colorPrimary: "#0F172A",
          colorText: "#FFFFFF",
        },
        elements: {
          formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
          card: "shadow-lg",
        },
      }}
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### **Custom Sign-In Components**

```tsx
import { SignIn } from "@clerk/nextjs";

export default function CustomSignInPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "shadow-2xl border-0",
          },
        }}
        redirectUrl="/dashboard"
      />
    </div>
  );
}
```

---

## 📧 Email Configuration

### **Email Templates**

1. **Go to Clerk Dashboard**
2. **Navigate to**: Messaging > Email Templates
3. **Customize**: Welcome email, verification, password reset

### **Custom Email Provider**

```tsx
// For production, use custom SMTP
// Configure in Clerk Dashboard > Messaging > Email
```

---

## 🚀 Production Deployment

### **Environment Variables**

```env
# Production keys (different from development)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Production URLs
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=https://yourdomain.com/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=https://yourdomain.com/onboarding
```

### **Domain Configuration**

1. **Add Domain**: In Clerk Dashboard > Domains
2. **Set Up DNS**: Add CNAME record
3. **SSL Certificate**: Automatic with Clerk
4. **Update URLs**: Use custom domain in redirects

---

## 🧪 Testing

### **Test Authentication Flow**

```bash
# Start development server
npm run dev

# Test these URLs:
# http://localhost:3000/sign-up
# http://localhost:3000/sign-in
# http://localhost:3000/dashboard (should redirect if not logged in)
```

### **Test API Protection**

```bash
# Test protected API without auth (should fail)
curl http://localhost:3000/api/protected

# Test with auth header
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/protected
```

---

## 🆘 Troubleshooting

### **Common Issues**

**"Invalid publishable key"**

- Check key format: Should start with `pk_test_` or `pk_live_`
- Ensure no extra spaces in `.env.local`
- Restart development server

**"User is not defined"**

- Wrap component in `<ClerkProvider>`
- Check if `useUser()` is called inside Clerk context
- Verify middleware configuration

**Redirects not working**

- Check `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` format
- Ensure URLs are absolute in production
- Verify middleware `publicRoutes` configuration

### **Debug Mode**

```env
# Add to .env.local for debugging
CLERK_DEBUG=true
```

---

## 📚 Additional Resources

- **[Clerk Documentation](https://clerk.com/docs)** - Official documentation
- **[Clerk Next.js Guide](https://clerk.com/docs/quickstarts/nextjs)** - Next.js specific guide
- **[Authentication Best Practices](https://clerk.com/blog)** - Security tips
- **[Deployment Guide](../guides/deployment.md)** - Production deployment
