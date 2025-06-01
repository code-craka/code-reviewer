import { createSupabaseServerClient } from "../supabase/server";
import { Provider } from "@supabase/supabase-js";
import {
  SignInCredentials,
  SignUpCredentials,
  ResetPasswordParams,
} from "@/types/auth";
import { logger } from "../utils/logger";
import { createApiError, withErrorHandling } from "../utils/error-handling";

/**
 * Service for handling authentication operations
 * Following the pattern of properly awaiting the Supabase client creation
 */

/**
 * Sign in with email and password
 */
export const signInWithEmail = withErrorHandling(
  async (credentials: SignInCredentials) => {
    try {
      // Ensure we properly await the Supabase client before using it
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        logger.error("Sign in failed", { error: error.message });
        throw createApiError(error.message, 401, "auth/sign-in-failed");
      }

      return data;
    } catch (error) {
      logger.error("Authentication error during sign in", { error });
      throw error;
    }
  },
);

/**
 * Sign up with email, password and username
 */
export const signUpWithEmail = withErrorHandling(
  async (credentials: SignUpCredentials) => {
    try {
      // Ensure we properly await the Supabase client before using it
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
        throw createApiError(error.message, 400, "auth/sign-up-failed");
      }

      return data;
    } catch (error) {
      logger.error("Authentication error during sign up", { error });
      throw error;
    }
  },
);

/**
 * Sign in with a provider (OAuth)
 */
export const signInWithOAuth = withErrorHandling(async (provider: Provider) => {
  try {
    // Ensure we properly await the Supabase client before using it
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      logger.error("OAuth sign in failed", { error: error.message, provider });
      throw createApiError(error.message, 401, "auth/oauth-failed");
    }

    return data;
  } catch (error) {
    logger.error("Authentication error during OAuth", { error });
    throw error;
  }
});

/**
 * Request password reset
 */
export const requestPasswordReset = withErrorHandling(
  async (params: ResetPasswordParams) => {
    try {
      // Ensure we properly await the Supabase client before using it
      const supabase = await createSupabaseServerClient();

      const { error } = await supabase.auth.resetPasswordForEmail(
        params.email,
        {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
        },
      );

      if (error) {
        logger.error("Password reset request failed", { error: error.message });
        throw createApiError(error.message, 400, "auth/reset-failed");
      }

      return { success: true };
    } catch (error) {
      logger.error("Authentication error during password reset", { error });
      throw error;
    }
  },
);

/**
 * Sign out the current user
 */
export const signOut = withErrorHandling(async () => {
  try {
    // Ensure we properly await the Supabase client before using it
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error("Sign out failed", { error: error.message });
      throw createApiError(error.message, 500, "auth/sign-out-failed");
    }

    return { success: true };
  } catch (error) {
    logger.error("Authentication error during sign out", { error });
    throw error;
  }
});

/**
 * Get the current user session
 */
export const getCurrentSession = withErrorHandling(async () => {
  try {
    // Ensure we properly await the Supabase client before using it
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      logger.error("Get session failed", { error: error.message });
      throw createApiError(error.message, 401, "auth/session-error");
    }

    return data;
  } catch (error) {
    logger.error("Authentication error retrieving session", { error });
    throw error;
  }
});
