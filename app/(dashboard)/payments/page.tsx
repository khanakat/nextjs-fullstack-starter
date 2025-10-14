import { Metadata } from "next";
import SubscriptionDemo from "@/components/subscription-demo";

export const metadata: Metadata = {
  title: "Payments | Fullstack Template",
  description: "Stripe payment integration with subscriptions and secure checkout."
};

export default function PaymentsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Payment System</h1>
          <p className="text-muted-foreground mt-2">
            Secure payments with Stripe integration, subscriptions, and webhook handling.
          </p>
        </div>
        
        <SubscriptionDemo />
      </div>
    </div>
  );
}