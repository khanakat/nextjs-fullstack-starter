import { currentUser, redirectToSignIn } from "@/lib/conditional-auth";
import { db } from "@/lib/db";

/**
 * Get or create a user profile
 * Automatically creates a profile if it doesn't exist
 * Redirects to sign-in if user is not authenticated
 */
export const initialProfile = async () => {
  const user = await currentUser();

  if (!user) {
    return redirectToSignIn();
  }

  let profile = await db.user.findUnique({
    where: {
      clerkId: user.id,
    },
    include: {
      subscription: true,
    },
  });

  if (!profile) {
    profile = await db.user.create({
      data: {
        clerkId: user.id,
        name: `${user.firstName} ${user.lastName}` || user.username || "User",
        email: user.emailAddresses[0].emailAddress,
        imageUrl: user.imageUrl,
        username: user.username,
      },
      include: {
        subscription: true,
      },
    });
  }

  return profile;
};
