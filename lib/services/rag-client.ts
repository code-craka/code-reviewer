import { createSupabaseServerClient } from '@/lib/supabase/server';
import type {
  RAGResponse,
  ReviewRequest,
  SimilaritySearchResult,
  CreateReviewRequestInput
} from '@/types/rag';

interface RAGPipelineRequest {
  action: 'create_review' | 'search_similar' | 'generate_embedding' | 'complete_review';
  projectId: string;
  profileId: string;
  data: {
    diffContent?: string;
    filePath?: string;
    language?: string;
    content?: string;
    embedding?: number[];
    similarityThreshold?: number;
    limit?: number;
    reviewId?: string;
    aiResponse?: string;
    model?: string;
  };
}

interface RAGPipelineResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class RAGClient {
  private supabaseUrl: string;
  private functionUrl: string;

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    this.functionUrl = `${this.supabaseUrl}/functions/v1/rag-pipeline`;
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
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        };
      }

      const request: RAGPipelineRequest = {
        action: 'create_review',
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
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: {
            code: 'RAG_PIPELINE_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
            details: errorText
          }
        };
      }

      const result: RAGPipelineResponse = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: {
            code: 'RAG_PIPELINE_FAILED',
            message: result.error || 'Pipeline execution failed'
          }
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to RAG pipeline',
          details: error
        }
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
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        };
      }

      const request: RAGPipelineRequest = {
        action: 'search_similar',
        projectId,
        profileId,
        data: {
          content,
          similarityThreshold: options?.similarityThreshold || 0.85,
          limit: options?.limit || 5
        }
      };

      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: {
            code: 'SEARCH_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
            details: errorText
          }
        };
      }

      const result: RAGPipelineResponse = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: {
            code: 'SEARCH_FAILED',
            message: result.error || 'Search failed'
          }
        };
      }

      return {
        success: true,
        data: result.data.similarReviews || []
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to search similar reviews',
          details: error
        }
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
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        };
      }

      const request: RAGPipelineRequest = {
        action: 'complete_review',
        projectId,
        profileId,
        data: {
          reviewId,
          aiResponse,
          model,
          filePath,
          language
        }
      };

      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: {
            code: 'COMPLETE_REVIEW_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
            details: errorText
          }
        };
      }

      const result: RAGPipelineResponse = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: {
            code: 'COMPLETE_REVIEW_FAILED',
            message: result.error || 'Failed to complete review'
          }
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to complete review',
          details: error
        }
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
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        };
      }

      const request: RAGPipelineRequest = {
        action: 'generate_embedding',
        projectId,
        profileId,
        data: { content }
      };

      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: {
            code: 'EMBEDDING_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
            details: errorText
          }
        };
      }

      const result: RAGPipelineResponse = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: {
            code: 'EMBEDDING_FAILED',
            message: result.error || 'Failed to generate embedding'
          }
        };
      }

      return {
        success: true,
        data: result.data.embedding
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to generate embedding',
          details: error
        }
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
          error: {
            code: 'ANALYTICS_QUERY_FAILED',
            message: error.message,
            details: error
          }
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: 'Failed to fetch analytics',
          details: error
        }
      };
    }
  }
}

// Export singleton instance
export const ragClient = new RAGClient();
