/**
 * Clerk Configuration
 *
 * This file contains utility functions for Clerk authentication
 * Make sure to set up your Clerk environment variables in .env.local:
 *
 * NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
 * CLERK_SECRET_KEY=your_secret_key
 * NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
 * NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
 * NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
 * NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
 */

import {
  auth as clerkAuth,
  currentUser as clerkCurrentUser,
} from "@/lib/conditional-auth";
import { db } from "@/lib/db";

// Re-export conditional auth functions
export const auth = clerkAuth;
export const currentUser = clerkCurrentUser;

/**
 * Get the current user's profile from the database
 */
export const getCurrentProfile = async () => {
  const { userId } = auth();

  if (!userId) {
    return null;
  }

  const profile = await db.user.findUnique({
    where: {
      id: userId,
    },
  });

  return profile;
};

/**
 * Create or update user profile in database when user signs up/in
 */
export const syncUserWithDatabase = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  // Check if user exists in database
  const existingUser = await db.user.findUnique({
    where: {
      id: user.id,
    },
  });

  if (existingUser) {
    // Update existing user
    return await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: user.firstName + " " + user.lastName,
        email: user.emailAddresses[0]?.emailAddress,
        image: user.imageUrl,
        updatedAt: new Date(),
      },
    });
  } else {
    // Create new user
    return await db.user.create({
      data: {
        id: user.id,
        name: user.firstName + " " + user.lastName,
        email: user.emailAddresses[0]?.emailAddress,
        image: user.imageUrl,
        // role: "USER", // Commented out as role field doesn't exist in User model
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
};

/**
 * Check if the current user is an admin
 */
export const isAdmin = async (): Promise<boolean> => {
  const profile = await getCurrentProfile();

  if (!profile) {
    return false;
  }

  return false; // Simplified admin check since role field doesn't exist
};

/**
 * Get user by Clerk ID
 */
export const getUserByClerkId = async (clerkId: string) => {
  return await db.user.findUnique({
    where: {
      id: clerkId,
    },
    // include: {
    //   organizations: {
    //     include: {
    //       organization: true,
    //     },
    //   },
    // },
  });
};
