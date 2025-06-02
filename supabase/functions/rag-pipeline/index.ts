import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface RAGPipelineRequest {
  action: 'create_review' | 'search_similar' | 'generate_embedding' | 'complete_review';
  projectId: string;
  profileId: string;
  data: {
    // For create_review
    diffContent?: string;
    filePath?: string;
    language?: string;
    
    // For search_similar
    content?: string;
    embedding?: number[];
    similarityThreshold?: number;
    limit?: number;
    
    // For complete_review
    reviewId?: string;
    aiResponse?: string;
    model?: string;
  };
}

interface EmbeddingResponse {
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

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// OpenAI configuration
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIMENSIONS = 1536;

async function generateEmbedding(text: string): Promise<number[]> {
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

  const data: EmbeddingResponse = await response.json();
  
  if (!data.data || data.data.length === 0) {
    throw new Error('No embedding data returned from OpenAI');
  }

  return data.data[0].embedding;
}

async function createReviewRequest(
  projectId: string,
  profileId: string,
  diffContent: string,
  filePath?: string,
  language?: string
) {
  // Create diff hash for caching
  const encoder = new TextEncoder();
  const data = encoder.encode(diffContent);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const diffHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Insert review request
  const { data: reviewRequest, error } = await supabaseClient
    .from('review_requests')
    .insert({
      project_id: projectId,
      profile_id: profileId,
      diff_content: diffContent,
      diff_hash: diffHash,
      file_path: filePath,
      language,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return reviewRequest;
}

async function searchSimilarReviews(
  projectId: string,
  embedding: number[],
  similarityThreshold: number = 0.85,
  limit: number = 5
) {
  // Convert embedding to pgvector format
  const embeddingVector = `[${embedding.join(',')}]`;
  
  const { data, error } = await supabaseClient
    .from('cr_embeddings')
    .select(`
      *,
      cr_messages!inner(*)
    `)
    .eq('project_id', projectId)
    .gte('similarity_threshold', similarityThreshold)
    .order(`embedding <=> '${embeddingVector}'`)
    .limit(limit);

  if (error) throw error;
  return data;
}

async function createMessage(
  reviewId: string,
  content: string,
  messageType: 'user_input' | 'ai_response' | 'system',
  metadata?: any
) {
  const { data: message, error } = await supabaseClient
    .from('cr_messages')
    .insert({
      review_request_id: reviewId,
      content,
      message_type: messageType,
      metadata
    })
    .select()
    .single();

  if (error) throw error;
  return message;
}

async function createEmbedding(
  messageId: string,
  projectId: string,
  embedding: number[],
  contentHash: string,
  filePath?: string,
  language?: string,
  tags?: string[]
) {
  const embeddingVector = `[${embedding.join(',')}]`;
  
  const { data: embeddingRecord, error } = await supabaseClient
    .from('cr_embeddings')
    .insert({
      message_id: messageId,
      project_id: projectId,
      embedding: embeddingVector,
      content_hash: contentHash,
      file_path: filePath,
      language,
      tags
    })
    .select()
    .single();

  if (error) throw error;
  return embeddingRecord;
}

async function updateReviewStatus(
  reviewId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  cacheHit?: boolean
) {
  const updateData: any = { status };
  if (cacheHit !== undefined) {
    updateData.cache_hit = cacheHit;
  }
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseClient
    .from('review_requests')
    .update(updateData)
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function recordAnalytics(
  projectId: string,
  profileId: string,
  metrics: any
) {
  const today = new Date().toISOString().split('T')[0];

  const { error } = await supabaseClient
    .from('review_analytics')
    .upsert({
      project_id: projectId,
      profile_id: profileId,
      date: today,
      ...metrics
    }, {
      onConflict: 'project_id,profile_id,date'
    });

  if (error) throw error;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, projectId, profileId, data }: RAGPipelineRequest = await req.json();

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

    switch (action) {
      case 'create_review': {
        if (!data.diffContent) {
          throw new Error('diffContent is required for create_review action');
        }

        const startTime = Date.now();
        
        // Create review request
        const reviewRequest = await createReviewRequest(
          projectId,
          profileId,
          data.diffContent,
          data.filePath,
          data.language
        );

        // Generate embedding for the diff content
        const diffEmbedding = await generateEmbedding(data.diffContent);
        
        // Search for similar reviews
        const similarReviews = await searchSimilarReviews(
          projectId,
          diffEmbedding,
          0.85,
          5
        );

        const processingTime = Date.now() - startTime;

        // Record analytics
        await recordAnalytics(projectId, profileId, {
          total_requests: 1,
          embedding_generations: 1,
          similarity_searches: 1,
          total_processing_time_ms: processingTime,
          average_response_time_ms: processingTime
        });

        result = {
          reviewRequest,
          similarReviews,
          cacheHit: similarReviews.length > 0,
          processingTimeMs: processingTime
        };
        break;
      }

      case 'search_similar': {
        if (!data.content && !data.embedding) {
          throw new Error('Either content or embedding is required for search_similar action');
        }

        let embedding = data.embedding;
        if (!embedding && data.content) {
          embedding = await generateEmbedding(data.content);
        }

        const similarReviews = await searchSimilarReviews(
          projectId,
          embedding!,
          data.similarityThreshold || 0.85,
          data.limit || 5
        );

        result = { similarReviews };
        break;
      }

      case 'generate_embedding': {
        if (!data.content) {
          throw new Error('content is required for generate_embedding action');
        }

        const embedding = await generateEmbedding(data.content);
        result = { embedding };
        break;
      }

      case 'complete_review': {
        if (!data.reviewId || !data.aiResponse) {
          throw new Error('reviewId and aiResponse are required for complete_review action');
        }

        // Create AI response message
        const aiMessage = await createMessage(
          data.reviewId,
          data.aiResponse,
          'ai_response',
          { model: data.model }
        );

        // Generate embedding for AI response
        const responseEmbedding = await generateEmbedding(data.aiResponse);
        
        // Create content hash
        const encoder = new TextEncoder();
        const contentData = encoder.encode(data.aiResponse);
        const hashBuffer = await crypto.subtle.digest('SHA-256', contentData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Store embedding
        const embeddingRecord = await createEmbedding(
          aiMessage.id,
          projectId,
          responseEmbedding,
          contentHash,
          data.filePath,
          data.language
        );

        // Update review status to completed
        await updateReviewStatus(data.reviewId, 'completed');

        result = {
          message: aiMessage,
          embedding: embeddingRecord
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('RAG Pipeline Error:', error);
    
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
