"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, AlertCircle, Crown } from "lucide-react";
import { toast } from "sonner";

interface Subscription {
  id: string;
  status: string;
  plan: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export default function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManaging, setIsManaging] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch("/api/subscription");

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsManaging(true);

    try {
      const response = await fetch("/api/subscription/billing-portal", {
        method: "POST",
      });

      const { url } = await response.json();

      if (response.ok && url) {
        window.location.href = url;
      } else {
        throw new Error("Failed to create billing portal session");
      }
    } catch (error) {
      console.error("Billing portal error:", error);
      toast.error("Failed to access billing portal");
    } finally {
      setIsManaging(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "trialing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "past_due":
      case "unpaid":
        return "bg-red-100 text-red-800 border-red-200";
      case "canceled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Crown className="h-4 w-4" />;
      case "past_due":
      case "unpaid":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <div className="text-gray-500 mb-2">No active subscription</div>
            <Badge variant="outline" className="bg-gray-50">
              Free Plan
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            You're currently on the free plan. Upgrade to unlock premium
            features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Subscription Status</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManageBilling}
          disabled={isManaging}
        >
          {isManaging ? "Loading..." : "Manage Billing"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan and Status */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium capitalize">
              {subscription.plan} Plan
            </div>
            <div className="text-sm text-muted-foreground">
              Subscription ID: {subscription.id.slice(-8)}
            </div>
          </div>
          <Badge
            className={`flex items-center gap-1 ${getStatusColor(subscription.status)}`}
          >
            {getStatusIcon(subscription.status)}
            <span className="capitalize">{subscription.status}</span>
          </Badge>
        </div>

        {/* Renewal Date */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {subscription.cancelAtPeriodEnd ? "Expires on" : "Renews on"}:
          </span>
          <span className="font-medium">
            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </span>
        </div>

        {/* Cancellation Notice */}
        {subscription.cancelAtPeriodEnd && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-yellow-800">
                Subscription Canceled
              </div>
              <div className="text-yellow-700">
                Your subscription will end on{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                You can reactivate it anytime before then.
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {subscription.status === "past_due" && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-red-800">Payment Past Due</div>
              <div className="text-red-700">
                Please update your payment method to continue using premium
                features.
              </div>
            </div>
          </div>
        )}

        {subscription.status === "trialing" && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <CreditCard className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-blue-800">Free Trial Active</div>
              <div className="text-blue-700">
                Your trial ends on{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                Add a payment method to continue after the trial.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
