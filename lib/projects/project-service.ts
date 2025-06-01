import { createSupabaseServerClient } from "../supabase/server";
import { logger } from "../utils/logger";
import { createApiError, withErrorHandling } from "../utils/error-handling";
import { ProjectFilterOptions, buildProjectQuery } from "./project-filter";

// Ensuring proper typing for enums as mentioned in our type fixes
export type ProjectStatus = "active" | "archived" | "deleted";
export type ProjectVisibility = "private" | "team" | "public";

export interface ProjectData {
  name: string;
  description?: string;
  teamId?: string;
  visibility?: ProjectVisibility;
  status?: ProjectStatus;
}

/**
 * Get all projects for a user
 */
export const getUserProjects = withErrorHandling(
  async (userId: string, options?: ProjectFilterOptions) => {
    try {
      // Ensure we properly await the Supabase client before using it
      const supabase = await createSupabaseServerClient();

      // Build the query based on filter options
      const queryOptions = options
        ? buildProjectQuery(options)
        : { orderBy: { updatedAt: "desc" } };

      // Add user filter - get projects where user is owner or member
      let query = supabase
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

      // Apply ordering from queryOptions if available
      if (queryOptions.orderBy) {
        const orderField = Object.keys(queryOptions.orderBy)[0];
        const orderDirection =
          (queryOptions.orderBy as Record<string, string>)[orderField] === "desc" ? false : true;
        query = query.order(orderField, { ascending: orderDirection });
      } else {
        query = query.order("updatedAt", { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        logger.error("Failed to get user projects", {
          error: error.message,
          userId,
        });
        throw createApiError(error.message, 500, "projects/fetch-failed");
      }

      // Ensure the status field is correctly typed as 'active' | 'archived' | 'deleted'
      return data.map((project) => ({
        ...project,
        status: project.status as ProjectStatus,
      }));
    } catch (error) {
      logger.error("Error retrieving projects", { error });
      throw error;
    }
  },
);

/**
 * Get a project by ID
 */
export const getProjectById = withErrorHandling(
  async (projectId: string, userId: string) => {
    try {
      // Ensure we properly await the Supabase client before using it
      const supabase = await createSupabaseServerClient();

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
        throw createApiError(error.message, 404, "project/not-found");
      }

      // Check if user has access to this project
      const isOwner = data.ownerId === userId;
      const isTeamMember =
        data.teamId && (await isUserInTeam(userId, data.teamId));
      const isPublic = data.visibility === "public";

      if (!isOwner && !isTeamMember && !isPublic) {
        throw createApiError(
          "You do not have access to this project",
          403,
          "project/access-denied",
        );
      }

      // Ensure the status and visibility fields are correctly typed
      return {
        ...data,
        status: data.status as ProjectStatus,
        visibility: data.visibility as ProjectVisibility,
      };
    } catch (error) {
      logger.error("Error retrieving project", { error });
      throw error;
    }
  },
);

/**
 * Create a new project
 */
export const createProject = withErrorHandling(
  async (data: ProjectData, userId: string) => {
    try {
      // Ensure we properly await the Supabase client before using it
      const supabase = await createSupabaseServerClient();

      const now = new Date().toISOString();

      const { data: projectData, error } = await supabase
        .from("Project")
        .insert([
          {
            name: data.name,
            description: data.description || "",
            ownerId: userId,
            teamId: data.teamId,
            visibility: data.visibility || "private",
            status: "active" as ProjectStatus,
            createdAt: now,
            updatedAt: now,
          },
        ])
        .select()
        .single();

      if (error) {
        logger.error("Failed to create project", {
          error: error.message,
          userId,
        });
        throw createApiError(error.message, 500, "project/creation-failed");
      }

      return projectData;
    } catch (error) {
      logger.error("Error creating project", { error });
      throw error;
    }
  },
);

/**
 * Update a project
 */
export const updateProject = withErrorHandling(
  async (projectId: string, data: Partial<ProjectData>, userId: string) => {
    try {
      // Ensure we properly await the Supabase client before using it
      const supabase = await createSupabaseServerClient();

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
        throw createApiError(fetchError.message, 404, "project/not-found");
      }

      const isOwner = projectData.ownerId === userId;
      const isTeamAdmin =
        projectData.teamId &&
        (await isUserTeamAdmin(userId, projectData.teamId));

      if (!isOwner && !isTeamAdmin) {
        throw createApiError(
          "You do not have permission to update this project",
          403,
          "project/permission-denied",
        );
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
        throw createApiError(updateError.message, 500, "project/update-failed");
      }

      // Ensure the status and visibility fields are correctly typed
      return {
        ...updatedProject,
        status: updatedProject.status as ProjectStatus,
        visibility: updatedProject.visibility as ProjectVisibility,
      };
    } catch (error) {
      logger.error("Error updating project", { error });
      throw error;
    }
  },
);

/**
 * Archive a project (soft delete)
 */
export const archiveProject = withErrorHandling(
  async (projectId: string, userId: string) => {
    try {
      // Ensure we properly await the Supabase client before using it
      const supabase = await createSupabaseServerClient();

      // First check if user has permission
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
        throw createApiError(fetchError.message, 404, "project/not-found");
      }

      const isOwner = projectData.ownerId === userId;
      const isTeamAdmin =
        projectData.teamId &&
        (await isUserTeamAdmin(userId, projectData.teamId));

      if (!isOwner && !isTeamAdmin) {
        throw createApiError(
          "You do not have permission to archive this project",
          403,
          "project/permission-denied",
        );
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
        throw createApiError(
          updateError.message,
          500,
          "project/archive-failed",
        );
      }

      return archivedProject;
    } catch (error) {
      logger.error("Error archiving project", { error });
      throw error;
    }
  },
);

/**
 * Delete a project (hard delete)
 */
export const deleteProject = withErrorHandling(
  async (projectId: string, userId: string) => {
    try {
      // Ensure we properly await the Supabase client before using it
      const supabase = await createSupabaseServerClient();

      // First check if user has permission
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
        throw createApiError(fetchError.message, 404, "project/not-found");
      }

      // Only the owner can delete a project
      if (projectData.ownerId !== userId) {
        throw createApiError(
          "Only the project owner can delete this project",
          403,
          "project/permission-denied",
        );
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
        throw createApiError(updateError.message, 500, "project/delete-failed");
      }

      return { success: true };
    } catch (error) {
      logger.error("Error deleting project", { error });
      throw error;
    }
  },
);

// Helper functions
async function isUserInTeam(userId: string, teamId: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("TeamMember")
      .select("id")
      .eq("userId", userId)
      .eq("teamId", teamId)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function isUserTeamAdmin(
  userId: string,
  teamId: string,
): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("TeamMember")
      .select("role")
      .eq("userId", userId)
      .eq("teamId", teamId)
      .single();

    if (error || !data) {
      return false;
    }

    // Properly cast role to UserRole type to ensure type safety
    const role = data.role as "owner" | "admin" | "member" | "viewer";
    return role === "owner" || role === "admin";
  } catch {
    return false;
  }
}
