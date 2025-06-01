"use server";

import prisma from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProjectSettings, ActionResponse } from "@/types";
import { revalidatePath } from "next/cache";
import * as projectSettingsService from "@/services/projectSettingsService";

/**
 * Get settings for a specific project
 */
export async function getProjectSettings(
  projectId: string,
): Promise<ActionResponse<ProjectSettings | null>> {
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

    // Get the project settings
    const settings = await projectSettingsService.getProjectSettings(projectId);

    return {
      success: true,
      data: settings,
    };
  } catch (error) {
    console.error("Error fetching project settings:", error);
    return { success: false, error: "Failed to fetch project settings" };
  }
}

/**
 * Update project settings
 */
export async function updateProjectSettings(
  formData: FormData,
): Promise<ActionResponse<ProjectSettings>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const projectId = formData.get("projectId") as string;
  const aiModel = formData.get("aiModel") as string;
  const reviewDepth = formData.get("reviewDepth") as
    | "basic"
    | "standard"
    | "comprehensive";
  const autoReviewEnabled = formData.get("autoReviewEnabled") === "true";

  // Handle code languages as an array
  const codeLanguagesString = formData.get("codeLanguages") as string;
  const codeLanguages = codeLanguagesString
    ? codeLanguagesString.split(",").map((lang) => lang.trim())
    : [];

  if (!projectId || !aiModel || !reviewDepth) {
    return {
      success: false,
      error:
        "Missing required fields: projectId, aiModel, and reviewDepth are required",
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

    // Check if user has permission to update project settings
    const isOwner = project.ownerId === user.id;
    const isTeamAdmin =
      project.team?.members.some(
        (member) =>
          member.userId === user.id && ["owner", "admin"].includes(member.role),
      ) || false;

    if (!isOwner && !isTeamAdmin) {
      return {
        success: false,
        error: "You do not have permission to update project settings",
      };
    }

    // Update the project settings
    const result = await projectSettingsService.createOrUpdateProjectSettings(
      projectId,
      {
        aiModel,
        codeLanguages,
        reviewDepth,
        autoReviewEnabled,
      },
    );

    revalidatePath(`/projects/${projectId}/settings`);
    revalidatePath(`/projects/${projectId}`);

    return result;
  } catch (error) {
    console.error("Error updating project settings:", error);
    return { success: false, error: "Failed to update project settings" };
  }
}

/**
 * Toggle auto-review setting
 */
export async function toggleAutoReview(
  projectId: string,
  enabled: boolean,
): Promise<ActionResponse<ProjectSettings>> {
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

    // Check if user has permission to update project settings
    const isOwner = project.ownerId === user.id;
    const isTeamAdmin =
      project.team?.members.some(
        (member) =>
          member.userId === user.id && ["owner", "admin"].includes(member.role),
      ) || false;

    if (!isOwner && !isTeamAdmin) {
      return {
        success: false,
        error: "You do not have permission to update project settings",
      };
    }

    // Toggle the auto-review setting
    const result = await projectSettingsService.toggleAutoReview(
      projectId,
      enabled,
    );

    revalidatePath(`/projects/${projectId}/settings`);
    revalidatePath(`/projects/${projectId}`);

    return result;
  } catch (error) {
    console.error("Error toggling auto-review setting:", error);
    return { success: false, error: "Failed to update auto-review setting" };
  }
}
