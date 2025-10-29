"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Building2 } from "lucide-react";
import { toast } from "sonner";
import { subscriptionPlans } from "@/lib/stripe";

interface PricingCardsProps {
  currentPlan?: string;
  hasActiveSubscription?: boolean;
}

export default function PricingCards({
  currentPlan = "free",
  hasActiveSubscription = false,
}: PricingCardsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: string, priceId: string) => {
    if (plan === "free") return;

    setIsLoading(plan);

    try {
      // Create checkout session
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          plan,
        }),
      });

      const { url } = await response.json();

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("Failed to start upgrade process");
    } finally {
      setIsLoading(null);
    }
  };

  const handleBillingPortal = async () => {
    setIsLoading("portal");

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
      setIsLoading(null);
    }
  };

  const planIcons = {
    free: Zap,
    pro: Crown,
    enterprise: Building2,
  };

  const planColors = {
    free: "bg-gray-50 border-gray-200",
    pro: "bg-blue-50 border-blue-200 ring-2 ring-blue-500",
    enterprise: "bg-purple-50 border-purple-200",
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {Object.entries(subscriptionPlans).map(([key, plan]) => {
        const Icon = planIcons[key as keyof typeof planIcons];
        const isCurrentPlan = currentPlan === key;
        const isPro = key === "pro";

        return (
          <Card
            key={key}
            className={`relative ${planColors[key as keyof typeof planColors]} ${
              isPro ? "border-2" : "border"
            }`}
          >
            {isPro && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white px-3 py-1">
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                <Icon
                  className={`h-8 w-8 ${
                    key === "free"
                      ? "text-gray-600"
                      : key === "pro"
                        ? "text-blue-600"
                        : "text-purple-600"
                  }`}
                />
              </div>
              <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {plan.description}
              </p>
              <div className="mt-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                {plan.price > 0 && (
                  <span className="text-muted-foreground">/month</span>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </CardContent>

            <CardFooter>
              {isCurrentPlan ? (
                hasActiveSubscription && key !== "free" ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleBillingPortal}
                    disabled={isLoading === "portal"}
                  >
                    Manage Billing
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    Current Plan
                  </Button>
                )
              ) : key === "free" ? (
                <Button className="w-full" variant="outline" disabled>
                  Free Forever
                </Button>
              ) : (
                <Button
                  className={`w-full ${
                    isPro
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                  onClick={() => handleUpgrade(key, plan.priceId)}
                  disabled={isLoading === key}
                >
                  {isLoading === key
                    ? "Processing..."
                    : `Upgrade to ${plan.name}`}
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
