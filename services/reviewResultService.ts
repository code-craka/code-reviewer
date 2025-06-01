// Service for review result operations
import prisma from "@/lib/prisma";
import { ReviewResult, ActionResponse, ReviewResultStats } from "@/types";
import { Prisma } from "@prisma/client";

// Type definition for database review result
type DbReviewResult = Prisma.ReviewResultGetPayload<{
  include: { author: true; review?: true }
}>;

// Type definition for review result with file stats
type ReviewResultWithFileStats = {
  id: string;
  severity: string;
  status: string;
  fileName: string;
};

/**
 * Get review results for a specific review
 */
export async function getReviewResultsByReviewId(
  reviewId: string,
): Promise<ReviewResult[]> {
  try {
    const results: DbReviewResult[] = await prisma.reviewResult.findMany({
      where: { reviewId },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      include: {
        author: true,
        review: true,
      },
    });
    return results.map((result) => ({
      ...result,
      severity: result.severity as "info" | "warning" | "error",
      status: result.status as "open" | "fixed" | "ignored",
    })) as ReviewResult[];
  } catch (error) {
    console.error("Error fetching review results:", error);
    return [];
  }
}

/**
 * Get review results for a specific project
 */
export async function getReviewResultsByProjectId(
  projectId: string,
): Promise<ReviewResult[]> {
  try {
    const results: DbReviewResult[] = await prisma.reviewResult.findMany({
      where: { projectId },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      include: {
        author: true,
        review: true,
      },
    });
    return results.map((result) => ({
      ...result,
      severity: result.severity as "info" | "warning" | "error",
      status: result.status as "open" | "fixed" | "ignored",
    })) as ReviewResult[];
  } catch (error) {
    console.error("Error fetching project review results:", error);
    return [];
  }
}

/**
 * Create a new review result
 */
export async function createReviewResult(
  reviewId: string,
  authorId: string,
  projectId: string,
  fileName: string,
  filePath: string,
  codeSnippet: string,
  aiModel: string,
  suggestion: string,
  lineStart?: number,
  lineEnd?: number,
  severity: "info" | "warning" | "error" = "info",
): Promise<ActionResponse<ReviewResult>> {
  try {
    const reviewResult = await prisma.reviewResult.create({
      data: {
        reviewId,
        authorId,
        projectId,
        fileName,
        filePath,
        codeSnippet,
        aiModel,
        suggestion,
        lineStart,
        lineEnd,
        severity,
      },
    });

    return {
      success: true,
      data: {
        ...reviewResult,
        severity: reviewResult.severity as "info" | "warning" | "error",
        status: reviewResult.status as "open" | "fixed" | "ignored",
      } as ReviewResult,
      message: "Review result created successfully",
    };
  } catch (error) {
    console.error("Error creating review result:", error);
    return {
      success: false,
      error: "Failed to create review result",
    };
  }
}

/**
 * Update the status of a review result
 */
export async function updateReviewResultStatus(
  resultId: string,
  status: "open" | "fixed" | "ignored",
  userId: string,
): Promise<ActionResponse<ReviewResult>> {
  try {
    const data: Record<string, unknown> = { status };

    // If marking as fixed, record who fixed it and when
    if (status === "fixed") {
      data.fixedAt = new Date();
      data.fixedByUserId = userId;
    }

    const updatedResult = await prisma.reviewResult.update({
      where: { id: resultId },
      data,
    });

    return {
      success: true,
      data: {
        ...updatedResult,
        severity: updatedResult.severity as "info" | "warning" | "error",
        status: updatedResult.status as "open" | "fixed" | "ignored",
      } as ReviewResult,
      message: `Review result marked as ${status}`,
    };
  } catch (error) {
    console.error("Error updating review result status:", error);
    return {
      success: false,
      error: "Failed to update review result status",
    };
  }
}

/**
 * Get statistics for review results by project
 */
export async function getReviewResultStats(
  projectId: string,
): Promise<ActionResponse<ReviewResultStats>> {
  try {
    const results = await prisma.reviewResult.findMany({
      where: { projectId },
      select: {
        id: true,
        severity: true,
        status: true,
        fileName: true,
      },
    });

    // Get file statistics
    const fileCountMap = new Map<string, number>();
    results.forEach((result: ReviewResultWithFileStats) => {
      const count = fileCountMap.get(result.fileName) || 0;
      fileCountMap.set(result.fileName, count + 1);
    });

    const fileStats = Array.from(fileCountMap.entries()).map(
      ([fileName, count]) => ({
        fileName,
        count,
      }),
    );

    // Calculate statistics
    const stats: ReviewResultStats = {
      totalResults: results.length,
      openCount: results.filter((r: ReviewResultWithFileStats) => r.status === "open").length,
      fixedCount: results.filter((r: ReviewResultWithFileStats) => r.status === "fixed").length,
      ignoredCount: results.filter((r: ReviewResultWithFileStats) => r.status === "ignored").length,
      severityCounts: {
        info: results.filter((r: ReviewResultWithFileStats) => r.severity === "info").length,
        warning: results.filter((r: ReviewResultWithFileStats) => r.severity === "warning").length,
        error: results.filter((r: ReviewResultWithFileStats) => r.severity === "error").length,
      },
      fileStats,
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("Error getting review result statistics:", error);
    return {
      success: false,
      error: "Failed to get review result statistics",
    };
  }
}

/**
 * Delete a review result
 */
export async function deleteReviewResult(
  resultId: string,
): Promise<ActionResponse<void>> {
  try {
    await prisma.reviewResult.delete({
      where: { id: resultId },
    });

    return {
      success: true,
      message: "Review result deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting review result:", error);
    return {
      success: false,
      error: "Failed to delete review result",
    };
  }
}
