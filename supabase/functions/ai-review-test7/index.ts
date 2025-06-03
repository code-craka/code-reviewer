/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Initialize Supabase client with hardcoded test values
const supabaseClient = createClient(
  'https://test.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
);

interface AIReviewRequest {
  action: 'review_code' | 'search_similar' | 'analyze_diff';
  projectId: string;
  profileId: string;
  data: {
    diffContent?: string;
    filePath?: string;
    language?: string;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const request: AIReviewRequest = await req.json();
    
    const response = {
      status: 'success',
      action: request.action,
      message: 'Using hardcoded test values for Supabase client',
      client_initialized: !!supabaseClient
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
