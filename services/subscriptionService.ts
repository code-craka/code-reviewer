// Service for subscription and billing operations
import prisma from '@/lib/prisma';
import { Subscription, BillingDetail, ActionResponse } from '@/types';

/**
 * Get a user's subscription
 */
export async function getUserSubscription(profileId: string): Promise<Subscription | null> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { 
        profileId,
        status: { in: ['active', 'trialing'] }
      },
      orderBy: { currentPeriodEnd: 'desc' }
    });
    
    if (subscription) {
      return {
        ...subscription,
        status: subscription.status as 'active' | 'canceled' | 'past_due' | 'trialing'
      } as Subscription;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
}

/**
 * Get a user's billing details
 */
export async function getUserBillingDetails(profileId: string): Promise<BillingDetail | null> {
  try {
    const billingDetails = await prisma.billingDetail.findUnique({
      where: { profileId }
    });
    
    return billingDetails;
  } catch (error) {
    console.error('Error fetching billing details:', error);
    return null;
  }
}

/**
 * Create or update a user's subscription
 */
export async function createOrUpdateSubscription(
  profileId: string,
  planId: string,
  planName: string,
  status: 'active' | 'canceled' | 'past_due' | 'trialing',
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: boolean = false,
  paymentMethod?: string,
  paymentId?: string
): Promise<ActionResponse<Subscription>> {
  try {
    // Check for existing active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: { 
        profileId,
        status: { in: ['active', 'trialing'] }
      }
    });
    
    let subscription;
    
    if (existingSubscription) {
      // Update existing subscription
      subscription = await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          planId,
          planName,
          status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd,
          paymentMethod,
          paymentId
        }
      });
    } else {
      // Create new subscription
      subscription = await prisma.subscription.create({
        data: {
          profileId,
          planId,
          planName,
          status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd,
          paymentMethod,
          paymentId
        }
      });
    }
    
    return {
      success: true,
      data: {
        ...subscription,
        status: subscription.status as 'active' | 'canceled' | 'past_due' | 'trialing'
      } as Subscription,
      message: existingSubscription ? 'Subscription updated' : 'Subscription created'
    };
  } catch (error) {
    console.error('Error creating/updating subscription:', error);
    return {
      success: false,
      error: 'Failed to process subscription'
    };
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<ActionResponse<Subscription>> {
  try {
    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd,
        status: cancelAtPeriodEnd ? 'active' : 'canceled'
      }
    });
    
    return {
      success: true,
      data: {
        ...subscription,
        status: subscription.status as 'active' | 'canceled' | 'past_due' | 'trialing'
      } as Subscription,
      message: cancelAtPeriodEnd 
        ? 'Subscription will be canceled at the end of the billing period' 
        : 'Subscription canceled immediately'
    };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return {
      success: false,
      error: 'Failed to cancel subscription'
    };
  }
}

/**
 * Create or update billing details
 */
export async function createOrUpdateBillingDetails(
  profileId: string,
  data: {
    companyName?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    taxId?: string;
  }
): Promise<ActionResponse<BillingDetail>> {
  try {
    // Check for existing billing details
    const existingDetails = await prisma.billingDetail.findUnique({
      where: { profileId }
    });
    
    let billingDetails;
    
    if (existingDetails) {
      // Update existing details
      billingDetails = await prisma.billingDetail.update({
        where: { id: existingDetails.id },
        data
      });
    } else {
      // Create new billing details
      billingDetails = await prisma.billingDetail.create({
        data: {
          profileId,
          ...data
        }
      });
    }
    
    return {
      success: true,
      data: billingDetails,
      message: 'Billing details saved'
    };
  } catch (error) {
    console.error('Error saving billing details:', error);
    return {
      success: false,
      error: 'Failed to save billing details'
    };
  }
}

/**
 * Check if a user has an active subscription
 */
export async function hasActiveSubscription(profileId: string): Promise<boolean> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { 
        profileId,
        status: { in: ['active', 'trialing'] },
        currentPeriodEnd: { gt: new Date() }
      }
    });
    
    return !!subscription;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}
