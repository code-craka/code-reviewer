/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />
import { corsHeaders } from "../_shared/cors.ts";

interface AIReviewRequest {
  action: 'review_code' | 'search_similar' | 'analyze_diff' | 'generate_embedding';
  projectId: string;
  profileId: string; 
  data: {
    diffContent?: string;
    filePath?: string;
    language?: string;
    content?: string;
    searchQuery?: string;
    contextData?: any;
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

interface ReviewAnalytics {
  requestId: string;
  projectId: string;
  profileId: string;
  action: string;
  processingTimeMs: number;
  embeddingDimensions?: number;
  cacheHit?: boolean;
  similarReviewsCount?: number;
  metadata?: any;
}

const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIMENSIONS = 1536;

// Lazy Supabase client getter to avoid boot-time initialization
function getSupabaseClient() {
  const { createClient } = require('jsr:@supabase/supabase-js@2');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

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

async function searchSimilarEmbeddings(embedding: number[], projectId: string, threshold: number = 0.8, limit: number = 10) {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.rpc('search_similar_embeddings', {
      query_embedding: embedding,
      project_id: projectId,
      similarity_threshold: threshold,
      match_count: limit
    });

    if (error) {
      console.error('Similarity search error:', error);
      return { results: [], cacheHit: false, count: 0 };
    }

    return {
      results: data || [],
      cacheHit: data && data.length > 0,
      count: data ? data.length : 0
    };
  } catch (error) {
    console.error('Similarity search failed:', error);
    return { results: [], cacheHit: false, count: 0 };
  }
}

async function storeEmbedding(projectId: string, profileId: string, content: string, embedding: number[], metadata: any) {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('cr_embeddings')
      .insert({
        project_id: projectId,
        profile_id: profileId,
        content,
        embedding,
        metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Store embedding error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Store embedding failed:', error);
    return null;
  }
}

async function recordAnalytics(analytics: ReviewAnalytics) {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('review_analytics')
      .insert({
        request_id: analytics.requestId,
        project_id: analytics.projectId,
        profile_id: analytics.profileId,
        action: analytics.action,
        processing_time_ms: analytics.processingTimeMs,
        embedding_dimensions: analytics.embeddingDimensions,
        cache_hit: analytics.cacheHit,
        similar_reviews_count: analytics.similarReviewsCount,
        metadata: analytics.metadata,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Analytics recording error:', error);
    }

    return data;
  } catch (error) {
    console.error('Analytics recording failed:', error);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const startTime = Date.now();

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

    let result: any;
    let analytics: Partial<ReviewAnalytics> = {
      requestId,
      projectId,
      profileId,
      action
    };

    switch (action) {
      case 'generate_embedding': {
        if (!data.content) {
          throw new Error('content is required for generate_embedding action');
        }

        const embedding = await generateEmbedding(data.content);
        const processingTime = Date.now() - startTime;
        
        // Store embedding if requested
        let storedEmbedding = null;
        if (data.contextData?.store) {
          storedEmbedding = await storeEmbedding(projectId, profileId, data.content, embedding, data.contextData);
        }
        
        result = {
          action: 'generate_embedding',
          embedding,
          dimensions: EMBEDDING_DIMENSIONS,
          model: EMBEDDING_MODEL,
          processingTimeMs: processingTime,
          stored: !!storedEmbedding
        };

        analytics = {
          ...analytics,
          processingTimeMs: processingTime,
          embeddingDimensions: EMBEDDING_DIMENSIONS,
          metadata: { contentLength: data.content.length, stored: !!storedEmbedding }
        };
        break;
      }

      case 'search_similar': {
        if (!data.searchQuery) {
          throw new Error('searchQuery is required for search_similar action');
        }

        const searchEmbedding = await generateEmbedding(data.searchQuery);
        const similarityResults = await searchSimilarEmbeddings(searchEmbedding, projectId);
        const processingTime = Date.now() - startTime;

        result = {
          action: 'search_similar',
          searchQuery: data.searchQuery,
          embedding: searchEmbedding,
          similarResults: similarityResults.results,
          cacheHit: similarityResults.cacheHit,
          similarCount: similarityResults.count,
          processingTimeMs: processingTime
        };

        analytics = {
          ...analytics,
          processingTimeMs: processingTime,
          embeddingDimensions: EMBEDDING_DIMENSIONS,
          cacheHit: similarityResults.cacheHit,
          similarReviewsCount: similarityResults.count,
          metadata: { searchQueryLength: data.searchQuery.length }
        };
        break;
      }

      case 'review_code': {
        if (!data.diffContent) {
          throw new Error('diffContent is required for review_code action');
        }

        // Generate embedding for the diff content
        const diffEmbedding = await generateEmbedding(data.diffContent);
        
        // Search for similar reviews
        const similarityResults = await searchSimilarEmbeddings(diffEmbedding, projectId);
        
        const processingTime = Date.now() - startTime;

        // Store the diff embedding for future similarity searches
        const embeddingMetadata = {
          filePath: data.filePath,
          language: data.language,
          type: 'code_review',
          diffSize: data.diffContent.length
        };

        const storedEmbedding = await storeEmbedding(projectId, profileId, data.diffContent, diffEmbedding, embeddingMetadata);

        result = {
          action: 'review_code',
          embedding: diffEmbedding,
          similarReviews: similarityResults.results,
          cacheHit: similarityResults.cacheHit,
          similarCount: similarityResults.count,
          metadata: {
            filePath: data.filePath,
            language: data.language,
            diffContentLength: data.diffContent.length,
            stored: !!storedEmbedding
          },
          processingTimeMs: processingTime
        };

        analytics = {
          ...analytics,
          processingTimeMs: processingTime,
          embeddingDimensions: EMBEDDING_DIMENSIONS,
          cacheHit: similarityResults.cacheHit,
          similarReviewsCount: similarityResults.count,
          metadata: embeddingMetadata
        };
        break;
      }

      case 'analyze_diff': {
        if (!data.diffContent) {
          throw new Error('diffContent is required for analyze_diff action');
        }

        // Generate multiple embeddings for comprehensive analysis
        const diffEmbedding = await generateEmbedding(data.diffContent);
        const patternQuery = `${data.language || 'code'} patterns and structure analysis for: ${data.filePath || 'unknown file'}`;
        const patternEmbedding = await generateEmbedding(patternQuery);

        // Search for similar patterns
        const diffSimilarity = await searchSimilarEmbeddings(diffEmbedding, projectId);
        const patternSimilarity = await searchSimilarEmbeddings(patternEmbedding, projectId);

        const processingTime = Date.now() - startTime;

        result = {
          action: 'analyze_diff',
          diffAnalysis: {
            diffEmbedding,
            patternEmbedding,
            similarDiffs: diffSimilarity.results,
            similarPatterns: patternSimilarity.results,
            analysis: {
              filePath: data.filePath,
              language: data.language,
              diffSize: data.diffContent.length,
              complexity: data.diffContent.length > 500 ? 'high' : data.diffContent.length > 200 ? 'medium' : 'low',
              cacheHit: diffSimilarity.cacheHit || patternSimilarity.cacheHit,
              totalSimilarResults: diffSimilarity.count + patternSimilarity.count
            }
          },
          processingTimeMs: processingTime
        };

        analytics = {
          ...analytics,
          processingTimeMs: processingTime,
          embeddingDimensions: EMBEDDING_DIMENSIONS * 2, // Two embeddings generated
          cacheHit: diffSimilarity.cacheHit || patternSimilarity.cacheHit,
          similarReviewsCount: diffSimilarity.count + patternSimilarity.count,
          metadata: {
            filePath: data.filePath,
            language: data.language,
            complexity: result.diffAnalysis.analysis.complexity
          }
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Record analytics
    await recordAnalytics(analytics as ReviewAnalytics);

    return new Response(
      JSON.stringify({
        success: true,
        requestId,
        data: result
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('AI Review Production Error:', error);
    
    // Record error analytics
    await recordAnalytics({
      requestId,
      projectId: 'unknown',
      profileId: 'unknown', 
      action: 'error',
      processingTimeMs: processingTime,
      metadata: { error: error.message }
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        requestId,
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
