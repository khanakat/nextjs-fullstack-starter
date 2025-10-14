# Subscription Management System

A comprehensive Stripe-powered subscription system with multiple plans, secure payment processing, and automated billing management.

## 🌟 Features

### Multi-tier Plans
- **Free Plan**: Basic features with usage limits
- **Pro Plan**: Enhanced features with higher limits  
- **Enterprise Plan**: Full access with custom solutions

### Payment Processing
- Secure Stripe checkout integration
- Multiple payment methods support
- Automatic invoice generation
- Failed payment handling

### Billing Management  
- Customer billing portal
- Subscription upgrades/downgrades
- Cancellation with grace period
- Prorated billing adjustments

### Real-time Updates
- Webhook-based synchronization
- Instant status updates
- Automated email notifications
- Database consistency

## 🚀 Quick Start

### 1. Environment Setup

Add these variables to your `.env.local`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"  
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Price IDs (create in Stripe Dashboard)
STRIPE_PRO_PRICE_ID="price_your_pro_monthly_price_id"
STRIPE_ENTERPRISE_PRICE_ID="price_your_enterprise_monthly_price_id"
```

### 2. Stripe Dashboard Setup

1. **Create Products**: Go to Stripe Dashboard → Products
   - Pro Plan: $29/month
   - Enterprise Plan: $99/month

2. **Get Price IDs**: Copy the price IDs from each product

3. **Configure Webhooks**: Add endpoint `https://yourapp.com/api/webhooks/stripe`
   - Events: `customer.subscription.*`, `checkout.session.completed`, `invoice.*`

### 3. Database Migration

The subscription system requires the UserSubscription model:

```bash
npx prisma db push
```

## 📋 API Routes

### Subscription Management
- `GET /api/subscription` - Get user subscription status
- `POST /api/subscription` - Create checkout session

### Billing Portal
- `POST /api/subscription/billing-portal` - Access customer portal

### Webhooks
- `POST /api/webhooks/stripe` - Handle Stripe events

## 🔧 Components

### PricingCards
Interactive pricing display with checkout integration:

```tsx
import PricingCards from "@/components/pricing-cards";

<PricingCards 
  currentPlan="free" 
  hasActiveSubscription={false} 
/>
```

### SubscriptionStatus
Real-time subscription dashboard:

```tsx
import SubscriptionStatus from "@/components/subscription-status";

<SubscriptionStatus />
```

### SubscriptionDemo
Complete demo with all features:

```tsx
import SubscriptionDemo from "@/components/subscription-demo";

<SubscriptionDemo />
```

## 🔐 Usage & Security

### Plan-based Access Control

Check user subscription in your components:

```tsx
import { getUserSubscription } from "@/lib/subscription-service";

export async function FeatureComponent() {
  const subscription = await getUserSubscription();
  
  if (!subscription || subscription.plan === 'free') {
    return <UpgradePrompt />;
  }
  
  // Render premium feature
  return <PremiumFeature />;
}
```

### Server Actions with Limits

```tsx
import { checkSubscriptionLimits } from "@/lib/subscription-service";

export async function createPost(formData: FormData) {
  const user = await currentUser();
  const canCreate = await checkSubscriptionLimits(user.id, 'posts');
  
  if (!canCreate) {
    throw new Error('Upgrade required');
  }
  
  // Create post logic
}
```

## 📊 Database Schema

The system extends your Prisma schema:

```prisma
model User {
  id           String  @id
  // ... existing fields
  subscription UserSubscription?
}

model UserSubscription {
  id                     String    @id @default(cuid())
  userId                 String    @unique
  stripeCustomerId       String?   @unique
  stripeSubscriptionId   String?   @unique
  stripePriceId         String?
  stripeCurrentPeriodEnd DateTime?
  plan                   String    @default("free")
  status                 String?
  user                   User      @relation(fields: [userId], references: [id])
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
}
```

## ⚡ Webhook Events

The system handles these Stripe events:

- `checkout.session.completed` - New subscriptions
- `customer.subscription.created` - Subscription created  
- `customer.subscription.updated` - Plan changes
- `customer.subscription.deleted` - Cancellations
- `invoice.payment_succeeded` - Successful payments
- `invoice.payment_failed` - Failed payments

## 🎯 Testing

### Test Cards
Use Stripe test cards for development:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`  
- **3D Secure**: `4000 0025 0000 3155`

### Webhook Testing
Use Stripe CLI for local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 🛡️ Error Handling

The system includes comprehensive error handling:

- Payment failures with retry logic
- Webhook duplicate event protection
- Graceful subscription downgrades
- User-friendly error messages

## 📈 Analytics & Monitoring

Track key subscription metrics:

- Monthly Recurring Revenue (MRR)
- Churn rate and retention
- Plan conversion rates
- Payment failure rates

## 🔄 Plan Features & Limits

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| File Uploads | 5/month | Unlimited | Unlimited |
| Emails | 10/month | 1,000/month | Unlimited |
| Support | Community | Priority | Dedicated |
| API Access | Limited | Full | Full + Custom |

## 🚀 Production Deployment

### Environment Variables
Ensure all production environment variables are set:

```bash
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Webhook Endpoint
Configure production webhook URL in Stripe Dashboard:
- URL: `https://yourapp.com/api/webhooks/stripe`
- Events: All subscription and payment events

### Database Migration
Run migrations in production:

```bash
npx prisma migrate deploy
```

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Billing Guide](https://stripe.com/docs/billing)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Testing Guide](https://stripe.com/docs/testing)

## 🔍 Troubleshooting

### Common Issues

**Webhook not receiving events**:
- Verify webhook URL is accessible
- Check webhook secret matches
- Ensure HTTPS in production

**Payment method declined**:  
- Validate test card numbers
- Check billing address requirements
- Review Stripe logs for details

**Subscription not updating**:
- Verify webhook processing
- Check database connection
- Review error logs

For more help, check the Stripe Dashboard logs and webhook delivery attempts.