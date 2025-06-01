"use server";

import { revalidatePath } from "next/cache";
import { ReviewDepth, ReviewStatus } from "@/types/ai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import {
  ApiError,
  handleApiError,
} from "@/lib/utils/error-handling";
import { ReviewService } from "@/lib/ai/review-service";

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
    const session = await supabase.auth.getSession();

    if (!session?.data?.session) {
      return {
        error: "You must be logged in to create a review",
        review: null,
      };
    }

    const userId = session.data.session.user.id;
    const reviewService = new ReviewService();

    const review = await reviewService.createReview({
      code,
      language,
      fileName,
      modelId,
      depth,
      userId,
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
    return handleApiError(error as Error | ApiError, "Failed to create review");
  }
}

/**
 * Server action to process a code review with the selected AI model
 */
export async function processReviewAction(reviewId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const session = await supabase.auth.getSession();

    if (!session?.data?.session) {
      return {
        error: "You must be logged in to process a review",
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
    logger.error("Failed to process review", { error, reviewId });
    return handleApiError(
      error as Error | ApiError,
      "Failed to process review",
    );
  }
}

/**
 * Server action to get a review by its ID
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
    logger.error("Failed to get review", { error, reviewId });
    return handleApiError(error as Error | ApiError, "Failed to get review");
  }
}

/**
 * Server action to get all reviews for the current user
 */
export async function getUserReviewsAction(projectId?: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const session = await supabase.auth.getSession();

    if (!session?.data?.session) {
      return {
        error: "You must be logged in to view reviews",
        reviews: [],
      };
    }

    const userId = session.data.session.user.id;
    const reviewService = new ReviewService();

    const reviews = await reviewService.getUserReviews(userId, projectId);

    return {
      error: null,
      reviews,
    };
  } catch (error) {
    logger.error("Failed to get user reviews", { error, projectId });
    return handleApiError(
      error as Error | ApiError,
      "Failed to get user reviews",
    );
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
    const session = await supabase.auth.getSession();

    if (!session?.data?.session) {
      return {
        error: "You must be logged in to update a review result",
        success: false,
      };
    }

    const reviewService = new ReviewService();
    const userId = session.data.session.user.id;

    await reviewService.updateReviewResultStatus(resultId, status, userId);

    // We don't know the exact paths to revalidate, but we can revalidate the reviews page
    // For a more targeted revalidation, we would need to know the reviewId or projectId
    revalidatePath("/reviews");

    return {
      error: null,
      success: true,
    };
  } catch (error) {
    logger.error("Failed to update review result status", {
      error,
      resultId,
      status,
    });
    return handleApiError(
      error as Error | ApiError,
      "Failed to update review result status",
    );
  }
}

/**
 * Server action to delete a review
 */
export async function deleteReviewAction(reviewId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const session = await supabase.auth.getSession();

    if (!session?.data?.session) {
      return {
        error: "You must be logged in to delete a review",
        success: false,
      };
    }

    const userId = session.data.session.user.id;
    const reviewService = new ReviewService();

    // Check if the review belongs to the user before deleting
    const review = await reviewService.getReviewById(reviewId);
    if (review.userId !== userId) {
      return {
        error: "You do not have permission to delete this review",
        success: false,
      };
    }

    await reviewService.deleteReview(reviewId, userId);

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
    logger.error("Failed to delete review", { error, reviewId });
    return handleApiError(error as Error | ApiError, "Failed to delete review");
  }
}

/**
 * Server action to get review stats for a project
 */
export async function getProjectReviewStatsAction(projectId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const session = await supabase.auth.getSession();

    if (!session?.data?.session) {
      return {
        error: "You must be logged in to view project stats",
        stats: null,
      };
    }

    const reviewService = new ReviewService();
    const stats = await reviewService.getProjectReviewStats(projectId);

    return {
      error: null,
      stats,
    };
  } catch (error) {
    logger.error("Failed to get project review stats", { error, projectId });
    return handleApiError(
      error as Error | ApiError,
      "Failed to get project review stats",
    );
  }
}
