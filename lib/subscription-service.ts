import {
  stripe,
  stripeConfig,
  subscriptionPlans,
  SubscriptionPlan,
} from "@/lib/stripe";
import { db } from "@/lib/db";
import { EmailService } from "@/lib/email-service";
import { currentUser } from "@clerk/nextjs/server";

export class SubscriptionService {
  /**
   * Create a Stripe customer for a user
   */
  static async createCustomer(userId: string, email: string, name?: string) {
    try {
      // Check if customer already exists
      const existingSubscription = await db.userSubscription.findUnique({
        where: { userId },
      });

      if (existingSubscription?.stripeCustomerId) {
        return existingSubscription.stripeCustomerId;
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email,
        name: name || undefined,
        metadata: {
          userId,
        },
      });

      // Update or create subscription record
      await db.userSubscription.upsert({
        where: { userId },
        update: {
          stripeCustomerId: customer.id,
        },
        create: {
          userId,
          stripeCustomerId: customer.id,
          plan: "free",
          status: "active",
        },
      });

      return customer.id;
    } catch (error) {
      console.error("Error creating Stripe customer:", error);
      throw error;
    }
  }

  /**
   * Create a checkout session for subscription
   */
  static async createCheckoutSession(
    userId: string,
    priceId: string,
    plan: SubscriptionPlan,
  ) {
    try {
      const user = await currentUser();
      if (!user) throw new Error("User not authenticated");

      const customerId = await this.createCustomer(
        userId,
        user.emailAddresses[0]?.emailAddress || "",
        user.firstName || undefined,
      );

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${stripeConfig.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: stripeConfig.cancelUrl,
        metadata: {
          userId,
          plan,
        },
        subscription_data: {
          metadata: {
            userId,
            plan,
          },
        },
      });

      return session;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw error;
    }
  }

  /**
   * Create a billing portal session
   */
  static async createBillingPortalSession(userId: string) {
    try {
      const subscription = await db.userSubscription.findUnique({
        where: { userId },
      });

      if (!subscription?.stripeCustomerId) {
        throw new Error("No customer found");
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
      });

      return session;
    } catch (error) {
      console.error("Error creating billing portal session:", error);
      throw error;
    }
  }

  /**
   * Get user subscription details
   */
  static async getUserSubscription(userId: string) {
    try {
      const subscription = await db.userSubscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        // Create free subscription if none exists
        return await db.userSubscription.create({
          data: {
            userId,
            plan: "free",
            status: "active",
          },
        });
      }

      return subscription;
    } catch (error) {
      console.error("Error getting user subscription:", error);
      throw error;
    }
  }

  /**
   * Update subscription from Stripe webhook
   */
  static async updateSubscription(subscriptionData: any) {
    try {
      const userId = subscriptionData.metadata.userId;
      const plan = subscriptionData.metadata.plan;

      const subscription = await stripe.subscriptions.retrieve(
        subscriptionData.id,
      );

      await db.userSubscription.upsert({
        where: { userId },
        update: {
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000,
          ),
          plan,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
        create: {
          userId,
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000,
          ),
          plan,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      });

      // Send welcome email for new subscribers
      if (subscription.status === "active" && plan !== "free") {
        const user = await db.user.findUnique({
          where: { id: userId },
        });

        if (user?.email) {
          await EmailService.sendNotification(
            user.email,
            "Welcome to Premium!",
            {
              html: `Your ${plan} subscription is now active. Thank you for upgrading!`,
              text: `Your ${plan} subscription is now active. Thank you for upgrading!`
            }
          );
        }
      }

      return subscription;
    } catch (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(userId: string) {
    try {
      const userSubscription = await db.userSubscription.findUnique({
        where: { userId },
      });

      if (!userSubscription?.stripeSubscriptionId) {
        throw new Error("No active subscription found");
      }

      const subscription = await stripe.subscriptions.update(
        userSubscription.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        },
      );

      await db.userSubscription.update({
        where: { userId },
        data: {
          cancelAtPeriodEnd: true,
        },
      });

      return subscription;
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw error;
    }
  }

  /**
   * Check if user has active subscription
   */
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);

      if (subscription.plan === "free") return false;
      if (subscription.status !== "active") return false;

      // Check if subscription period has ended
      if (subscription.stripeCurrentPeriodEnd) {
        return subscription.stripeCurrentPeriodEnd.getTime() > Date.now();
      }

      return true;
    } catch (error) {
      console.error("Error checking active subscription:", error);
      return false;
    }
  }

  /**
   * Get subscription limits for user
   */
  static async getSubscriptionLimits(userId: string) {
    try {
      const subscription = await this.getUserSubscription(userId);
      return (
        subscriptionPlans[subscription.plan as SubscriptionPlan]?.limits ||
        subscriptionPlans.free.limits
      );
    } catch (error) {
      console.error("Error getting subscription limits:", error);
      return subscriptionPlans.free.limits;
    }
  }
}
