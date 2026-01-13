import { ConditionalSignUp } from "@/components/conditional-clerk";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <ConditionalSignUp 
        redirectUrl="/dashboard"
        signInUrl="/sign-in"
      />
    </div>
  );
}
