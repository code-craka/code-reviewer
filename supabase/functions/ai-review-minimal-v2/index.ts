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

    let result: any;
    const startTime = Date.now();

    switch (action) {
      case 'generate_embedding': {
        if (!data.content) {
          throw new Error('content is required for generate_embedding action');
        }

        const embedding = await generateEmbedding(data.content);
        
        result = {
          action: 'generate_embedding',
          embedding,
          dimensions: EMBEDDING_DIMENSIONS,
          model: EMBEDDING_MODEL,
          processingTimeMs: Date.now() - startTime
        };
        break;
      }

      case 'review_code': {
        if (!data.diffContent) {
          throw new Error('diffContent is required for review_code action');
        }

        // Generate embedding for the diff content
        const diffEmbedding = await generateEmbedding(data.diffContent);
        
        const processingTime = Date.now() - startTime;

        result = {
          action: 'review_code',
          embedding: diffEmbedding,
          metadata: {
            filePath: data.filePath,
            language: data.language,
            diffContentLength: data.diffContent.length
          },
          processingTimeMs: processingTime,
          note: 'Embedding generated successfully. Similarity search would require database integration.'
        };
        break;
      }

      case 'search_similar': {
        if (!data.searchQuery) {
          throw new Error('searchQuery is required for search_similar action');
        }

        const searchEmbedding = await generateEmbedding(data.searchQuery);

        result = {
          action: 'search_similar',
          searchQuery: data.searchQuery,
          embedding: searchEmbedding,
          processingTimeMs: Date.now() - startTime,
          note: 'Search embedding generated. Similarity matching would require database integration.'
        };
        break;
      }

      case 'analyze_diff': {
        if (!data.diffContent) {
          throw new Error('diffContent is required for analyze_diff action');
        }

        // Generate embedding for diff analysis
        const diffEmbedding = await generateEmbedding(data.diffContent);
        
        // Generate pattern analysis embedding
        const patternQuery = `${data.language || 'code'} patterns and structure analysis`;
        const patternEmbedding = await generateEmbedding(patternQuery);

        const processingTime = Date.now() - startTime;

        result = {
          action: 'analyze_diff',
          diffAnalysis: {
            diffEmbedding,
            patternEmbedding,
            analysis: {
              filePath: data.filePath,
              language: data.language,
              diffSize: data.diffContent.length,
              complexity: data.diffContent.length > 500 ? 'high' : 'medium'
            }
          },
          processingTimeMs: processingTime,
          note: 'Diff analysis embeddings generated. Database integration needed for complete functionality.'
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
