"use server";

import prisma from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Project, ActionResponse } from "@/types/index";
import { revalidatePath } from "next/cache";
import { createOrGetProfile } from "@/lib/auth/profile-service";

export async function getUserProjects(): Promise<ActionResponse<Project[]>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  // Get or create user profile
  const profileResult = await createOrGetProfile(user);
  if (!profileResult.success || !profileResult.data) {
    return { success: false, error: "Failed to get user profile" };
  }

  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: profileResult.data.id },
      orderBy: { updatedAt: "desc" },
    });
    return { success: true, data: projects as Project[] };
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { success: false, error: "Failed to fetch projects" };
  }
}

export async function createNewProject(
  formData: FormData,
): Promise<ActionResponse<Project>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  // Get or create user profile
  const profileResult = await createOrGetProfile(user);
  if (!profileResult.success || !profileResult.data) {
    return { success: false, error: "Failed to get user profile" };
  }

  const name = formData.get("name") as string;

  if (!name || name.trim() === "") {
    return { success: false, error: "Project name is required" };
  }

  try {
    const newProject = await prisma.project.create({
      data: {
        ownerId: profileResult.data.id,
        name: name.trim(),
      },
    });
    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return {
      success: true,
      data: newProject as Project,
      message: "Project created successfully!",
    };
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, error: "Failed to create project" };
  }
}

export async function updateExistingProject(
  formData: FormData,
): Promise<ActionResponse<Project>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  // Get or create user profile
  const profileResult = await createOrGetProfile(user);
  if (!profileResult.success || !profileResult.data) {
    return { success: false, error: "Failed to get user profile" };
  }

  const projectId = formData.get("projectId") as string;
  const name = formData.get("name") as string | undefined;
  const code = formData.get("code") as string | undefined;

  const updates: Partial<Record<string, string>> = {};
  if (name && name.trim() !== "") updates.name = name.trim();
  if (typeof code === "string" && code.trim() !== "") {
    // Store code content in description field since Project model doesn't have 'code' field
    updates.description = code.trim();
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, error: "No updates provided" };
  }
  if (!projectId) {
    return { success: false, error: "Project ID is required" };
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.ownerId !== profileResult.data.id) {
      return { success: false, error: "Project not found or not authorized" };
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updates,
    });
    revalidatePath("/projects");
    revalidatePath("/dashboard");
    revalidatePath(`/reviewer?projectId=${projectId}`); // Revalidate specific project view
    revalidatePath("/reviewer"); // Revalidate general reviewer page (project list in dropdown)
    return {
      success: true,
      data: updatedProject as Project,
      message: "Project updated successfully!",
    };
  } catch (error) {
    console.error("Error updating project:", error);
    return { success: false, error: "Failed to update project" };
  }
}

export async function deleteExistingProject(
  projectId: string,
): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }
  if (!projectId) {
    return { success: false, error: "Project ID is required" };
  }

  // Get or create user profile
  const profileResult = await createOrGetProfile(user);
  if (!profileResult.success || !profileResult.data) {
    return { success: false, error: "Failed to get user profile" };
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.ownerId !== profileResult.data.id) {
      return { success: false, error: "Project not found or not authorized" };
    }

    await prisma.project.delete({
      where: { id: projectId },
    });
    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return { success: true, message: "Project deleted successfully!" };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error: "Failed to delete project" };
  }
}

export async function getProjectById(
  projectId: string,
): Promise<ActionResponse<Project>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }
  if (!projectId) {
    return { success: false, error: "Project ID is required." };
  }

  // Get or create user profile
  const profileResult = await createOrGetProfile(user);
  if (!profileResult.success || !profileResult.data) {
    return { success: false, error: "Failed to get user profile" };
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId, ownerId: profileResult.data.id }, // Ensure user owns the project
    });

    if (!project) {
      return { success: false, error: "Project not found or not authorized" };
    }
    return { success: true, data: project as Project };
  } catch (error) {
    console.error(`Error fetching project ${projectId}:`, error);
    return { success: false, error: "Failed to fetch project details" };
  }
}
