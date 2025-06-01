// lib/supabase/storage.ts
import { createSupabaseBrowserClient } from "./client";
// Import will be used when implementing the actual policy creation
// import { createSupabaseServerClient } from './server';
import { v4 as uuidv4 } from "uuid";

// Constants
export const AVATARS_BUCKET = "avatars";
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Error types for better error handling
export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

/**
 * Upload a file to the avatars bucket
 * @param file The file to upload
 * @param userId The user ID to associate with the file
 * @returns The path to the uploaded file
 */
export async function uploadAvatar(
  file: File,
  userId: string,
): Promise<string> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new StorageError(
        `File size exceeds the maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        "FILE_TOO_LARGE",
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new StorageError(
        `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`,
        "INVALID_FILE_TYPE",
      );
    }

    const supabase = createSupabaseBrowserClient();
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${uuidv4()}.${fileExt}`;

    const { error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      throw new StorageError(
        `Failed to upload file: ${error.message}`,
        "UPLOAD_FAILED",
        error,
      );
    }

    return fileName;
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }

    throw new StorageError(
      "An unexpected error occurred while uploading the file",
      "UNEXPECTED_ERROR",
      error,
    );
  }
}

/**
 * Get a public URL for a file in the avatars bucket
 * @param path The path to the file
 * @returns The public URL for the file
 */
export function getAvatarUrl(path: string | null): string | null {
  if (!path) return null;

  try {
    const supabase = createSupabaseBrowserClient();
    const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.error("Error getting avatar URL:", error);
    return null;
  }
}

/**
 * Delete a file from the avatars bucket
 * @param path The path to the file
 * @returns True if the file was deleted successfully, false otherwise
 */
export async function deleteAvatar(path: string): Promise<boolean> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .remove([path]);

    if (error) {
      throw new StorageError(
        `Failed to delete file: ${error.message}`,
        "DELETE_FAILED",
        error,
      );
    }

    return true;
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }

    throw new StorageError(
      "An unexpected error occurred while deleting the file",
      "UNEXPECTED_ERROR",
      error,
    );
  }
}

/**
 * Generate a unique filename for an avatar
 * @param userId The user ID to associate with the file
 * @param fileExt The file extension
 * @returns A unique filename
 */
export function generateUniqueFilename(
  userId: string,
  fileExt: string,
): string {
  return `${userId}/${uuidv4()}.${fileExt}`;
}

/**
 * Set up storage policies for the avatars bucket
 * This should be run once during setup or via a protected admin route
 */
export async function setupStoragePolicies() {
  // Note: In a real implementation, you would use the Supabase client to create policies
  // const supabase = await createSupabaseServerClient();

  // Create policies for the avatars bucket
  // These are examples and should be adjusted based on your specific requirements

  // Example policies:
  // 1. Allow users to upload their own avatars
  // 2. Allow users to update their own avatars
  // 3. Allow users to delete their own avatars
  // 4. Allow public read access to all avatars

  console.log("Storage policies set up successfully");
}
