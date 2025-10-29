"use client";

import React from "react";

// Check if Clerk is properly configured
const hasValidClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_development_key" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");

/**
 * Conditional Clerk components that work whether Clerk is configured or not
 */
export function ConditionalSignedIn({ children }: { children: React.ReactNode }) {
  if (!hasValidClerkKeys) {
    return null; // Don't render anything if Clerk is not configured
  }

  // Import Clerk components dynamically to avoid errors
  const { SignedIn } = require("@clerk/nextjs");
  return <SignedIn>{children}</SignedIn>;
}

export function ConditionalSignedOut({ children }: { children: React.ReactNode }) {
  if (!hasValidClerkKeys) {
    return <>{children}</>; // Always render children if Clerk is not configured (user is "signed out")
  }

  // Import Clerk components dynamically to avoid errors
  const { SignedOut } = require("@clerk/nextjs");
  return <SignedOut>{children}</SignedOut>;
}

export function ConditionalUserButton({ afterSignOutUrl }: { afterSignOutUrl?: string }) {
  if (!hasValidClerkKeys) {
    return null; // Don't render anything if Clerk is not configured
  }

  // Import Clerk components dynamically to avoid errors
  const { UserButton } = require("@clerk/nextjs");
  return <UserButton afterSignOutUrl={afterSignOutUrl} />;
}

/**
 * Conditional useUser hook that works whether Clerk is configured or not
 */
export function useConditionalUser() {
  if (!hasValidClerkKeys) {
    return {
      user: null,
      isLoaded: true,
      isSignedIn: false,
    };
  }

  // Import Clerk hooks dynamically to avoid errors
  const { useUser } = require("@clerk/nextjs");
  return useUser();
}

/**
 * Conditional useAuth hook that works whether Clerk is configured or not
 */
export function useConditionalAuth() {
  if (!hasValidClerkKeys) {
    return {
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
  }

  // Import Clerk hooks dynamically to avoid errors
  const { useAuth } = require("@clerk/nextjs");
  return useAuth();
}