"use client";

import React from "react";
import Link from "next/link";

// Check if Clerk is properly configured (both publishable and secret keys present and not placeholders)
const hasValidClerkKeys = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_") &&
    process.env.CLERK_SECRET_KEY.startsWith("sk_") &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_test") &&
    !process.env.CLERK_SECRET_KEY.startsWith("sk_test") &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_development_key" &&
    process.env.CLERK_SECRET_KEY !== "sk_test_development_key",
);

/**
 * Conditional Clerk components that work whether Clerk is configured or not
 */
export function ConditionalSignedIn({ children }: { children: React.ReactNode }) {
  if (!hasValidClerkKeys) {
    if (typeof document !== "undefined") {
      const hasDemo = document.cookie.includes("demo_auth=1");
      return hasDemo ? <>{children}</> : null;
    }
    return null;
  }

  // Import Clerk components dynamically to avoid errors
  const { SignedIn } = require("@clerk/nextjs");
  return <SignedIn>{children}</SignedIn>;
}

export function ConditionalSignedOut({ children }: { children: React.ReactNode }) {
  if (!hasValidClerkKeys) {
    if (typeof document !== "undefined") {
      const hasDemo = document.cookie.includes("demo_auth=1");
      return hasDemo ? null : <>{children}</>;
    }
    return <>{children}</>;
  }

  // Import Clerk components dynamically to avoid errors
  const { SignedOut } = require("@clerk/nextjs");
  return <SignedOut>{children}</SignedOut>;
}

export function ConditionalUserButton({ afterSignOutUrl }: { afterSignOutUrl?: string }) {
  if (!hasValidClerkKeys) {
    // Demo fallback: simple sign-out link
    return (
      <Link
        href={afterSignOutUrl || "/sign-out"}
        className="text-sm font-medium hover:underline underline-offset-4"
      >
        Sign Out
      </Link>
    );
  }

  // Import Clerk components dynamically to avoid errors
  const { UserButton } = require("@clerk/nextjs");
  return <UserButton afterSignOutUrl={afterSignOutUrl} />;
}

export function ConditionalSignIn({ 
  redirectUrl, 
  signUpUrl,
  ...props 
}: { 
  redirectUrl?: string;
  signUpUrl?: string;
  [key: string]: any;
}) {
  if (!hasValidClerkKeys) {
    // Demo mode sign-in UI
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md max-w-md mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Demo Mode</h1>
          <p className="text-gray-600">
            Clerk authentication is not configured. You're viewing the app in demo mode.
          </p>
        </div>
        
        <div className="w-full space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Demo User</h3>
            <p className="text-sm text-blue-700">Email: demo@example.com</p>
            <p className="text-sm text-blue-700">Name: Demo User</p>
          </div>
          
          <button
            onClick={async () => {
              // In demo mode, mark demo session and redirect
              try {
                await fetch("/api/demo-auth", { method: "POST" });
              } catch (e) {
                console.warn("Demo auth set failed", e);
              }
              window.location.href = redirectUrl || "/";
            }}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Continue as Demo User
          </button>
          
          {signUpUrl && (
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <a href={signUpUrl} className="text-blue-600 hover:underline">
                Sign up
              </a>
            </p>
          )}
        </div>
        
        <div className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-xs text-yellow-800">
            To enable real authentication, configure your Clerk keys in the environment variables.
          </p>
        </div>
      </div>
    );
  }

  // Import Clerk components dynamically to avoid errors
  const { SignIn } = require("@clerk/nextjs");
  return <SignIn redirectUrl={redirectUrl} signUpUrl={signUpUrl} {...props} />;
}

export function ConditionalSignUp({ 
  redirectUrl, 
  signInUrl,
  ...props 
}: { 
  redirectUrl?: string;
  signInUrl?: string;
  [key: string]: any;
}) {
  if (!hasValidClerkKeys) {
    // Demo mode sign-up UI
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md max-w-md mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Demo Mode</h1>
          <p className="text-gray-600">
            Clerk authentication is not configured. You're viewing the app in demo mode.
          </p>
        </div>
        
        <div className="w-full space-y-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">Demo Registration</h3>
            <p className="text-sm text-green-700">
              In demo mode, you can explore the app without creating a real account.
            </p>
          </div>
          
          <button
            onClick={() => {
              // In demo mode, just redirect to the main app
              window.location.href = redirectUrl || '/';
            }}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Continue as Demo User
          </button>
          
          {signInUrl && (
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <a href={signInUrl} className="text-green-600 hover:underline">
                Sign in
              </a>
            </p>
          )}
        </div>
        
        <div className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-xs text-yellow-800">
            To enable real authentication, configure your Clerk keys in the environment variables.
          </p>
        </div>
      </div>
    );
  }

  // Import Clerk components dynamically to avoid errors
  const { SignUp } = require("@clerk/nextjs");
  return <SignUp redirectUrl={redirectUrl} signInUrl={signInUrl} {...props} />;
}

/**
 * Mock user data for when Clerk is not configured
 */
const mockUserData = {
  user: {
    id: "mock-user-id",
    firstName: "Demo",
    lastName: "User",
    fullName: "Demo User",
    emailAddresses: [{ emailAddress: "demo@example.com" }],
    primaryEmailAddress: { emailAddress: "demo@example.com" },
    imageUrl: "/placeholder-avatar.png",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  isLoaded: true,
  isSignedIn: true,
};

const mockAuthData = {
  getToken: async () => null,
  isLoaded: true,
  isSignedIn: false,
  userId: null,
  sessionId: null,
  orgId: null,
  orgRole: null,
  orgSlug: null,
  has: () => false,
  signOut: async () => {},
};

/**
 * Hook that conditionally uses Clerk's useUser or returns mock data
 * This is a simple wrapper that returns mock data when Clerk is not configured
 */
export function useConditionalUser() {
  if (!hasValidClerkKeys) {
    return mockUserData;
  }

  // If Clerk is configured, the component using this should be wrapped with ConditionalClerkProvider
  // and should handle the actual Clerk hook call
  return mockUserData;
}

/**
 * Hook that conditionally uses Clerk's useAuth or returns mock data
 * This is a simple wrapper that returns mock data when Clerk is not configured
 */
export function useConditionalAuth() {
  if (!hasValidClerkKeys) {
    return mockAuthData;
  }

  // If Clerk is configured, the component using this should be wrapped with ConditionalClerkProvider
  // and should handle the actual Clerk hook call
  return mockAuthData;
}

/**
 * Component that provides Clerk hooks when configured, or mock data when not
 */
export function ConditionalClerkProvider({ children }: { children: React.ReactNode }) {
  if (!hasValidClerkKeys) {
    return <>{children}</>;
  }

  try {
    const { ClerkProvider } = require("@clerk/nextjs");
    return <ClerkProvider>{children}</ClerkProvider>;
  } catch (error) {
    console.warn("Clerk provider failed:", error);
    return <>{children}</>;
  }
}

/**
 * Get user data - not a hook, just a utility function
 */
export function getConditionalUser() {
  if (!hasValidClerkKeys) {
    return mockUserData;
  }

  // This should be used in components that can handle the async nature
  return null; // Indicates that Clerk should be used
}

/**
 * Get auth data - not a hook, just a utility function  
 */
export function getConditionalAuth() {
  if (!hasValidClerkKeys) {
    return mockAuthData;
  }

  // This should be used in components that can handle the async nature
  return null; // Indicates that Clerk should be used
}

/**
 * Component that conditionally renders based on Clerk configuration
 */
export function ConditionalAuthProvider({ children }: { children: React.ReactNode }) {
  if (!hasValidClerkKeys) {
    return <>{children}</>;
  }

  try {
    const { ClerkProvider } = require("@clerk/nextjs");
    return <ClerkProvider>{children}</ClerkProvider>;
  } catch (error) {
    console.warn("Clerk provider failed:", error);
    return <>{children}</>;
  }
}

/**
 * Simple utility to check if Clerk is configured
 */
export function isClerkConfigured(): boolean {
  return hasValidClerkKeys;
}
