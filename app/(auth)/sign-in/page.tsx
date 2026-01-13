import { ConditionalSignIn } from "@/components/conditional-clerk";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <ConditionalSignIn 
        redirectUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
