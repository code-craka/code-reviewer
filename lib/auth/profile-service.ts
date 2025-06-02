import { logger } from "../utils/logger";
import { createApiError, withErrorHandling } from "../utils/error-handling";
import prisma from "../prisma";
import { emailService } from "../email/email-service";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server";
import type { Profile } from "@/types";

/**
 * Profile update data structure
 */
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
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      logger.error("Profile not found", { profileId });
      throw createApiError("Profile not found", 404, "profile/not-found");
    }

    return profile as Profile;
  } catch (error) {
    logger.error("Error retrieving profile", { error });
    throw error;
  }
});

/**
 * Create or get a user profile
 * This is the main function to ensure a profile exists for a user
 */
export const createOrGetProfile = withErrorHandling(async (user: User) => {
  try {
    // First check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { id: user.id },
    });

    if (existingProfile) {
      return existingProfile as Profile;
    }

    // Extract user data from auth record
    const email = user.email || user.user_metadata?.email || '';
    const username = 
      user.user_metadata?.user_name ||
      user.user_metadata?.preferred_username ||
      user.user_metadata?.name ||
      (email ? email.split('@')[0] : `user_${user.id.slice(0, 8)}`);
    
    const profilePictureUrl = 
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture;

    // Create the profile
    const profile = await prisma.profile.create({
      data: {
        id: user.id,
        email: email,
        username: username,
        profilePictureUrl: profilePictureUrl,
        bio: null,
      },
    });

    logger.info('Created profile for user', { userId: user.id, username });

    // Send welcome email if email is available
    if (email && process.env.RESEND_API_KEY) {
      try {
        await emailService.sendWelcomeEmail({
          username: username,
          email: email,
        });
        logger.info('Welcome email sent', { email });
      } catch (emailError) {
        logger.warn('Failed to send welcome email', { error: emailError });
        // Don't fail the whole process if email fails
      }
    }

    return profile as Profile;
  } catch (error) {
    logger.error("Error creating or getting profile", { error });
    throw error;
  }
});

/**
 * Legacy function name for backward compatibility
 */
export const getUserProfile = createOrGetProfile;

/**
 * Update a user profile
 */
export const updateProfile = withErrorHandling(async (profileId: string, profileData: ProfileUpdateData) => {
  try {
    const profile = await prisma.profile.update({
      where: { id: profileId },
      data: {
        ...profileData,
        updatedAt: new Date(),
      },
    });

    return profile as Profile;
  } catch (error) {
    logger.error("Error updating profile", { error });
    throw error;
  }
});

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
        .from("avatars")
        .upload(`${profileId}/${fileName}`, file, {
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
        .from("avatars")
        .getPublicUrl(`${profileId}/${fileName}`);

      // Update the profile with the new picture URL using Prisma
      const profile = await prisma.profile.update({
        where: { id: profileId },
        data: {
          profilePictureUrl: urlData.publicUrl,
          updatedAt: new Date(),
        },
      });

      return profile as Profile;
    } catch (error) {
      logger.error("Error uploading profile picture", { error });
      throw error;
    }
  }
);
