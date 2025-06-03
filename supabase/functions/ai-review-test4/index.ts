import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

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
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Check if they are valid URLs/keys
    let supabaseUrlValid = false;
    let serviceRoleKeyValid = false;
    
    try {
      new URL(supabaseUrl);
      supabaseUrlValid = true;
    } catch {
      supabaseUrlValid = false;
    }
    
    serviceRoleKeyValid = serviceRoleKey.length > 0 && serviceRoleKey.startsWith('eyJ');
    
    // Only try to create client if both are valid
    let clientCreated = false;
    let clientError = '';
    
    if (supabaseUrlValid && serviceRoleKeyValid) {
      try {
        const supabaseClient = createClient(supabaseUrl, serviceRoleKey);
        clientCreated = !!supabaseClient;
      } catch (error) {
        clientError = error instanceof Error ? error.message : String(error);
      }
    }
    
    const response = {
      status: 'success',
      action: request.action,
      message: 'Environment and client check',
      env_check: {
        url_exists: !!supabaseUrl,
        url_valid: supabaseUrlValid,
        url_starts_with: supabaseUrl.substring(0, 10),
        key_exists: !!serviceRoleKey,
        key_valid: serviceRoleKeyValid,
        key_starts_with: serviceRoleKey.substring(0, 10),
        client_created: clientCreated,
        client_error: clientError
      }
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
