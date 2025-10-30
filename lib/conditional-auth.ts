/**
 * Conditional Auth Helper
 * 
 * This helper provides authentication functions that work whether Clerk is configured or not.
 * When Clerk is not properly configured, it returns null/empty values instead of throwing errors.
 */

import { auth as clerkAuth, currentUser as clerkCurrentUser, redirectToSignIn as clerkRedirectToSignIn } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

// Check if Clerk is properly configured
const hasValidClerkKeys = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_development_key" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_")
);

/**
 * Conditional auth function that returns user ID if Clerk is configured, null otherwise
 */
export function auth() {
  if (!hasValidClerkKeys) {
    return { userId: null };
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
    return null;
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