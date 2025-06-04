import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { RAGResponse } from '@/lib/services/rag-service';
import type {
  ReviewRequest,
  SimilaritySearchResult
} from '@/types/rag';

interface AIReviewRequest {
  action: 'generate_embedding' | 'search_similar' | 'review_code' | 'analyze_diff';
  projectId: string;
  profileId: string;
  data: {
    content?: string;
    searchQuery?: string;
    diffContent?: string;
    filePath?: string;
    language?: string;
    contextData?: {
      store?: boolean;
      [key: string]: any;
    };
    similarityThreshold?: number;
    limit?: number;
  };
}

interface AIReviewResponse {
  success?: boolean;
  action: string;
  requestId?: string;
  embedding?: number[];
  dimensions?: number;
  model?: string;
  processingTimeMs: number;
  stored?: boolean;
  searchQuery?: string;
  similarResults?: any[];
  similarReviews?: any[];
  cacheHit?: boolean;
  similarCount?: number;
  metadata?: any;
  error?: string;
}

export class RAGClient {
  private supabaseUrl: string;
  private functionUrl: string;

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    this.functionUrl = `${this.supabaseUrl}/functions/v1/ai-review-production`;
  }

  // Initialize a new code review with RAG pipeline
  async initializeReview(
    projectId: string,
    profileId: string,
    diffContent: string,
    filePath?: string,
    language?: string
  ): Promise<RAGResponse<{
    reviewRequest: ReviewRequest;
    similarReviews: SimilaritySearchResult[];
    cacheHit: boolean;
    processingTimeMs: number;
  }>> {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      const request: AIReviewRequest = {
        action: 'review_code',
        projectId,
        profileId,
        data: {
          diffContent,
          filePath,
          language
        }
      };

      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Edge Function error: ${response.status} - ${errorText}`
        };
      }

      const result: AIReviewResponse = await response.json();

      if (result.error) {
        return {
          success: false,
          error: result.error
        };
      }

      // Convert AI Review response to RAG format
      return {
        success: true,
        data: {
          reviewRequest: {
            id: result.requestId || crypto.randomUUID(),
            project_id: projectId,
            profile_id: profileId,
            file_path: filePath || 'unknown',
            diff_content: diffContent,
            diff_hash: crypto.subtle ? await crypto.subtle.digest('SHA-256', new TextEncoder().encode(diffContent)).then(buffer => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')) : Math.random().toString(36),
            language,
            status: 'pending' as const,
            priority: 1,
            cache_hit: result.cacheHit || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as ReviewRequest,
          similarReviews: result.similarReviews || [],
          cacheHit: result.cacheHit || false,
          processingTimeMs: result.processingTimeMs
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to initialize review: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Search for similar code reviews
  async searchSimilarReviews(
    projectId: string,
    profileId: string,
    content: string,
    options?: {
      similarityThreshold?: number;
      limit?: number;
    }
  ): Promise<RAGResponse<SimilaritySearchResult[]>> {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      const request: AIReviewRequest = {
        action: 'search_similar',
        projectId,
        profileId,
        data: {
          searchQuery: content,
          similarityThreshold: options?.similarityThreshold || 0.85,
          limit: options?.limit || 5
        }
      };

      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Edge Function error: ${response.status} - ${errorText}`
        };
      }

      const result: AIReviewResponse = await response.json();

      if (result.error) {
        return {
          success: false,
          error: result.error
        };
      }

      return {
        success: true,
        data: result.similarResults || []
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to search similar reviews: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Complete a review by storing AI response and generating embeddings
  async completeReview(
    projectId: string,
    profileId: string,
    reviewId: string,
    aiResponse: string,
    model: string,
    filePath?: string,
    language?: string
  ): Promise<RAGResponse<void>> {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // Generate embedding for the AI response to store for future similarity searches
      const request: AIReviewRequest = {
        action: 'generate_embedding',
        projectId,
        profileId,
        data: {
          content: aiResponse,
          contextData: {
            store: true,
            reviewId,
            model,
            filePath,
            language,
            type: 'ai_response'
          }
        }
      };

      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Edge Function error: ${response.status} - ${errorText}`
        };
      }

      const result: AIReviewResponse = await response.json();

      if (result.error) {
        return {
          success: false,
          error: result.error
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to complete review: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Generate embedding for content
  async generateEmbedding(
    projectId: string,
    profileId: string,
    content: string
  ): Promise<RAGResponse<number[]>> {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      const request: AIReviewRequest = {
        action: 'generate_embedding',
        projectId,
        profileId,
        data: { 
          content,
          contextData: { store: false }
        }
      };

      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Edge Function error: ${response.status} - ${errorText}`
        };
      }

      const result: AIReviewResponse = await response.json();

      if (result.error) {
        return {
          success: false,
          error: result.error
        };
      }

      return {
        success: true,
        data: result.embedding || []
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Get review analytics for a project
  async getReviewAnalytics(
    projectId: string,
    profileId: string,
    dateRange?: {
      startDate: string;
      endDate: string;
    }
  ): Promise<RAGResponse<any[]>> {
    try {
      const supabase = await createSupabaseServerClient();
      
      let query = supabase
        .from('review_analytics')
        .select('*')
        .eq('project_id', projectId)
        .eq('profile_id', profileId)
        .order('date', { ascending: false });

      if (dateRange) {
        query = query
          .gte('date', dateRange.startDate)
          .lte('date', dateRange.endDate);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const ragClient = new RAGClient();
