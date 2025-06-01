// Service for project settings operations
import prisma from "@/lib/prisma";
import { ProjectSettings, ActionResponse } from "@/types";

/**
 * Get settings for a specific project
 */
export async function getProjectSettings(
  projectId: string,
): Promise<ProjectSettings | null> {
  try {
    const settings = await prisma.projectSettings.findUnique({
      where: { projectId },
    });

    if (settings) {
      return {
        ...settings,
        reviewDepth: settings.reviewDepth as
          | "basic"
          | "standard"
          | "comprehensive",
      } as ProjectSettings;
    }

    return null;
  } catch (error) {
    console.error("Error fetching project settings:", error);
    return null;
  }
}

/**
 * Create or update project settings
 */
export async function createOrUpdateProjectSettings(
  projectId: string,
  data: {
    aiModel: string;
    codeLanguages: string[];
    reviewDepth: "basic" | "standard" | "comprehensive";
    autoReviewEnabled: boolean;
  },
): Promise<ActionResponse<ProjectSettings>> {
  try {
    // Check if settings already exist
    const existingSettings = await prisma.projectSettings.findUnique({
      where: { projectId },
    });

    let settings;

    if (existingSettings) {
      // Update existing settings
      settings = await prisma.projectSettings.update({
        where: { id: existingSettings.id },
        data,
      });
    } else {
      // Create new settings
      settings = await prisma.projectSettings.create({
        data: {
          projectId,
          ...data,
        },
      });
    }

    return {
      success: true,
      data: {
        ...settings,
        reviewDepth: settings.reviewDepth as
          | "basic"
          | "standard"
          | "comprehensive",
      } as ProjectSettings,
      message: "Project settings saved successfully",
    };
  } catch (error) {
    console.error("Error saving project settings:", error);
    return {
      success: false,
      error: "Failed to save project settings",
    };
  }
}

/**
 * Get default project settings
 */
export function getDefaultProjectSettings(): {
  aiModel: string;
  codeLanguages: string[];
  reviewDepth: "basic" | "standard" | "comprehensive";
  autoReviewEnabled: boolean;
} {
  return {
    aiModel: "GEMINI",
    codeLanguages: ["javascript", "typescript", "python", "java"],
    reviewDepth: "standard",
    autoReviewEnabled: false,
  };
}

/**
 * Toggle auto-review setting
 */
export async function toggleAutoReview(
  projectId: string,
  enabled: boolean,
): Promise<ActionResponse<ProjectSettings>> {
  try {
    // Check if settings already exist
    const existingSettings = await prisma.projectSettings.findUnique({
      where: { projectId },
    });

    let settings;

    if (existingSettings) {
      // Update existing settings
      settings = await prisma.projectSettings.update({
        where: { id: existingSettings.id },
        data: { autoReviewEnabled: enabled },
      });
    } else {
      // Create new settings with defaults and set auto-review
      const defaultSettings = getDefaultProjectSettings();
      settings = await prisma.projectSettings.create({
        data: {
          projectId,
          ...defaultSettings,
          autoReviewEnabled: enabled,
        },
      });
    }

    return {
      success: true,
      data: {
        ...settings,
        reviewDepth: settings.reviewDepth as
          | "basic"
          | "standard"
          | "comprehensive",
      } as ProjectSettings,
      message: `Auto-review ${enabled ? "enabled" : "disabled"} successfully`,
    };
  } catch (error) {
    console.error("Error toggling auto-review setting:", error);
    return {
      success: false,
      error: "Failed to update auto-review setting",
    };
  }
}
