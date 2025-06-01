"use server";

import prisma from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { UserProfile, ActionResponse } from "@/types";

// Define a type for profile updates that matches Prisma's expected format
type ProfileUpdates = {
  username?: string;
  profilePictureUrl?: string | null;
  bio?: string | null;
};

// Helper function to ensure type safety when converting from form data to Prisma-compatible updates
function sanitizeUpdates(updates: Record<string, unknown>): ProfileUpdates {
  const result: ProfileUpdates = {};
  
  if (typeof updates.username === 'string') {
    result.username = updates.username;
  }
  
  if (updates.profilePictureUrl === null || typeof updates.profilePictureUrl === 'string') {
    result.profilePictureUrl = updates.profilePictureUrl;
  }
  
  if (updates.bio === null || typeof updates.bio === 'string') {
    result.bio = updates.bio;
  }
  
  return result;
}

export async function updateProfileServerAction(
  formData: FormData,
): Promise<ActionResponse<UserProfile>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const updates: Record<string, string> = {};
  const username = formData.get("username") as string;
  const profilePictureUrl = formData.get("profilePictureUrl") as string;
  const bio = formData.get("bio") as string;

  if (username) {
    updates.username = username;
  }

  if (profilePictureUrl) {
    updates.profilePictureUrl = profilePictureUrl;
  }

  if (bio) {
    updates.bio = bio;
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, error: "No updates provided" };
  }

  try {
    // Use the sanitizeUpdates function to ensure type safety
    const profileUpdates = sanitizeUpdates(updates);
    
    let profile = await prisma.profile.findUnique({ where: { id: user.id } });
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          id: user.id,
          email: user.email || "",
          username: user.email?.split("@")[0] || `user_${Date.now()}`,
          ...profileUpdates,
        },
      });
    } else {
      profile = await prisma.profile.update({
        where: { id: user.id },
        data: profileUpdates,
      });
    }

    revalidatePath("/profile");
    revalidatePath("/reviewer"); // If navbar showing profile info is on /reviewer page

    return {
      success: true,
      data: profile as UserProfile,
      message: "Profile updated successfully!",
    };
  } catch (error: unknown) {
    console.error("Error updating profile:", error);
    const prismaError = error as { code?: string; meta?: { target?: string[] } };
    if (prismaError.code === "P2002" && prismaError.meta?.target?.includes("username")) {
      return {
        success: false,
        error: "This username is already taken. Please choose another.",
      };
    }
    return { 
      success: false, 
      error: `Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}
