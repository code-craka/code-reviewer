"use server";

import { revalidatePath } from "next/cache";
import { ReviewDepth, ReviewStatus } from "@/types/ai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReviewService } from "@/lib/ai/review-service";
import { createOrGetProfile } from "@/lib/auth/profile-service";
import { handleApiError } from "@/lib/utils/error-handling";
import { logger } from "@/lib/utils/logger";

/**
 * Server action to create a new code review
 */
export async function createReviewAction(
  code: string,
  language: string,
  fileName: string | null,
  modelId: string,
  depth: ReviewDepth,
  projectId?: string,
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        error: "Authentication required",
        review: null,
      };
    }

    // Get or create user profile
    const profileResult = await createOrGetProfile(user);
    if (!profileResult.success || !profileResult.data) {
      return {
        error: "Failed to get user profile",
        review: null,
      };
    }

    const profile = profileResult.data;
    const reviewService = new ReviewService();

    const review = await reviewService.createReview({
      code,
      language,
      fileName,
      modelId,
      depth,
      userId: profile.id,
      projectId,
    });

    // Revalidate both paths as the review might be displayed in both
    revalidatePath("/reviews");
    if (projectId) {
      revalidatePath(`/projects/${projectId}`);
    }

    return {
      error: null,
      review,
    };
  } catch (error) {
    logger.error("Failed to create review", { error });
    const errorResult = handleApiError(error);
    return {
      error: errorResult.error,
      review: null,
    };
  }
}

/**
 * Server action to process a review (run AI analysis)
 */
export async function processReviewAction(reviewId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        error: "Authentication required",
        review: null,
      };
    }

    const reviewService = new ReviewService();
    const review = await reviewService.processReview(reviewId);

    // Revalidate both paths as the review might be displayed in both
    revalidatePath("/reviews");
    if (review.projectId) {
      revalidatePath(`/projects/${review.projectId}`);
    }

    return {
      error: null,
      review,
    };
  } catch (error) {
    const errorResult = handleApiError(error);
    return {
      error: errorResult.error,
      review: null,
    };
  }
}

/**
 * Server action to get a specific review by ID
 */
export async function getReviewAction(reviewId: string) {
  try {
    const reviewService = new ReviewService();
    const review = await reviewService.getReviewById(reviewId);

    return {
      error: null,
      review,
    };
  } catch (error) {
    const errorResult = handleApiError(error);
    return {
      error: errorResult.error,
      review: null,
    };
  }
}

/**
 * Server action to get all reviews for a user
 */
export async function getUserReviewsAction(projectId?: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        error: "Authentication required",
        reviews: [],
      };
    }

    // Get or create user profile
    const profileResult = await createOrGetProfile(user);
    if (!profileResult.success || !profileResult.data) {
      return {
        error: "Failed to get user profile",
        reviews: [],
      };
    }

    const profile = profileResult.data;
    const reviewService = new ReviewService();

    const reviews = await reviewService.getUserReviews(profile.id, projectId);

    return {
      error: null,
      reviews,
    };
  } catch (error) {
    const errorResult = handleApiError(error);
    return {
      error: errorResult.error,
      reviews: [],
    };
  }
}

/**
 * Server action to update the status of a review result
 */
export async function updateReviewResultStatusAction(
  resultId: string,
  status: ReviewStatus,
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        error: "Authentication required",
        success: false,
      };
    }

    // Get or create user profile
    const profileResult = await createOrGetProfile(user);
    if (!profileResult.success || !profileResult.data) {
      return {
        error: "Failed to get user profile",
        success: false,
      };
    }

    const profile = profileResult.data;
    const reviewService = new ReviewService();

    await reviewService.updateReviewResultStatus(resultId, status, profile.id);

    // We don't know the exact paths to revalidate, but we can revalidate the reviews page
    // For a more targeted revalidation, we would need to know the reviewId or projectId
    revalidatePath("/reviews");

    return {
      error: null,
      success: true,
    };
  } catch (error) {
    const errorResult = handleApiError(error);
    return {
      error: errorResult.error,
      success: false,
    };
  }
}

/**
 * Server action to delete a review
 */
export async function deleteReviewAction(reviewId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        error: "Authentication required",
        success: false,
      };
    }

    // Get or create user profile
    const profileResult = await createOrGetProfile(user);
    if (!profileResult.success || !profileResult.data) {
      return {
        error: "Failed to get user profile",
        success: false,
      };
    }

    const profile = profileResult.data;
    const reviewService = new ReviewService();

    // Check if the review belongs to the user before deleting
    const review = await reviewService.getReviewById(reviewId);
    if (review.userId !== profile.id) {
      return {
        error: "You do not have permission to delete this review",
        success: false,
      };
    }

    await reviewService.deleteReview(reviewId, profile.id);

    // Revalidate both paths as the review might be displayed in both
    revalidatePath("/reviews");
    if (review.projectId) {
      revalidatePath(`/projects/${review.projectId}`);
    }

    return {
      error: null,
      success: true,
    };
  } catch (error) {
    const errorResult = handleApiError(error);
    return {
      error: errorResult.error,
      success: false,
    };
  }
}

/**
 * Server action to get review stats for a project
 */
export async function getProjectReviewStatsAction(projectId: string) {
  try {
    const reviewService = new ReviewService();
    const stats = await reviewService.getProjectReviewStats(projectId);

    return {
      error: null,
      stats,
    };
  } catch (error) {
    const errorResult = handleApiError(error);
    return {
      error: errorResult.error,
      stats: null,
    };
  }
}
