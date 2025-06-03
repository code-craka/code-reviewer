import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface AIReviewRequest {
  action: 'review_code' | 'search_similar' | 'analyze_diff';
  projectId: string;
  profileId: string;
  data: {
    diffContent?: string;
    filePath?: string;
    language?: string;
    codeSnippet?: string;
    searchQuery?: string;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const request: AIReviewRequest = await req.json();
    
    // Validate required fields
    if (!request.action || !request.projectId || !request.profileId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: action, projectId, profileId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Basic response based on action
    let response;
    switch (request.action) {
      case 'review_code':
        response = {
          status: 'success',
          action: 'review_code',
          message: 'Code review request received',
          data: request.data
        };
        break;
      
      case 'search_similar':
        response = {
          status: 'success',
          action: 'search_similar',
          message: 'Similarity search request received',
          data: request.data
        };
        break;
      
      case 'analyze_diff':
        response = {
          status: 'success',
          action: 'analyze_diff',
          message: 'Diff analysis request received',
          data: request.data
        };
        break;
      
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${request.action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in main handler:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
