import { createSupabaseServerClient } from "../supabase/server";
import { logger } from "../utils/logger";
import { createApiError } from "../utils/error-handling";
import {
  AIModel,
  Review,
  ReviewResult,
  ReviewSubmission,
  ReviewSeverity,
  ReviewStatus,
  ReviewDepth,
} from "@/types/ai";
import { generateReview } from "./models";
import { v4 as uuidv4 } from "uuid";

// Define available AI models
const AI_MODELS: AIModel[] = [
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "gemini",
    version: "1.0",
    size: "large",
    type: "code",
    description: "Google's most capable model optimized for code review",
    context_window: 32000,
    enabled: true,
    requires_api_key: false,
    pros: [
      "Good at code analysis",
      "Large context window",
      "Fast response times",
    ],
    cons: ["Limited to English language", "May miss complex security issues"],
  },
  {
    id: "gpt-4",
    name: "GPT-4 Turbo",
    provider: "openai",
    version: "turbo",
    size: "large",
    type: "code",
    description: "OpenAI's most advanced model with strong coding capabilities",
    context_window: 128000,
    enabled: true,
    requires_api_key: true,
    pros: [
      "Excellent at reasoning",
      "Very large context window",
      "Strong code optimization",
    ],
    cons: ["Requires API key", "Can be slow for large reviews"],
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "anthropic",
    version: "opus",
    size: "large",
    type: "code",
    description: "Anthropic's most capable model for deep code analysis",
    context_window: 200000,
    enabled: true,
    requires_api_key: true,
    pros: [
      "Excellent at reasoning",
      "Largest context window",
      "Great for security analysis",
    ],
    cons: ["Requires API key", "Higher latency than some alternatives"],
  },
];

/**
 * ReviewService class to handle all review-related operations
 */
export class ReviewService {
  /**
   * Get available AI models
   */
  async getAvailableModels(userId: string) {
    try {
      // Ensure we properly await the Supabase client before using it
      const supabase = await createSupabaseServerClient();

      // Check if user has API keys for the models that require them
      const { data: apiKeys, error } = await supabase
        .from("ApiKey")
        .select("provider")
        .eq("userId", userId);

      if (error) {
        logger.error("Failed to get API keys", {
          error: error.message,
          userId,
        });
        throw createApiError(error.message, 500, "ai/api-keys-fetch-failed");
      }

      // Create a set of providers the user has API keys for
      const userProviders = new Set(apiKeys?.map((key) => key.provider) || []);

      // Filter models based on whether they require API keys
      return AI_MODELS.map((model) => ({
        ...model,
        enabled: model.requires_api_key
          ? userProviders.has(model.provider)
          : model.enabled,
      }));
    } catch (error) {
      logger.error("Error retrieving AI models", { error });
      throw error;
    }
  }

  /**
   * Submit code for AI review
   */
  async submitReview(submission: ReviewSubmission, userId: string) {
    try {
      // Ensure we properly await the Supabase client before using it
      const supabase = await createSupabaseServerClient();

      // Validate the selected models
      const selectedModels = submission.models.filter((modelId) =>
        AI_MODELS.some((model) => model.id === modelId),
      );

      if (selectedModels.length === 0) {
        throw createApiError(
          "No valid AI models selected",
          400,
          "ai/invalid-models",
        );
      }

      // Validate the project exists and user has access
      const { data: project, error: projectError } = await supabase
        .from("Project")
        .select("id, ownerId, teamId")
        .eq("id", submission.projectId)
        .is("deletedAt", null)
        .single();

      if (projectError || !project) {
        logger.error("Project not found or access denied", {
          projectId: submission.projectId,
          userId,
        });
        throw createApiError(
          "Project not found or access denied",
          404,
          "project/not-found",
        );
      }

      // Check if user has access to the project
      const isOwner = project.ownerId === userId;

      let isTeamMember = false;
      if (project.teamId) {
        const { data: teamMember } = await supabase
          .from("TeamMember")
          .select("id")
          .eq("userId", userId)
          .eq("teamId", project.teamId)
          .single();

        isTeamMember = !!teamMember;
      }

      if (!isOwner && !isTeamMember) {
        throw createApiError(
          "You do not have access to this project",
          403,
          "project/access-denied",
        );
      }

      // Create a new review record for each model
      const now = new Date().toISOString();
      const reviewRecords = selectedModels.map((modelId) => ({
        projectId: submission.projectId,
        modelId,
        code: submission.code,
        language: submission.language || "unknown",
        fileName: submission.fileName,
        depth: submission.depth as ReviewDepth, // Ensure proper typing
        createdAt: now,
        updatedAt: now,
        userId,
      }));

      const { data: reviews, error: reviewError } = await supabase
        .from("Review")
        .insert(reviewRecords)
        .select();

      if (reviewError) {
        logger.error("Failed to create review records", {
          error: reviewError.message,
        });
        throw createApiError(
          reviewError.message,
          500,
          "review/creation-failed",
        );
      }

      // Process each review with the appropriate model
      const reviewPromises = reviews.map(async (review) => {
        try {
          // Get the model details
          const model = AI_MODELS.find((m) => m.id === review.modelId);

          if (!model) {
            throw new Error(`Model ${review.modelId} not found`);
          }

          // Generate review with the appropriate model using our centralized provider
          const aiResponse = await generateReview(
            review,
            review.depth as ReviewDepth,
          );

          // Save the review results
          const resultRecords = aiResponse.results.map((result) => ({
            ...result,
            reviewId: review.id,
            modelId: model.id,
            // Ensure proper typing for enum fields
            severity: result.severity as ReviewSeverity,
            status: result.status as ReviewStatus,
            createdAt: now,
            updatedAt: now,
            userId,
          }));

          // Insert review results
          const { error: resultsError } = await supabase
            .from("ReviewResult")
            .insert(resultRecords);

          if (resultsError) {
            logger.error("Failed to save review results", {
              error: resultsError.message,
              reviewId: review.id,
            });
            throw new Error(
              `Failed to save review results: ${resultsError.message}`,
            );
          }

          // Update the review with summary
          const { error: summaryError } = await supabase
            .from("Review")
            .update({
              summary: aiResponse.summary,
              updatedAt: new Date().toISOString(),
            })
            .eq("id", review.id);

          if (summaryError) {
            logger.error("Failed to update review summary", {
              error: summaryError.message,
              reviewId: review.id,
            });
          }

          // Return the complete review with results
          return {
            ...review,
            results: resultRecords,
            summary: aiResponse.summary,
            stats: this.calculateReviewStats(resultRecords),
          };
        } catch (error) {
          logger.error("Error processing review", {
            error,
            reviewId: review.id,
          });

          // Update the review with error status
          await supabase
            .from("Review")
            .update({
              summary: `Error: ${(error as Error).message}`,
              updatedAt: new Date().toISOString(),
            })
            .eq("id", review.id);

          // Return partial data with error information
          return {
            ...review,
            summary: `Error: ${(error as Error).message}`,
            results: [],
            stats: { info: 0, warning: 0, error: 0, total: 0 },
          };
        }
      });

      // Wait for all reviews to complete
      const reviewResults = await Promise.all(reviewPromises);

      return reviewResults;
    } catch (error) {
      logger.error("Error submitting code for review", { error });
      throw error;
    }
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewId: string) {
    try {
      // Ensure we properly await the Supabase client before using it
      const supabase = await createSupabaseServerClient();

      // Get the review with results
      const { data: review, error: reviewError } = await supabase
        .from("Review")
        .select(
          `
        *,
        project:Project(id, name, ownerId, teamId)
      `,
        )
        .eq("id", reviewId)
        .single();

      if (reviewError) {
        logger.error("Failed to get review", {
          error: reviewError.message,
          reviewId,
        });
        throw createApiError(reviewError.message, 404, "review/not-found");
      }

      // Get the current user ID from the review
      const currentUserId = review.userId;

      // Check if user has access to the project
      const isOwner = review.project.ownerId === currentUserId;

      let isTeamMember = false;
      if (review.project.teamId) {
        const { data: teamMember } = await supabase
          .from("TeamMember")
          .select("id")
          .eq("userId", currentUserId)
          .eq("teamId", review.project.teamId)
          .single();

        isTeamMember = !!teamMember;
      }

      if (!isOwner && !isTeamMember) {
        throw createApiError(
          "You do not have access to this review",
          403,
          "review/access-denied",
        );
      }

      // Get the review results
      const { data: results, error: resultsError } = await supabase
        .from("ReviewResult")
        .select("*")
        .eq("reviewId", reviewId)
        .order("severity", { ascending: false })
        .order("line", { ascending: true });

      if (resultsError) {
        logger.error("Failed to get review results", {
          error: resultsError.message,
          reviewId,
        });
        throw createApiError(
          resultsError.message,
          500,
          "review/results-fetch-failed",
        );
      }

      // Make sure to properly type the enum fields in the results
      const typedResults = results.map((result) => ({
        ...result,
        severity: result.severity as ReviewSeverity,
        status: result.status as ReviewStatus,
      }));

      // Combine and return the full review with typed fields
      return {
        ...review,
        depth: review.depth as ReviewDepth,
        results: typedResults,
        stats: this.calculateReviewStats(typedResults),
      };
    } catch (error) {
      logger.error("Error retrieving review", { error });
      throw error;
    }
  }

  /**
   * Update review result status
   */
  async updateReviewResultStatus(
    resultId: string,
    status: ReviewStatus,
    userId: string,
  ) {
    try {
      // Ensure we properly await the Supabase client before using it
      const supabase = await createSupabaseServerClient();

      // First get the result to check permissions
      const { data: result, error: resultError } = await supabase
        .from("ReviewResult")
        .select(
          `
        *,
        review:Review(projectId, userId)
      `,
        )
        .eq("id", resultId)
        .single();

      if (resultError) {
        logger.error("Failed to get review result", {
          error: resultError.message,
          resultId,
        });
        throw createApiError(
          resultError.message,
          404,
          "review-result/not-found",
        );
      }

      // Check if user has access to update this result
      if (result.review.userId !== userId) {
        // Check if user has access to the project
        const { data: project } = await supabase
          .from("Project")
          .select("ownerId, teamId")
          .eq("id", result.review.projectId)
          .single();

        const isOwner = project?.ownerId === userId;

        let isTeamMember = false;
        if (project?.teamId) {
          const { data: teamMember } = await supabase
            .from("TeamMember")
            .select("id")
            .eq("userId", userId)
            .eq("teamId", project.teamId)
            .single();

          isTeamMember = !!teamMember;
        }

        if (!isOwner && !isTeamMember) {
          throw createApiError(
            "You do not have permission to update this review result",
            403,
            "review-result/permission-denied",
          );
        }
      }

      // Update the status
      const { data: updatedResult, error: updateError } = await supabase
        .from("ReviewResult")
        .update({
          status: status,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", resultId)
        .select()
        .single();

      if (updateError) {
        logger.error("Failed to update review result status", {
          error: updateError.message,
          resultId,
        });
        throw createApiError(
          updateError.message,
          500,
          "review-result/update-failed",
        );
      }

      // Return the updated result with properly typed fields
      return {
        ...updatedResult,
        severity: updatedResult.severity as ReviewSeverity,
        status: updatedResult.status as ReviewStatus,
      };
    } catch (error) {
      logger.error("Error updating review result status", { error });
      throw error;
    }
  }

  /**
   * Create a new review record
   */
  async createReview(params: {
    code: string;
    language: string;
    fileName: string | null;
    modelId: string;
    depth: ReviewDepth;
    userId: string;
    projectId?: string;
  }) {
    try {
      const { code, language, fileName, modelId, depth, userId, projectId } =
        params;
      const supabase = await createSupabaseServerClient();

      // Create the review record
      const reviewId = uuidv4();
      const now = new Date().toISOString();

      const { data: review, error } = await supabase
        .from("Review")
        .insert({
          id: reviewId,
          code,
          language,
          fileName,
          modelId,
          depth,
          userId,
          projectId,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();

      if (error) {
        logger.error("Failed to create review", { error });
        throw createApiError(error.message, 500, "review/creation-failed");
      }

      return review as Review;
    } catch (error) {
      logger.error("Error creating review", { error });
      throw error;
    }
  }

  /**
   * Process a review with the selected AI model
   */
  async processReview(reviewId: string) {
    try {
      const supabase = await createSupabaseServerClient();

      // Get the review
      const { data: review, error } = await supabase
        .from("Review")
        .select("*")
        .eq("id", reviewId)
        .single();

      if (error) {
        logger.error("Failed to get review", { error });
        throw createApiError(error.message, 404, "review/not-found");
      }

      // Update status to processing
      await supabase
        .from("Review")
        .update({
          status: "processing",
          updatedAt: new Date().toISOString(),
        })
        .eq("id", reviewId);

      try {
        // Generate the review
        const aiResponse = await generateReview(
          review as Review,
          review.depth as ReviewDepth,
        );

        // Save the review results
        const resultRecords = aiResponse.results.map((result) => ({
          ...result,
          reviewId,
        }));

        // Insert review results
        const { error: resultsError } = await supabase
          .from("ReviewResult")
          .insert(resultRecords);

        if (resultsError) {
          logger.error("Failed to save review results", {
            error: resultsError,
          });
          throw createApiError(
            resultsError.message,
            500,
            "review/results-save-failed",
          );
        }

        // Update review with completion status and summary
        const { data: updatedReview, error: updateError } = await supabase
          .from("Review")
          .update({
            status: "completed",
            summary: aiResponse.summary,
            executionTime: aiResponse.executionTime,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", reviewId)
          .select()
          .single();

        if (updateError) {
          logger.error("Failed to update review status", {
            error: updateError,
          });
          throw createApiError(
            updateError.message,
            500,
            "review/update-failed",
          );
        }

        // Get the full results
        const { data: results } = await supabase
          .from("ReviewResult")
          .select("*")
          .eq("reviewId", reviewId)
          .order("severity", { ascending: false });

        // Return the completed review with results
        return {
          ...updatedReview,
          results: results || [],
          stats: this.calculateReviewStats(results || []),
        } as Review;
      } catch (error) {
        // Update review with error status
        await supabase
          .from("Review")
          .update({
            status: "failed",
            summary: `Error: ${(error as Error).message}`,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", reviewId);

        throw error;
      }
    } catch (error) {
      logger.error("Error processing review", { error });
      throw error;
    }
  }

  /**
   * Get all reviews for a user
   */
  async getUserReviews(userId: string, projectId?: string) {
    try {
      const supabase = await createSupabaseServerClient();

      // Build the query
      let query = supabase
        .from("Review")
        .select(
          `
          *,
          results:ReviewResult(*)
        `,
        )
        .eq("userId", userId)
        .order("createdAt", { ascending: false });

      // Filter by project if specified
      if (projectId) {
        query = query.eq("projectId", projectId);
      }

      const { data: reviews, error } = await query;

      if (error) {
        logger.error("Failed to get user reviews", { error });
        throw createApiError(error.message, 500, "review/fetch-failed");
      }

      // Process the reviews to add stats and properly type enums
      return reviews.map((review) => ({
        ...review,
        depth: review.depth as ReviewDepth,
        results: (review.results || []).map((result: unknown) => ({
          ...result,
          severity: result.severity as ReviewSeverity,
          status: result.status as ReviewStatus,
        })),
        stats: this.calculateReviewStats(review.results || []),
      })) as Review[];
    } catch (error) {
      logger.error("Error getting user reviews", { error });
      throw error;
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string, userId: string) {
    try {
      const supabase = await createSupabaseServerClient();

      // Check if the review belongs to the user
      const { data: review, error: reviewError } = await supabase
        .from("Review")
        .select("userId")
        .eq("id", reviewId)
        .single();

      if (reviewError) {
        logger.error("Failed to get review", { error: reviewError });
        throw createApiError(reviewError.message, 404, "review/not-found");
      }

      if (review.userId !== userId) {
        throw createApiError(
          "You do not have permission to delete this review",
          403,
          "review/permission-denied",
        );
      }

      // Delete the review results first
      const { error: deleteResultsError } = await supabase
        .from("ReviewResult")
        .delete()
        .eq("reviewId", reviewId);

      if (deleteResultsError) {
        logger.error("Failed to delete review results", {
          error: deleteResultsError,
        });
        throw createApiError(
          deleteResultsError.message,
          500,
          "review/results-delete-failed",
        );
      }

      // Delete the review
      const { error: deleteReviewError } = await supabase
        .from("Review")
        .delete()
        .eq("id", reviewId);

      if (deleteReviewError) {
        logger.error("Failed to delete review", { error: deleteReviewError });
        throw createApiError(
          deleteReviewError.message,
          500,
          "review/delete-failed",
        );
      }

      return { success: true };
    } catch (error) {
      logger.error("Error deleting review", { error });
      throw error;
    }
  }

  /**
   * Get project review stats
   */
  async getProjectReviewStats(projectId: string) {
    try {
      const supabase = await createSupabaseServerClient();

      // Get all reviews for the project
      const { data: reviews, error } = await supabase
        .from("Review")
        .select("id, status, createdAt")
        .eq("projectId", projectId);

      if (error) {
        logger.error("Failed to get project reviews", { error });
        throw createApiError(error.message, 500, "review/fetch-failed");
      }

      // Get all review results for the project
      const { data: results, error: resultsError } = await supabase
        .from("ReviewResult")
        .select("severity, status, reviewId")
        .in(
          "reviewId",
          reviews.map((r) => r.id),
        );

      if (resultsError) {
        logger.error("Failed to get project review results", {
          error: resultsError,
        });
        throw createApiError(
          resultsError.message,
          500,
          "review/results-fetch-failed",
        );
      }

      // Calculate stats
      const stats = {
        totalReviews: reviews.length,
        completedReviews: reviews.filter((r) => r.status === "completed")
          .length,
        failedReviews: reviews.filter((r) => r.status === "failed").length,
        issuesByStatus: {
          open: results.filter((r) => r.status === "open").length,
          fixed: results.filter((r) => r.status === "fixed").length,
          ignored: results.filter((r) => r.status === "ignored").length,
        },
        issuesBySeverity: {
          error: results.filter((r) => r.severity === "error").length,
          warning: results.filter((r) => r.severity === "warning").length,
          info: results.filter((r) => r.severity === "info").length,
        },
        totalIssues: results.length,
        reviewsByMonth: {},
      };

      // Group reviews by month
      const reviewsByMonth: Record<string, number> = {};
      reviews.forEach((review) => {
        const date = new Date(review.createdAt);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        reviewsByMonth[month] = (reviewsByMonth[month] || 0) + 1;
      });

      return {
        ...stats,
        reviewsByMonth,
      };
    } catch (error) {
      logger.error("Error getting project review stats", { error });
      throw error;
    }
  }

  /**
   * Calculate review statistics
   */
  private calculateReviewStats(results: ReviewResult[]) {
    return results.reduce(
      (stats, result) => {
        // Safely access the severity property with proper typing
        const severity = result.severity as ReviewSeverity;

        switch (severity) {
          case "info":
            stats.info += 1;
            break;
          case "warning":
            stats.warning += 1;
            break;
          case "error":
            stats.error += 1;
            break;
        }

        stats.total += 1;
        return stats;
      },
      { info: 0, warning: 0, error: 0, total: 0 },
    );
  }
}
