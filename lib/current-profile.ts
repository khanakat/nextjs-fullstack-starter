import { auth } from "@/lib/conditional-auth";
import { db } from "@/lib/db";

/**
 * Get the current user's profile from the database
 * Returns null if user is not authenticated
 */
export const currentProfile = async () => {
  const { userId } = auth();

  if (!userId) {
    return null;
  }

  const profile = await db.user.findUnique({
    where: {
      clerkId: userId,
    },
    include: {
      subscription: true,
    },
  });

  return profile;
};
