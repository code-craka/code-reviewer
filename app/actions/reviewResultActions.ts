"use server";

import prisma from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReviewResult, ActionResponse } from "@/types";
import { revalidatePath } from "next/cache";
import * as reviewResultService from "@/services/reviewResultService";
import type { ReviewResultStats } from "@/types";

/**
 * Get review results for a specific review
 */
export async function getReviewResults(
  reviewId: string,
): Promise<ActionResponse<ReviewResult[]>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    // First check if the user has access to the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        project: {
          include: {
            team: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      return { success: false, error: "Review not found" };
    }

    // Check if user has access to the project
    const isOwner = review.project.ownerId === user.id;
    const isTeamMember =
      review.project.team?.members.some(
        (member) => member.userId === user.id,
      ) || false;

    if (!isOwner && !isTeamMember) {
      return { success: false, error: "You do not have access to this review" };
    }

    // Get the review results
    const results =
      await reviewResultService.getReviewResultsByReviewId(reviewId);

    return {
      success: true,
      data: results as ReviewResult[],
    };
  } catch (error) {
    console.error("Error fetching review results:", error);
    return { success: false, error: "Failed to fetch review results" };
  }
}

/**
 * Get review results for a specific project
 */
export async function getProjectReviewResults(
  projectId: string,
): Promise<ActionResponse<ReviewResult[]>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    // First check if the user has access to the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    // Check if user has access to the project
    const isOwner = project.ownerId === user.id;
    const isTeamMember =
      project.team?.members.some((member) => member.userId === user.id) ||
      false;

    if (!isOwner && !isTeamMember) {
      return {
        success: false,
        error: "You do not have access to this project",
      };
    }

    // Get the review results
    const results =
      await reviewResultService.getReviewResultsByProjectId(projectId);

    return {
      success: true,
      data: results as ReviewResult[],
    };
  } catch (error) {
    console.error("Error fetching project review results:", error);
    return { success: false, error: "Failed to fetch project review results" };
  }
}

/**
 * Create a new review result
 */
export async function createReviewResult(
  formData: FormData,
): Promise<ActionResponse<ReviewResult>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const reviewId = formData.get("reviewId") as string;
  const projectId = formData.get("projectId") as string;
  const fileName = formData.get("fileName") as string;
  const filePath = formData.get("filePath") as string;
  const codeSnippet = formData.get("codeSnippet") as string;
  const aiModel = formData.get("aiModel") as string;
  const suggestion = formData.get("suggestion") as string;
  const lineStart = formData.get("lineStart")
    ? parseInt(formData.get("lineStart") as string)
    : undefined;
  const lineEnd = formData.get("lineEnd")
    ? parseInt(formData.get("lineEnd") as string)
    : undefined;
  // Map the form severity values to the expected service enum values
  const formSeverity = formData.get("severity") as
    | "critical"
    | "major"
    | "minor"
    | "info";
  // Map the form severity to the service severity
  let severity: "info" | "warning" | "error";
  switch (formSeverity) {
    case "critical":
      severity = "error";
      break;
    case "major":
      severity = "warning";
      break;
    case "minor":
    case "info":
    default:
      severity = "info";
      break;
  }
  // We don't need category as it's not used in the service function

  if (!reviewId || !projectId || !fileName || !suggestion) {
    return {
      success: false,
      error:
        "Missing required fields: reviewId, projectId, fileName, and suggestion are required",
    };
  }

  try {
    // Check if the user has access to the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    // Check if user has permission to create review results
    const isOwner = project.ownerId === user.id;
    const isTeamMember =
      project.team?.members.some(
        (member) =>
          member.userId === user.id &&
          ["owner", "admin", "member"].includes(member.role),
      ) || false;

    if (!isOwner && !isTeamMember) {
      return {
        success: false,
        error:
          "You do not have permission to create review results for this project",
      };
    }

    // Create the review result
    const result = await reviewResultService.createReviewResult(
      reviewId,
      user.id, // authorId
      projectId,
      fileName,
      filePath,
      codeSnippet,
      aiModel,
      suggestion,
      lineStart,
      lineEnd,
      severity,
    );

    revalidatePath(`/projects/${projectId}/reviews/${reviewId}`);

    return result;
  } catch (error) {
    console.error("Error creating review result:", error);
    return { success: false, error: "Failed to create review result" };
  }
}

/**
 * Update the status of a review result
 */
export async function updateReviewResultStatus(
  resultId: string,
  status: "open" | "fixed" | "ignored",
): Promise<ActionResponse<ReviewResult>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    // Get the review result to check permissions
    const reviewResult = await prisma.reviewResult.findUnique({
      where: { id: resultId },
      include: {
        project: {
          include: {
            team: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!reviewResult) {
      return { success: false, error: "Review result not found" };
    }

    // Check if user has access to the project
    const isOwner = reviewResult.project.ownerId === user.id;
    const isTeamMember =
      reviewResult.project.team?.members.some(
        (member) =>
          member.userId === user.id &&
          ["owner", "admin", "member"].includes(member.role),
      ) || false;

    if (!isOwner && !isTeamMember) {
      return {
        success: false,
        error: "You do not have permission to update this review result",
      };
    }

    // Update the review result status
    const result = await reviewResultService.updateReviewResultStatus(
      resultId,
      status,
      user.id,
    );

    revalidatePath(
      `/projects/${reviewResult.projectId}/reviews/${reviewResult.reviewId}`,
    );

    return result;
  } catch (error) {
    console.error("Error updating review result status:", error);
    return { success: false, error: "Failed to update review result status" };
  }
}

/**
 * Get statistics for review results by project
 */
export async function getReviewResultStats(
  projectId: string,
): Promise<ActionResponse<ReviewResultStats>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    // Check if the user has access to the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    // Check if user has access to the project
    const isOwner = project.ownerId === user.id;
    const isTeamMember =
      project.team?.members.some((member) => member.userId === user.id) ||
      false;

    if (!isOwner && !isTeamMember) {
      return {
        success: false,
        error: "You do not have access to this project",
      };
    }

    // Get the review result statistics
    return await reviewResultService.getReviewResultStats(projectId);
  } catch (error) {
    console.error("Error getting review result statistics:", error);
    return { success: false, error: "Failed to get review result statistics" };
  }
}

/**
 * Delete a review result
 */
export async function deleteReviewResult(
  resultId: string,
): Promise<ActionResponse<void>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    // Get the review result to check permissions
    const reviewResult = await prisma.reviewResult.findUnique({
      where: { id: resultId },
      include: {
        project: {
          include: {
            team: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!reviewResult) {
      return { success: false, error: "Review result not found" };
    }

    // Check if user has access to the project
    const isOwner = reviewResult.project.ownerId === user.id;
    const isTeamAdmin =
      reviewResult.project.team?.members.some(
        (member) =>
          member.userId === user.id && ["owner", "admin"].includes(member.role),
      ) || false;

    // Only project owners and team admins can delete review results
    if (!isOwner && !isTeamAdmin) {
      return {
        success: false,
        error: "You do not have permission to delete this review result",
      };
    }

    // Delete the review result
    const result = await reviewResultService.deleteReviewResult(resultId);

    revalidatePath(
      `/projects/${reviewResult.projectId}/reviews/${reviewResult.reviewId}`,
    );

    return result;
  } catch (error) {
    console.error("Error deleting review result:", error);
    return { success: false, error: "Failed to delete review result" };
  }
}
