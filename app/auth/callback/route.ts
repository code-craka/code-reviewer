// app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Modern Next.js Route Handler for callback
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/reviewer";

  if (code) {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Always redirect to intended next route or fallback
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
