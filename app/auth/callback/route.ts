// app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Modern Next.js Route Handler for callback
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  
  // Get the next path, default to /dashboard if not provided
  const nextPath = requestUrl.searchParams.get("next") || "/dashboard";
  
  // Log the callback for debugging
  console.log("Auth callback received:", {
    hasCode: !!code,
    error,
    errorDescription,
    nextPath,
    url: requestUrl.toString()
  });
  
  // If there's an error from the OAuth provider
  if (error) {
    console.error("OAuth provider error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    );
  }
  
  // If no code is provided, redirect to login
  if (!code) {
    console.error("No code provided in auth callback");
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("Authentication failed: No authorization code provided")}`, requestUrl.origin)
    );
  }
  
  try {
    // Use server client for auth callback handling
    const supabase = await createSupabaseServerClient();
    
    // Exchange the code for a session using the server client
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
      console.error("Session exchange error:", sessionError);
      // Redirect to login with error message
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(sessionError.message)}`, requestUrl.origin)
      );
    }
    
    // Log successful authentication
    console.log("Auth callback success:", {
      userId: data?.user?.id,
      email: data?.user?.email,
      nextPath
    });
    
    // Successfully authenticated, redirect to the next path
    const response = NextResponse.redirect(new URL(nextPath, requestUrl.origin));
    
    // Set cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (err) {
    console.error("Auth callback exception:", err);
    // Redirect to login with generic error
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("Authentication failed - please try again")}`, requestUrl.origin)
    );
  }
}
