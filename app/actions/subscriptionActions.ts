"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Subscription, BillingDetail, ActionResponse } from "@/types";
import { revalidatePath } from "next/cache";
import { createOrGetProfile } from "@/lib/auth/profile-service";
import * as subscriptionService from "@/services/subscriptionService";

/**
 * Get the current user's subscription
 */
export async function getUserSubscription(): Promise<
  ActionResponse<Subscription | null>
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    // Get or create user profile
    const profileResult = await createOrGetProfile(user);
    if (!profileResult.success || !profileResult.data) {
      return { success: false, error: "Failed to get user profile" };
    }

    const profile = profileResult.data;

    // Get the user's subscription
    const subscription = await subscriptionService.getUserSubscription(
      profile.id,
    );

    return {
      success: true,
      data: subscription,
    };
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return { success: false, error: "Failed to fetch subscription" };
  }
}

/**
 * Get the current user's billing details
 */
export async function getUserBillingDetails(): Promise<
  ActionResponse<BillingDetail | null>
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    // Get or create user profile
    const profileResult = await createOrGetProfile(user);
    if (!profileResult.success || !profileResult.data) {
      return { success: false, error: "Failed to get user profile" };
    }

    const profile = profileResult.data;

    // Get the user's billing details
    const billingDetails = await subscriptionService.getUserBillingDetails(
      profile.id,
    );

    return {
      success: true,
      data: billingDetails,
    };
  } catch (error) {
    console.error("Error fetching user billing details:", error);
    return { success: false, error: "Failed to fetch billing details" };
  }
}

/**
 * Update the user's subscription
 * This would typically be called from a webhook after payment processing
 */
export async function updateSubscription(
  profileId: string,
  planId: string,
  planName: string,
  status: "active" | "canceled" | "past_due" | "trialing",
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: boolean = false,
  paymentMethod?: string,
  paymentId?: string,
): Promise<ActionResponse<Subscription>> {
  try {
    // Update the subscription using the provided profileId directly
    const result = await subscriptionService.createOrUpdateSubscription(
      profileId,
      planId,
      planName,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      paymentMethod,
      paymentId,
    );

    revalidatePath("/billing");

    return result;
  } catch (error) {
    console.error("Error updating subscription:", error);
    return { success: false, error: "Failed to update subscription" };
  }
}

/**
 * Cancel the user's subscription
 */
export async function cancelSubscription(
  cancelAtPeriodEnd: boolean = true,
): Promise<ActionResponse<Subscription>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    // Get or create user profile
    const profileResult = await createOrGetProfile(user);
    if (!profileResult.success || !profileResult.data) {
      return { success: false, error: "Failed to get user profile" };
    }

    const profile = profileResult.data;

    // Get the user's active subscription
    const subscription = await subscriptionService.getUserSubscription(
      profile.id,
    );

    if (!subscription) {
      return { success: false, error: "No active subscription found" };
    }

    // Cancel the subscription
    const result = await subscriptionService.cancelSubscription(
      subscription.id,
      cancelAtPeriodEnd,
    );

    revalidatePath("/billing");

    return result;
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return { success: false, error: "Failed to cancel subscription" };
  }
}

/**
 * Update the user's billing details
 */
export async function updateBillingDetails(
  formData: FormData,
): Promise<ActionResponse<BillingDetail>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    // Get or create user profile
    const profileResult = await createOrGetProfile(user);
    if (!profileResult.success || !profileResult.data) {
      return { success: false, error: "Failed to get user profile" };
    }

    const profile = profileResult.data;

    // Extract billing details from form data
    const billingData = {
      companyName: (formData.get("companyName") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      city: (formData.get("city") as string) || undefined,
      state: (formData.get("state") as string) || undefined,
      zipCode: (formData.get("zipCode") as string) || undefined,
      country: (formData.get("country") as string) || undefined,
      taxId: (formData.get("taxId") as string) || undefined,
    };

    // Update the billing details
    const result = await subscriptionService.createOrUpdateBillingDetails(
      profile.id,
      billingData,
    );

    revalidatePath("/billing");

    return result;
  } catch (error) {
    console.error("Error updating billing details:", error);
    return { success: false, error: "Failed to update billing details" };
  }
}

/**
 * Check if the current user has an active subscription
 */
export async function checkSubscriptionStatus(): Promise<
  ActionResponse<boolean>
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    // Get or create user profile
    const profileResult = await createOrGetProfile(user);
    if (!profileResult.success || !profileResult.data) {
      return { success: false, error: "Failed to get user profile" };
    }

    const profile = profileResult.data;

    // Check if the user has an active subscription
    const hasActiveSubscription =
      await subscriptionService.hasActiveSubscription(profile.id);

    return {
      success: true,
      data: hasActiveSubscription,
    };
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return { success: false, error: "Failed to check subscription status" };
  }
}
