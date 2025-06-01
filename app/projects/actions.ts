"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/utils/logger";
import {
  ProjectData,
  ProjectStatus,
  ProjectVisibility,
} from "@/lib/projects/project-service";
import { ProjectFilterOptions } from "@/lib/projects/project-filter";

/**
 * Get all projects for the current user
 */
export async function getUserProjectsAction(options?: ProjectFilterOptions) {
  try {
    // Properly await the Supabase client before using it
    const supabase = await createSupabaseServerClient();

    // Get the current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      logger.error("Failed to get user session", {
        error: sessionError?.message,
      });
      return { error: "Authentication required", success: false };
    }

    const userId = session.user.id;

    // Build the query based on filter options
    const baseQuery = supabase
      .from("Project")
      .select(
        `
        *,
        team:Team(id, name),
        owner:Profile!ownerId(id, username, email, profilePictureUrl)
      `,
      )
      .eq("ownerId", userId)
      .or(`teamId.is.null,team.members.cs.{${userId}}`)
      .is("deletedAt", null);

    // Add sorting
    if (options?.sortBy) {
      const direction = options.sortDirection === "asc" ? true : false;
      baseQuery.order(options.sortBy, { ascending: direction });
    } else {
      baseQuery.order("updatedAt", { ascending: false });
    }

    // Add search filter
    if (options?.searchTerm) {
      baseQuery.or(
        `name.ilike.%${options.searchTerm}%,description.ilike.%${options.searchTerm}%`,
      );
    }

    // Add team filter
    if (options?.teamId) {
      baseQuery.eq("teamId", options.teamId);
    }

    // Add pagination
    if (options?.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      baseQuery.range(from, to);
    }

    const { data, error } = await baseQuery;

    if (error) {
      logger.error("Failed to get projects", { error: error.message });
      return { error: error.message, success: false };
    }

    // Ensure status is properly typed
    const typedData = data.map((project) => ({
      ...project,
      status: project.status as ProjectStatus,
      visibility: project.visibility as ProjectVisibility,
    }));

    return { data: typedData, success: true };
  } catch (error) {
    logger.error("Error in getUserProjectsAction", { error });
    return {
      error: (error as Error).message || "An unexpected error occurred",
      success: false,
    };
  }
}

/**
 * Get a project by ID
 */
export async function getProjectByIdAction(projectId: string) {
  try {
    // Properly await the Supabase client before using it
    const supabase = await createSupabaseServerClient();

    // Get the current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      logger.error("Failed to get user session", {
        error: sessionError?.message,
      });
      return { error: "Authentication required", success: false };
    }

    const userId = session.user.id;

    const { data, error } = await supabase
      .from("Project")
      .select(
        `
        *,
        team:Team(id, name),
        owner:Profile!ownerId(id, username, email, profilePictureUrl),
        reviews:Review(*)
      `,
      )
      .eq("id", projectId)
      .is("deletedAt", null)
      .single();

    if (error) {
      logger.error("Failed to get project", {
        error: error.message,
        projectId,
      });
      return { error: error.message, success: false };
    }

    // Check if user has access to this project
    const isOwner = data.ownerId === userId;

    let isTeamMember = false;
    if (data.teamId) {
      const { data: teamMember } = await supabase
        .from("TeamMember")
        .select("id")
        .eq("userId", userId)
        .eq("teamId", data.teamId)
        .single();

      isTeamMember = !!teamMember;
    }

    const isPublic = data.visibility === "public";

    if (!isOwner && !isTeamMember && !isPublic) {
      return {
        error: "You do not have access to this project",
        success: false,
      };
    }

    // Ensure proper typing
    return {
      data: {
        ...data,
        status: data.status as ProjectStatus,
        visibility: data.visibility as ProjectVisibility,
      },
      success: true,
    };
  } catch (error) {
    logger.error("Error in getProjectByIdAction", { error });
    return {
      error: (error as Error).message || "An unexpected error occurred",
      success: false,
    };
  }
}

/**
 * Create a new project
 */
export async function createProjectAction(data: ProjectData) {
  try {
    // Properly await the Supabase client before using it
    const supabase = await createSupabaseServerClient();

    // Get the current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      logger.error("Failed to get user session", {
        error: sessionError?.message,
      });
      return { error: "Authentication required", success: false };
    }

    const userId = session.user.id;
    const now = new Date().toISOString();

    // If teamId is provided, check if user is a member of the team
    if (data.teamId) {
      const { data: teamMember, error: teamError } = await supabase
        .from("TeamMember")
        .select("id")
        .eq("userId", userId)
        .eq("teamId", data.teamId)
        .single();

      if (teamError || !teamMember) {
        return { error: "You are not a member of this team", success: false };
      }
    }

    const { data: projectData, error } = await supabase
      .from("Project")
      .insert([
        {
          name: data.name,
          description: data.description || "",
          ownerId: userId,
          teamId: data.teamId,
          visibility: data.visibility || "private",
          status: "active",
          createdAt: now,
          updatedAt: now,
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error("Failed to create project", { error: error.message });
      return { error: error.message, success: false };
    }

    // Revalidate projects page to show the new project
    revalidatePath("/projects");

    return { data: projectData, success: true };
  } catch (error) {
    logger.error("Error in createProjectAction", { error });
    return {
      error: (error as Error).message || "An unexpected error occurred",
      success: false,
    };
  }
}

/**
 * Update a project
 */
export async function updateProjectAction(
  projectId: string,
  data: Partial<ProjectData>,
) {
  try {
    // Properly await the Supabase client before using it
    const supabase = await createSupabaseServerClient();

    // Get the current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      logger.error("Failed to get user session", {
        error: sessionError?.message,
      });
      return { error: "Authentication required", success: false };
    }

    const userId = session.user.id;

    // First check if user has permission to update
    const { data: projectData, error: fetchError } = await supabase
      .from("Project")
      .select("ownerId, teamId")
      .eq("id", projectId)
      .is("deletedAt", null)
      .single();

    if (fetchError) {
      logger.error("Failed to fetch project for update", {
        error: fetchError.message,
        projectId,
      });
      return { error: fetchError.message, success: false };
    }

    // Check if user is owner
    const isOwner = projectData.ownerId === userId;

    // Check if user is team admin
    let isTeamAdmin = false;
    if (projectData.teamId) {
      const { data: teamMember } = await supabase
        .from("TeamMember")
        .select("role")
        .eq("userId", userId)
        .eq("teamId", projectData.teamId)
        .single();

      if (teamMember) {
        // Properly cast role to ensure type safety
        const role = teamMember.role as "owner" | "admin" | "member" | "viewer";
        isTeamAdmin = role === "owner" || role === "admin";
      }
    }

    if (!isOwner && !isTeamAdmin) {
      return {
        error: "You do not have permission to update this project",
        success: false,
      };
    }

    // Update the project
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { data: updatedProject, error: updateError } = await supabase
      .from("Project")
      .update(updateData)
      .eq("id", projectId)
      .select()
      .single();

    if (updateError) {
      logger.error("Failed to update project", {
        error: updateError.message,
        projectId,
      });
      return { error: updateError.message, success: false };
    }

    // Revalidate project pages
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);

    // Ensure proper typing for status and visibility
    return {
      data: {
        ...updatedProject,
        status: updatedProject.status as ProjectStatus,
        visibility: updatedProject.visibility as ProjectVisibility,
      },
      success: true,
    };
  } catch (error) {
    logger.error("Error in updateProjectAction", { error });
    return {
      error: (error as Error).message || "An unexpected error occurred",
      success: false,
    };
  }
}

/**
 * Archive a project
 */
export async function archiveProjectAction(projectId: string) {
  try {
    // Properly await the Supabase client before using it
    const supabase = await createSupabaseServerClient();

    // Get the current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      logger.error("Failed to get user session", {
        error: sessionError?.message,
      });
      return { error: "Authentication required", success: false };
    }

    const userId = session.user.id;

    // Check permissions
    const { data: projectData, error: fetchError } = await supabase
      .from("Project")
      .select("ownerId, teamId")
      .eq("id", projectId)
      .is("deletedAt", null)
      .single();

    if (fetchError) {
      logger.error("Failed to fetch project for archiving", {
        error: fetchError.message,
        projectId,
      });
      return { error: fetchError.message, success: false };
    }

    // Check if user is owner
    const isOwner = projectData.ownerId === userId;

    // Check if user is team admin
    let isTeamAdmin = false;
    if (projectData.teamId) {
      const { data: teamMember } = await supabase
        .from("TeamMember")
        .select("role")
        .eq("userId", userId)
        .eq("teamId", projectData.teamId)
        .single();

      if (teamMember) {
        // Properly cast role to ensure type safety
        const role = teamMember.role as "owner" | "admin" | "member" | "viewer";
        isTeamAdmin = role === "owner" || role === "admin";
      }
    }

    if (!isOwner && !isTeamAdmin) {
      return {
        error: "You do not have permission to archive this project",
        success: false,
      };
    }

    // Archive the project
    const { data: archivedProject, error: updateError } = await supabase
      .from("Project")
      .update({
        status: "archived" as ProjectStatus,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select()
      .single();

    if (updateError) {
      logger.error("Failed to archive project", {
        error: updateError.message,
        projectId,
      });
      return { error: updateError.message, success: false };
    }

    // Revalidate project pages
    revalidatePath("/projects");

    return { data: archivedProject, success: true };
  } catch (error) {
    logger.error("Error in archiveProjectAction", { error });
    return {
      error: (error as Error).message || "An unexpected error occurred",
      success: false,
    };
  }
}

/**
 * Delete a project (soft delete)
 */
export async function deleteProjectAction(projectId: string) {
  try {
    // Properly await the Supabase client before using it
    const supabase = await createSupabaseServerClient();

    // Get the current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      logger.error("Failed to get user session", {
        error: sessionError?.message,
      });
      return { error: "Authentication required", success: false };
    }

    const userId = session.user.id;

    // Check if user is the owner
    const { data: projectData, error: fetchError } = await supabase
      .from("Project")
      .select("ownerId")
      .eq("id", projectId)
      .single();

    if (fetchError) {
      logger.error("Failed to fetch project for deletion", {
        error: fetchError.message,
        projectId,
      });
      return { error: fetchError.message, success: false };
    }

    // Only the owner can delete a project
    if (projectData.ownerId !== userId) {
      return {
        error: "Only the project owner can delete this project",
        success: false,
      };
    }

    // Soft delete the project
    const { error: updateError } = await supabase
      .from("Project")
      .update({
        status: "deleted" as ProjectStatus,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (updateError) {
      logger.error("Failed to delete project", {
        error: updateError.message,
        projectId,
      });
      return { error: updateError.message, success: false };
    }

    // Revalidate projects page
    revalidatePath("/projects");

    return { success: true };
  } catch (error) {
    logger.error("Error in deleteProjectAction", { error });
    return {
      error: (error as Error).message || "An unexpected error occurred",
      success: false,
    };
  }
}
