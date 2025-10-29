import { Metadata } from "next";
import EmailDemo from "@/components/email-demo";

export const metadata: Metadata = {
  title: "Email System | Fullstack Template",
  description:
    "Email system with Resend integration and React Email templates.",
};

export default function EmailPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Email System</h1>
          <p className="text-muted-foreground mt-2">
            Send beautiful emails with Resend integration and React Email
            templates.
          </p>
        </div>

        <EmailDemo />
      </div>
    </div>
  );
}
