"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  SignInCredentials,
  SignUpCredentials,
  ResetPasswordParams,
  UpdatePasswordParams,
} from "@/types/auth";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/utils/logger";
import { redirect } from "next/navigation";

/**
 * Sign in with email and password
 */
export async function signInAction(credentials: SignInCredentials) {
  try {
    // Properly await the Supabase client before using it
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      logger.error("Sign in failed", { error: error.message });
      return { error: error.message, success: false };
    }

    return { data, success: true };
  } catch (error) {
    logger.error("Authentication error during sign in", { error });
    return {
      error: (error as Error).message || "An unexpected error occurred",
      success: false,
    };
  }
}

/**
 * Sign up with email, password and username
 */
export async function signUpAction(credentials: SignUpCredentials) {
  try {
    // Properly await the Supabase client before using it
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          username: credentials.username,
        },
      },
    });

    if (error) {
      logger.error("Sign up failed", { error: error.message });
      return { error: error.message, success: false };
    }

    // After signup, create a profile (basic info will be set by trigger function)
    revalidatePath("/login");

    return { data, success: true };
  } catch (error) {
    logger.error("Authentication error during sign up", { error });
    return {
      error: (error as Error).message || "An unexpected error occurred",
      success: false,
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOutAction() {
  try {
    // Properly await the Supabase client before using it
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error("Sign out failed", { error: error.message });
      return { error: error.message, success: false };
    }

    revalidatePath("/", "layout");
    redirect("/login");
  } catch (error) {
    logger.error("Authentication error during sign out", { error });
    return {
      error: (error as Error).message || "An unexpected error occurred",
      success: false,
    };
  }
}

/**
 * Request password reset
 */
export async function requestPasswordResetAction(params: ResetPasswordParams) {
  try {
    // Properly await the Supabase client before using it
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.resetPasswordForEmail(params.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    });

    if (error) {
      logger.error("Password reset request failed", { error: error.message });
      return { error: error.message, success: false };
    }

    return { success: true };
  } catch (error) {
    logger.error("Authentication error during password reset request", {
      error,
    });
    return {
      error: (error as Error).message || "An unexpected error occurred",
      success: false,
    };
  }
}

/**
 * Update password (for password reset)
 */
export async function updatePasswordAction(params: UpdatePasswordParams) {
  try {
    // Properly await the Supabase client before using it
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.updateUser({
      password: params.password,
    });

    if (error) {
      logger.error("Password update failed", { error: error.message });
      return { error: error.message, success: false };
    }

    return { success: true };
  } catch (error) {
    logger.error("Authentication error during password update", { error });
    return {
      error: (error as Error).message || "An unexpected error occurred",
      success: false,
    };
  }
}
