/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface AIReviewRequest {
  action: 'review_code' | 'search_similar' | 'analyze_diff';
  projectId: string;
  profileId: string;
  data: {
    // For code review
    diffContent?: string;
    filePath?: string;
    language?: string;
    pullRequestId?: string;
    
    // For similarity search
    codeSnippet?: string;
    searchQuery?: string;
    similarityThreshold?: number;
    limit?: number;
    
    // Optional context
    commitMessage?: string;
    authorId?: string;
    teamId?: string;
  };
}

interface OpenAIEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    index: number;
    embedding: number[];
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface CacheHit {
  id: string;
  similarity_score: number;
  review_content: string;
  model_used: string;
  created_at: string;
}

// Initialize Supabase client with service role
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// API Configuration
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIMENSIONS = 1536; // Updated to match database schema

// Cache and similarity thresholds
const CACHE_HIT_THRESHOLD = 0.85; // 85% similarity for cache hit
const SIMILARITY_SEARCH_THRESHOLD = 0.70; // 70% for similarity search
const MAX_SIMILAR_REVIEWS = 3;

// LLM Fallback models in priority order
const LLM_MODELS = [
  'anthropic/claude-3.5-sonnet',
  'openai/gpt-4o',
  'anthropic/claude-3-haiku'
];

/**
 * Generate embeddings using OpenAI text-embedding-3-large
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: EMBEDDING_MODEL,
        dimensions: EMBEDDING_DIMENSIONS
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data: OpenAIEmbeddingResponse = await response.json();
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No embedding data received from OpenAI');
    }

    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Perform K-NN similarity search using pgvector
 */
async function searchSimilarReviews(
  embedding: number[], 
  projectId: string, 
  threshold: number = SIMILARITY_SEARCH_THRESHOLD,
  limit: number = MAX_SIMILAR_REVIEWS
): Promise<CacheHit[]> {
  try {
    const { data, error } = await supabaseClient.rpc('search_similar_reviews', {
      query_embedding: embedding,
      project_uuid: projectId,
      similarity_threshold: threshold,
      result_limit: limit
    });

    if (error) {
      console.error('Similarity search error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in similarity search:', error);
    return [];
  }
}

/**
 * Check for cache hit based on similarity threshold
 */
async function checkCacheHit(embedding: number[], projectId: string): Promise<CacheHit | null> {
  const similarReviews = await searchSimilarReviews(embedding, projectId, CACHE_HIT_THRESHOLD, 1);
  
  if (similarReviews.length > 0 && similarReviews[0].similarity_score >= CACHE_HIT_THRESHOLD) {
    console.log(`Cache HIT! Similarity: ${similarReviews[0].similarity_score}`);
    return similarReviews[0];
  }
  
  console.log('Cache MISS - generating new review');
  return null;
}

/**
 * Generate review using LLM fallback system
 */
async function generateReviewWithFallback(
  codeContent: string,
  filePath: string,
  language: string,
  similarReviews: CacheHit[] = []
): Promise<{ content: string; model: string; tokens: number }> {
  
  // Prepare context from similar reviews
  const contextFromSimilar = similarReviews.length > 0 
    ? `\n\nSimilar reviews found for context:\n${similarReviews.map((review, idx) => 
        `${idx + 1}. (${review.similarity_score.toFixed(2)} similarity): ${review.review_content.slice(0, 200)}...`
      ).join('\n')}`
    : '';

  const prompt = `You are an expert code reviewer. Analyze the following ${language} code changes and provide a comprehensive review.

File: ${filePath}
Language: ${language}

Code to review:
\`\`\`${language}
${codeContent}
\`\`\`

${contextFromSimilar}

Please provide:
1. Overall assessment
2. Specific issues found
3. Suggestions for improvement
4. Security considerations
5. Performance implications

Focus on: correctness, maintainability, security, performance, and best practices.`;

  // Try each model in fallback order
  for (const model of LLM_MODELS) {
    try {
      console.log(`Attempting review generation with model: ${model}`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Title': 'AI Code Reviewer'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert code reviewer providing detailed, actionable feedback.'
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 2000
        }),
      });

      if (!response.ok) {
        console.warn(`Model ${model} failed: ${response.status} ${response.statusText}`);
        continue;
      }

      const data: OpenRouterResponse = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        console.log(`Successfully generated review with model: ${model}`);
        return {
          content: data.choices[0].message.content,
          model: model,
          tokens: data.usage?.total_tokens || 0
        };
      }
    } catch (error) {
      console.warn(`Model ${model} error:`, error);
      continue;
    }
  }
  
  throw new Error('All LLM models failed to generate review');
}

/**
 * Store review result with embeddings for future similarity search
 */
async function storeReviewResult(
  projectId: string,
  profileId: string,
  codeContent: string,
  filePath: string,
  language: string,
  reviewContent: string,
  embedding: number[],
  model: string,
  tokens: number,
  cacheHit: boolean
): Promise<string> {
  
  try {
    const { data, error } = await supabaseClient
      .from('cr_embeddings')
      .insert({
        project_id: projectId,
        profile_id: profileId,
        content: codeContent,
        file_path: filePath,
        language: language,
        embedding: embedding,
        review_content: reviewContent,
        model_used: model,
        tokens_used: tokens,
        cache_hit: cacheHit,
        similarity_threshold: cacheHit ? CACHE_HIT_THRESHOLD : null
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error storing review result:', error);
      throw new Error(`Error storing review result: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Update analytics
    await supabaseClient
      .from('review_analytics')
      .insert({
        project_id: projectId,
        profile_id: profileId,
        action_type: 'review_generated',
        model_used: model,
        tokens_consumed: tokens,
        cache_hit: cacheHit,
        processing_time_ms: Date.now(), // This should be calculated properly
        metadata: {
          file_path: filePath,
          language: language,
          content_length: codeContent.length
        }
      });

    return data.id;
  } catch (error) {
    console.error('Error in storeReviewResult:', error);
    throw new Error(`Error in storeReviewResult: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Main review code function
 */
async function reviewCode(request: AIReviewRequest): Promise<Response> {
  const { projectId, profileId, data } = request;
  const { diffContent, filePath, language } = data;

  if (!diffContent || !filePath || !language) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: diffContent, filePath, language' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const startTime = Date.now();
    
    // Step 1: Generate embedding for the code content
    console.log('Generating embedding for code content...');
    const embedding = await generateEmbedding(diffContent);
    
    // Step 2: Check for cache hit
    console.log('Checking for cache hit...');
    const cacheHit = await checkCacheHit(embedding, projectId);
    
    if (cacheHit) {
      // Cache hit - return cached review
      const processingTime = Date.now() - startTime;
      
      return new Response(
        JSON.stringify({
          success: true,
          cached: true,
          review: {
            id: cacheHit.id,
            content: cacheHit.review_content,
            model: cacheHit.model_used,
            similarity_score: cacheHit.similarity_score,
            processing_time_ms: processingTime
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Step 3: Search for similar reviews for context
    console.log('Searching for similar reviews for context...');
    const similarReviews = await searchSimilarReviews(embedding, projectId);
    
    // Step 4: Generate new review using LLM fallback
    console.log('Generating new review with LLM...');
    const reviewResult = await generateReviewWithFallback(
      diffContent, 
      filePath, 
      language, 
      similarReviews
    );
    
    // Step 5: Store the review result
    console.log('Storing review result...');
    const reviewId = await storeReviewResult(
      projectId,
      profileId,
      diffContent,
      filePath,
      language,
      reviewResult.content,
      embedding,
      reviewResult.model,
      reviewResult.tokens,
      false // not a cache hit
    );
    
    const processingTime = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        review: {
          id: reviewId,
          content: reviewResult.content,
          model: reviewResult.model,
          tokens_used: reviewResult.tokens,
          similar_reviews_found: similarReviews.length,
          processing_time_ms: processingTime
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in reviewCode:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process code review',
        details: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Search similar reviews function
 */
async function handleSearchSimilar(request: AIReviewRequest): Promise<Response> {
  const { projectId, data } = request;
  const { codeSnippet, searchQuery, similarityThreshold, limit } = data;

  if (!codeSnippet && !searchQuery) {
    return new Response(
      JSON.stringify({ error: 'Either codeSnippet or searchQuery is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const searchContent = codeSnippet || searchQuery;
    const embedding = await generateEmbedding(searchContent!);
    
    const similarReviews = await searchSimilarReviews(
      embedding, 
      projectId, 
      similarityThreshold || SIMILARITY_SEARCH_THRESHOLD,
      limit || MAX_SIMILAR_REVIEWS
    );

    return new Response(
      JSON.stringify({
        success: true,
        results: similarReviews,
        query: searchContent,
        threshold_used: similarityThreshold || SIMILARITY_SEARCH_THRESHOLD
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in handleSearchSimilar:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to search similar reviews',
        details: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Main Edge Function handler
 */
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

    // Route to appropriate handler based on action
    switch (request.action) {
      case 'review_code':
        return await reviewCode(request);
      
      case 'search_similar':
        return await handleSearchSimilar(request);
      
      case 'analyze_diff':
        // For now, treat analyze_diff the same as review_code
        return await reviewCode(request);
      
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${request.action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
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
