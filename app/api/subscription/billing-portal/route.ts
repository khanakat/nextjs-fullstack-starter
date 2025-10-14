import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { SubscriptionService } from '@/lib/subscription-service';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'User not authenticated' }, 
        { status: 401 }
      );
    }

    const session = await SubscriptionService.createBillingPortalSession(user.id);

    return NextResponse.json({
      url: session.url
    });

  } catch (error) {
    console.error('Billing portal error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create billing portal session', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}