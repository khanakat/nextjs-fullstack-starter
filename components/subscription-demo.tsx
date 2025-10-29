"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Crown, Users, Zap } from "lucide-react";
import PricingCards from "@/components/pricing-cards";
import SubscriptionStatus from "@/components/subscription-status";

export default function SubscriptionDemo() {
  const [activeTab, setActiveTab] = useState("pricing");

  // Demo features showcase
  const features = [
    {
      icon: Crown,
      title: "Premium Plans",
      description: "Multiple subscription tiers with different feature sets",
      color: "text-yellow-600",
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Stripe-powered payment processing with webhooks",
      color: "text-blue-600",
    },
    {
      icon: Users,
      title: "Customer Portal",
      description: "Self-service billing management for customers",
      color: "text-green-600",
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description: "Instant subscription status synchronization",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">
                Subscription Management System
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete Stripe integration with multiple plans, webhooks, and
                billing portal
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Icon
                    className={`h-5 w-5 ${feature.color} flex-shrink-0 mt-0.5`}
                  />
                  <div>
                    <div className="font-medium text-sm">{feature.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {feature.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Demo Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Features</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pricing">Pricing Plans</TabsTrigger>
              <TabsTrigger value="status">Subscription Status</TabsTrigger>
              <TabsTrigger value="features">Feature Access</TabsTrigger>
            </TabsList>

            <TabsContent value="pricing" className="mt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    Choose Your Plan
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Interactive pricing cards with Stripe checkout integration
                  </p>
                </div>
                <PricingCards />
                <div className="text-xs text-muted-foreground text-center">
                  💡 <strong>Demo Mode:</strong> Test with Stripe test cards
                  (4242 4242 4242 4242)
                </div>
              </div>
            </TabsContent>

            <TabsContent value="status" className="mt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    Subscription Dashboard
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time subscription status and billing management
                  </p>
                </div>
                <div className="max-w-md mx-auto">
                  <SubscriptionStatus />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="mt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    Plan-based Features
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Different features unlocked based on subscription tier
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {/* Free Plan Features */}
                  <Card className="border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Free Plan</CardTitle>
                        <Badge variant="outline">Current</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>5 file uploads/month</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>10 emails/month</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <span className="text-muted-foreground">
                            No priority support
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pro Plan Features */}
                  <Card className="border-blue-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Pro Plan</CardTitle>
                        <Badge className="bg-blue-600">Popular</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Unlimited file uploads</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>1,000 emails/month</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Priority support</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enterprise Plan Features */}
                  <Card className="border-purple-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Enterprise</CardTitle>
                        <Badge variant="outline" className="border-purple-300">
                          Custom
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Everything in Pro</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Custom integrations</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Dedicated support</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center">
                  <Button variant="outline" size="sm">
                    View Feature Comparison
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Implementation Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Implementation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Features Included</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Multiple subscription plans (Free, Pro, Enterprise)</li>
                <li>• Stripe checkout integration</li>
                <li>• Webhook handling for real-time updates</li>
                <li>• Customer billing portal</li>
                <li>• Subscription status tracking</li>
                <li>• Plan-based feature limits</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Files Created</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  • <code>lib/stripe.ts</code> - Stripe configuration
                </li>
                <li>
                  • <code>lib/stripe-client.ts</code> - Frontend client
                </li>
                <li>
                  • <code>lib/subscription-service.ts</code> - Business logic
                </li>
                <li>
                  • <code>app/api/subscription/*</code> - API routes
                </li>
                <li>
                  • <code>components/pricing-cards.tsx</code> - Pricing UI
                </li>
                <li>• Prisma schema updated with UserSubscription</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
