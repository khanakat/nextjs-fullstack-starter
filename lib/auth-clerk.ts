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

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

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
    // Update existing user with latest data from Clerk
    const updatedUser = await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        email: user.emailAddresses[0]?.emailAddress || existingUser.email,
        name: user.fullName || existingUser.name,
        username: user.username || existingUser.username,
        image: user.imageUrl || existingUser.image,
      },
    });

    return updatedUser;
  } else {
    // Create new user in database
    const newUser = await db.user.create({
      data: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName,
        username: user.username,
        image: user.imageUrl,
      },
    });

    return newUser;
  }
};

/**
 * Check if current user is an admin
 */
export const isAdmin = async (): Promise<boolean> => {
  const { userId } = auth();

  if (!userId) {
    return false;
  }

  // You can implement your own admin logic here
  // For example, check against a list of admin user IDs
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(",") || [];
  
  return adminUserIds.includes(userId);
};

/**
 * Get user by Clerk ID
 */
export const getUserByClerkId = async (clerkId: string) => {
  const user = await db.user.findUnique({
    where: {
      id: clerkId,
    },
    include: {
      posts: {
        where: {
          published: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
      _count: {
        select: {
          posts: true,
          followers: true,
          follows: true,
        },
      },
    },
  });

  return user;
};