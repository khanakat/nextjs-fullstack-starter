import React from "react";
import { useConditionalUser } from "@/components/conditional-clerk";
import { useAuthStore } from "@/store";

export function useAuth() {
  const { user: clerkUser, isLoaded, isSignedIn } = useConditionalUser();
  const { user: storeUser, setUser, setLoading } = useAuthStore();

  // Sync Clerk user with store
  React.useEffect(() => {
    if (isLoaded) {
      setLoading(false);

      if (isSignedIn && clerkUser) {
        const userData = {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          name: clerkUser.fullName,
          username: clerkUser.username,
          image: clerkUser.imageUrl,
          bio: (clerkUser.publicMetadata?.bio as string) || null,
        };
        setUser(userData);
      } else {
        setUser(null);
      }
    } else {
      setLoading(true);
    }
  }, [isLoaded, isSignedIn, clerkUser, setUser, setLoading]);

  return {
    user: storeUser,
    isLoading: !isLoaded,
    isAuthenticated: isSignedIn,
  };
}
