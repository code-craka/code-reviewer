import {
  createSupabaseServerClient,
  createSupabaseServerAdminClient,
} from "../supabase/server";
import { logger } from "../utils/logger";
import { createApiError, withErrorHandling } from "../utils/error-handling";

/**
 * Profile data structure returned from the database
 */
export interface Profile {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  username: string | null;
  bio: string | null;
  profilePictureUrl: string | null;
  email: string | null;
}

interface ProfileUpdateData {
  username?: string;
  bio?: string;
  profilePictureUrl?: string;
}

/**
 * Get a user profile by ID
 */
export const getProfileById = withErrorHandling(async (profileId: string) => {
  try {
    // Ensure we properly await the Supabase client before using it
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("Profile")
      .select("*")
      .eq("id", profileId)
      .single();

    if (error) {
      logger.error("Failed to get profile", {
        error: error.message,
        profileId,
      });
      throw createApiError(error.message, 404, "profile/not-found");
    }

    return data;
  } catch (error) {
    logger.error("Error retrieving profile", { error });
    throw error;
  }
});

/**
 * Create a new profile for a user
 * (Usually called right after signup)
 */
export const getUserProfile = withErrorHandling(async (userId: string) => {
  try {
    // For admin operations, use the admin client
    const supabase = await createSupabaseServerAdminClient();

    // First check if profile already exists
    const { data: existingProfile } = await supabase
      .from("Profile")
      .select("id")
      .eq("id", userId)
      .single();

    if (existingProfile) {
      return existingProfile;
    }

    // Extract username from user metadata or email
    const username =
      userId.split("@")[0] ||
      `user_${userId.substring(0, 8)}`;

    const { data, error } = await supabase
      .from("Profile")
      .insert([
        {
          id: userId,
          email: userId,
          username,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error("Failed to create profile", {
        error: error.message,
        userId,
      });
      throw createApiError(error.message, 500, "profile/creation-failed");
    }

    return data;
  } catch (error) {
    logger.error("Error creating profile", { error });
    throw error;
  }
});

/**
 * Update a user profile
 */
export const updateProfile = withErrorHandling(async (profileId: string, profileData: ProfileUpdateData) => {
  try {
    // Ensure we properly await the Supabase client before using it
    const supabase = await createSupabaseServerClient();

    // Add updated timestamp
    const updateData = {
      ...profileData,
      updatedAt: new Date().toISOString(),
    };

      const { data, error } = await supabase
        .from("Profile")
        .update(updateData)
        .eq("id", profileId)
        .select()
        .single();

      if (error) {
        logger.error("Failed to update profile", {
          error: error.message,
          profileId,
        });
        throw createApiError(error.message, 500, "profile/update-failed");
      }

      return data;
    } catch (error) {
      logger.error("Error updating profile", { error });
      throw error;
    }
  },
) as (...args: unknown[]) => Promise<{ data?: Profile; error?: string; success: boolean }>;

/**
 * Upload a profile picture
 */
export const uploadProfilePicture = withErrorHandling(
  async (profileId: string, file: File) => {
    try {
      // Ensure we properly await the Supabase client before using it
      const supabase = await createSupabaseServerClient();

      // Generate a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${profileId}-${Date.now()}.${fileExt}`;

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        logger.error("Failed to upload profile picture", {
          error: uploadError.message,
          profileId,
        });
        throw createApiError(uploadError.message, 500, "profile/upload-failed");
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(fileName);

      // Update the profile with the new picture URL
      const { data: profileData, error: profileError } = await supabase
        .from("Profile")
        .update({
          profilePictureUrl: urlData.publicUrl,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", profileId)
        .select()
        .single();

      if (profileError) {
        logger.error("Failed to update profile with picture URL", {
          error: profileError.message,
          profileId,
        });
        throw createApiError(
          profileError.message,
          500,
          "profile/update-failed",
        );
      }

      return profileData;
    } catch (error) {
      logger.error("Error uploading profile picture", { error });
      throw error;
    }
  },
) as (...args: unknown[]) => Promise<{ data?: Profile; error?: string; success: boolean }>;
