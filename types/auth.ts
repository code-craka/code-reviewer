import { User } from "@supabase/supabase-js";

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export type AuthenticatedUser = User;

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends SignInCredentials {
  username: string;
}

export interface ResetPasswordParams {
  email: string;
}

export interface UpdatePasswordParams {
  password: string;
}

export interface VerificationParams {
  token: string;
}

// User roles (to be consistent with what we fixed in team services)
export type UserRole = "owner" | "admin" | "member" | "viewer";

// Authentication providers
export type AuthProvider = "email" | "github" | "google";
