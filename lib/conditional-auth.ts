/**
 * Conditional Auth Helper
 * 
 * This helper provides authentication functions that work whether Clerk is configured or not.
 * When Clerk is not properly configured, it returns null/empty values instead of throwing errors.
 */

import {
  auth as clerkAuth,
  currentUser as clerkCurrentUser,
  redirectToSignIn as clerkRedirectToSignIn,
} from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";
import { cookies } from "next/headers";

// Check if Clerk is properly configured (publishable + secret present)
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

const mockUser = {
  id: "mock-user-id",
  firstName: "Demo",
  lastName: "User",
  fullName: "Demo User",
  emailAddresses: [{ emailAddress: "demo@example.com" }],
  primaryEmailAddress: { emailAddress: "demo@example.com" },
  imageUrl: "/placeholder-avatar.png",
  username: "demo-user",
};

/**
 * Conditional auth function that returns user ID if Clerk is configured, null otherwise
 */
export function auth() {
  if (!hasValidClerkKeys) {
    const demo = cookies().get("demo_auth")?.value === "1";
    return { userId: demo ? mockUser.id : null };
  }

  try {
    return clerkAuth();
  } catch (error) {
    console.warn("Clerk auth error:", error);
    return { userId: null };
  }
}

/**
 * Conditional currentUser function that returns user if Clerk is configured, null otherwise
 */
export async function currentUser() {
  if (!hasValidClerkKeys) {
    const demo = cookies().get("demo_auth")?.value === "1";
    return demo ? (mockUser as any) : null;
  }

  try {
    return await clerkCurrentUser();
  } catch (error) {
    console.warn("Clerk currentUser error:", error);
    return null;
  }
}

/**
 * Conditional redirectToSignIn function that redirects to sign-in if Clerk is configured, home otherwise
 */
export function redirectToSignIn() {
  if (!hasValidClerkKeys) {
    return redirect("/");
  }

  try {
    return clerkRedirectToSignIn();
  } catch (error) {
    console.warn("Clerk redirectToSignIn error:", error);
    return redirect("/");
  }
}



/**
 * Check if authentication is properly configured
 */
export function isAuthConfigured(): boolean {
  return hasValidClerkKeys;
}
