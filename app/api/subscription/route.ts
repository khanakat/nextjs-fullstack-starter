import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { SubscriptionService } from '@/lib/subscription-service';
import { subscriptionPlans } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'User not authenticated' }, 
        { status: 401 }
      );
    }

    const { priceId, plan } = await req.json();

    if (!priceId || !plan) {
      return NextResponse.json(
        { error: 'Missing priceId or plan' }, 
        { status: 400 }
      );
    }

    if (!subscriptionPlans[plan as keyof typeof subscriptionPlans]) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' }, 
        { status: 400 }
      );
    }

    const session = await SubscriptionService.createCheckoutSession(
      user.id,
      priceId,
      plan
    );

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Subscription checkout error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'User not authenticated' }, 
        { status: 401 }
      );
    }

    const subscription = await SubscriptionService.getUserSubscription(user.id);
    const hasActive = await SubscriptionService.hasActiveSubscription(user.id);
    const limits = await SubscriptionService.getSubscriptionLimits(user.id);

    return NextResponse.json({
      subscription,
      hasActiveSubscription: hasActive,
      limits,
      plans: subscriptionPlans
    });

  } catch (error) {
    console.error('Subscription get error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get subscription', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}