/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />
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
    pullRequestId?: string;
    codeSnippet?: string;
    searchQuery?: string;
    similarityThreshold?: number;
    limit?: number;
    commitMessage?: string;
    authorId?: string;
    teamId?: string;
  };
}

interface OpenAIEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// Initialize clients safely inside the handler to avoid boot errors
function createSupabaseClient() {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIMENSIONS = 1536;

async function generateEmbedding(text: string): Promise<number[]> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data: OpenAIEmbeddingResponse = await response.json();
  
  if (!data.data || data.data.length === 0) {
    throw new Error('No embedding data returned from OpenAI');
  }

  return data.data[0].embedding;
}

async function searchSimilarReviews(
  supabaseClient: any,
  projectId: string,
  embedding: number[],
  threshold: number = 0.85,
  limit: number = 5
) {
  const { data, error } = await supabaseClient.rpc('search_similar_embeddings', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
    project_filter: projectId
  });

  if (error) throw error;
  return data || [];
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, projectId, profileId, data }: AIReviewRequest = await req.json();

    if (!projectId || !profileId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: projectId and profileId' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client only when needed
    const supabaseClient = createSupabaseClient();
    
    let result: any;
    const startTime = Date.now();

    switch (action) {
      case 'review_code': {
        if (!data.diffContent) {
          throw new Error('diffContent is required for review_code action');
        }

        // Generate embedding for the diff content
        const diffEmbedding = await generateEmbedding(data.diffContent);
        
        // Search for similar reviews
        const similarReviews = await searchSimilarReviews(
          supabaseClient,
          projectId,
          diffEmbedding,
          data.similarityThreshold || 0.85,
          data.limit || 5
        );

        const processingTime = Date.now() - startTime;

        result = {
          action: 'review_code',
          similarReviews,
          cacheHit: similarReviews.length > 0,
          processingTimeMs: processingTime,
          metadata: {
            filePath: data.filePath,
            language: data.language,
            pullRequestId: data.pullRequestId,
            commitMessage: data.commitMessage
          }
        };
        break;
      }

      case 'search_similar': {
        if (!data.codeSnippet && !data.searchQuery) {
          throw new Error('Either codeSnippet or searchQuery is required for search_similar action');
        }

        const searchText = data.codeSnippet || data.searchQuery!;
        const embedding = await generateEmbedding(searchText);

        const similarReviews = await searchSimilarReviews(
          supabaseClient,
          projectId,
          embedding,
          data.similarityThreshold || 0.85,
          data.limit || 5
        );

        result = { 
          action: 'search_similar',
          similarReviews,
          searchText 
        };
        break;
      }

      case 'analyze_diff': {
        if (!data.diffContent) {
          throw new Error('diffContent is required for analyze_diff action');
        }

        // Generate embedding for diff analysis
        const diffEmbedding = await generateEmbedding(data.diffContent);
        
        // Search for similar code patterns and reviews
        const similarReviews = await searchSimilarReviews(
          supabaseClient,
          projectId,
          diffEmbedding,
          data.similarityThreshold || 0.80,
          data.limit || 10
        );

        // Additional analysis for patterns
        const patternSearchQuery = data.searchQuery || `${data.language || 'code'} patterns similar to this diff`;
        const patternEmbedding = await generateEmbedding(patternSearchQuery);
        
        const similarPatterns = await searchSimilarReviews(
          supabaseClient,
          projectId,
          patternEmbedding,
          0.75,
          5
        );

        const processingTime = Date.now() - startTime;

        result = {
          action: 'analyze_diff',
          diffAnalysis: {
            similarReviews,
            similarPatterns,
            diffSummary: {
              filePath: data.filePath,
              language: data.language,
              changeType: 'modification',
              complexityScore: similarReviews.length > 0 ? 'high' : 'low'
            }
          },
          processingTimeMs: processingTime,
          metadata: {
            pullRequestId: data.pullRequestId,
            commitMessage: data.commitMessage,
            authorId: data.authorId,
            teamId: data.teamId
          }
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('AI Review Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
