import Stripe from "stripe";

function validateStripeConfig() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY is not defined in environment variables",
    );
  }
}

// Lazy initialization of Stripe
let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    validateStripeConfig();
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
      typescript: true,
    });
  }
  return stripeInstance;
};

// For backwards compatibility, use lazy loading
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

// Stripe configuration
export const stripeConfig = {
  get publishableKey() {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  },
  get secretKey() {
    return process.env.STRIPE_SECRET_KEY || "";
  },
  get webhookSecret() {
    return process.env.STRIPE_WEBHOOK_SECRET || "";
  },
  currency: "usd",
  get successUrl() {
    return `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/subscription/success`;
  },
  get cancelUrl() {
    return `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/subscription/cancel`;
  },
} as const;

// Subscription plans configuration
export const subscriptionPlans = {
  free: {
    name: "Free",
    description: "Perfect for getting started",
    price: 0,
    priceId: "", // No Stripe price ID for free plan
    features: [
      "Up to 3 projects",
      "Basic file uploads (10MB)",
      "Email support",
      "Community access",
    ],
    limits: {
      projects: 3,
      storage: 10 * 1024 * 1024, // 10MB
      apiCalls: 1000,
    },
  },
  pro: {
    name: "Pro",
    description: "For growing businesses",
    price: 19,
    priceId: process.env.STRIPE_PRO_PRICE_ID || "price_pro_monthly",
    features: [
      "Unlimited projects",
      "Advanced file uploads (100MB)",
      "Priority email support",
      "Advanced analytics",
      "API access",
    ],
    limits: {
      projects: -1, // Unlimited
      storage: 100 * 1024 * 1024, // 100MB
      apiCalls: 10000,
    },
  },
  enterprise: {
    name: "Enterprise",
    description: "For large organizations",
    price: 99,
    priceId:
      process.env.STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise_monthly",
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "24/7 phone support",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    limits: {
      projects: -1, // Unlimited
      storage: -1, // Unlimited
      apiCalls: -1, // Unlimited
    },
  },
} as const;

export type SubscriptionPlan = keyof typeof subscriptionPlans;
