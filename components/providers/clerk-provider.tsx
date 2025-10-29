"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

interface ConditionalClerkProviderProps {
  children: ReactNode;
}

export function ConditionalClerkProvider({ children }: ConditionalClerkProviderProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // Check if we have valid Clerk keys
  const hasValidKeys = publishableKey && 
    publishableKey !== "pk_test_development_key" && 
    publishableKey.startsWith("pk_");

  if (!hasValidKeys) {
    // Return children without Clerk provider if keys are invalid
    console.warn("Clerk keys not configured properly. Running without authentication.");
    return <>{children}</>;
  }

  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  );
}