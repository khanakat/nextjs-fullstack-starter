import { NextRequest, NextResponse } from "next/server";
import { ApiError, errorResponse } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe, stripeConfig } from "@/lib/stripe";
import { SubscriptionService } from "@/lib/subscription-service";
import { EmailService } from "@/lib/services/email-service";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature found" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeConfig.webhookSecret,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "subscription") {
          const subscriptionId = session.subscription as string;
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);

          await SubscriptionService.updateSubscription(subscription);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await SubscriptionService.updateSubscription(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        if (subscription.metadata.userId) {
          // Downgrade to free plan
          await SubscriptionService.updateSubscription({
            ...subscription,
            metadata: { ...subscription.metadata, plan: "free" },
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string,
          );
          await SubscriptionService.updateSubscription(subscription);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string,
          );

          // Update subscription status to past_due
          await SubscriptionService.updateSubscription(subscription);

          // ✅ Fixed: Send payment failed email notification
          try {
            const customer = await stripe.customers.retrieve(
              subscription.customer as string,
            );
            if (customer && !customer.deleted) {
              await EmailService.sendPaymentFailedEmail({
                customerName: customer.name || customer.email || "Customer",
                customerEmail: customer.email || "",
                subscriptionId: subscription.id,
                invoiceId: invoice.id,
                amount: invoice.amount_due,
                currency: invoice.currency,
                failureReason: invoice.last_finalization_error?.message,
              });
            }
          } catch (emailError) {
            logger.error(
              "Failed to send payment failed email",
              "email",
              emailError,
            );
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.apiError("Error processing webhook request", "api", error, {
      endpoint: "/api/webhooks/stripe",
    });

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return errorResponse("Failed to process webhook request", 500);
  }
}
