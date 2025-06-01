import { type NextRequest, NextResponse } from "next/server";

// Import the server client creation function from your server utility file
// This avoids the TypeScript errors with cookies implementation
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    // Use the utility function from your server file that already handles cookies correctly
    const supabase = await createSupabaseServerClient();
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(requestUrl.origin);
}