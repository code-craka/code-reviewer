import { createHash } from 'crypto';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type {
  ReviewRequest,
  CRMessage,
  CREmbedding,
  CreateReviewRequestInput,
  CreateCRMessageInput,
  CreateEmbeddingInput,
  SimilaritySearchQuery,
  SimilaritySearchResult,
  CacheResult,
  RAGResponse,
  ReviewAnalytics
} from '@/types/rag';

export class RAGService {
  private supabase: any;

  constructor() {
    this.initSupabase();
  }

  private async initSupabase() {
    this.supabase = await createSupabaseServerClient();
  }

  // Utility function to generate content hash
  private generateContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  // Utility function to generate diff hash
  private generateDiffHash(diffContent: string): string {
    return createHash('sha256').update(diffContent).digest('hex');
  }

  // Create a new review request
  async createReviewRequest(input: CreateReviewRequestInput): Promise<RAGResponse<ReviewRequest>> {
    try {
      if (!this.supabase) await this.initSupabase();

      const diffHash = this.generateDiffHash(input.diff_content);
      
      const { data, error } = await this.supabase
        .from('review_requests')
        .insert({
          ...input,
          diff_hash: diffHash,
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: {
            code: 'CREATE_REVIEW_REQUEST_FAILED',
            message: error.message,
            details: error
          }
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Failed to create review request',
          details: error
        }
      };
    }
  }

  // Check for similar review requests (cache hit detection)
  async findSimilarReviews(query: SimilaritySearchQuery): Promise<RAGResponse<SimilaritySearchResult[]>> {
    try {
      if (!this.supabase) await this.initSupabase();

      // Convert embedding array to pgvector format
      const embeddingVector = `[${query.embedding.join(',')}]`;
      
      let searchQuery = this.supabase
        .from('cr_embeddings')
        .select(`
          *,
          cr_messages!inner(*)
        `)
        .eq('project_id', query.project_id)
        .gte('similarity_threshold', query.similarity_threshold || 0.85)
        .limit(query.limit || 5);

      // Add optional filters
      if (query.file_path) {
        searchQuery = searchQuery.eq('file_path', query.file_path);
      }
      if (query.language) {
        searchQuery = searchQuery.eq('language', query.language);
      }

      // Order by cosine similarity (closest first)
      searchQuery = searchQuery.order('embedding <=> ' + embeddingVector);

      const { data, error } = await searchQuery;

      if (error) {
        return {
          success: false,
          error: {
            code: 'SIMILARITY_SEARCH_FAILED',
            message: error.message,
            details: error
          }
        };
      }

      // Calculate similarity scores and format results
      const results: SimilaritySearchResult[] = data.map((item: any) => ({
        message: item.cr_messages,
        embedding: item,
        similarity_score: this.calculateSimilarityScore(query.embedding, item.embedding)
      }));

      return {
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Failed to search similar reviews',
          details: error
        }
      };
    }
  }

  // Create a new message
  async createMessage(input: CreateCRMessageInput): Promise<RAGResponse<CRMessage>> {
    try {
      if (!this.supabase) await this.initSupabase();

      const { data, error } = await this.supabase
        .from('cr_messages')
        .insert(input)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: {
            code: 'CREATE_MESSAGE_FAILED',
            message: error.message,
            details: error
          }
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Failed to create message',
          details: error
        }
      };
    }
  }

  // Create embedding for a message
  async createEmbedding(input: CreateEmbeddingInput): Promise<RAGResponse<CREmbedding>> {
    try {
      if (!this.supabase) await this.initSupabase();

      // Convert embedding array to pgvector format
      const embeddingVector = `[${input.embedding.join(',')}]`;

      const { data, error } = await this.supabase
        .from('cr_embeddings')
        .insert({
          ...input,
          embedding: embeddingVector,
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: {
            code: 'CREATE_EMBEDDING_FAILED',
            message: error.message,
            details: error
          }
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Failed to create embedding',
          details: error
        }
      };
    }
  }

  // Update review request status
  async updateReviewStatus(
    id: string, 
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    cacheHit?: boolean
  ): Promise<RAGResponse<ReviewRequest>> {
    try {
      if (!this.supabase) await this.initSupabase();

      const updateData: any = { status };
      if (cacheHit !== undefined) {
        updateData.cache_hit = cacheHit;
      }
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from('review_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: {
            code: 'UPDATE_STATUS_FAILED',
            message: error.message,
            details: error
          }
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Failed to update review status',
          details: error
        }
      };
    }
  }

  // Get review request with messages
  async getReviewWithMessages(reviewId: string): Promise<RAGResponse<ReviewRequest & { messages: CRMessage[] }>> {
    try {
      if (!this.supabase) await this.initSupabase();

      const { data, error } = await this.supabase
        .from('review_requests')
        .select(`
          *,
          cr_messages(*)
        `)
        .eq('id', reviewId)
        .single();

      if (error) {
        return {
          success: false,
          error: {
            code: 'GET_REVIEW_FAILED',
            message: error.message,
            details: error
          }
        };
      }

      return {
        success: true,
        data: {
          ...data,
          messages: data.cr_messages || []
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Failed to get review with messages',
          details: error
        }
      };
    }
  }

  // Update embedding usage statistics
  async updateEmbeddingUsage(embeddingId: string): Promise<RAGResponse<void>> {
    try {
      if (!this.supabase) await this.initSupabase();

      const { error } = await this.supabase
        .from('cr_embeddings')
        .update({
          usage_count: this.supabase.raw('usage_count + 1'),
          last_used_at: new Date().toISOString()
        })
        .eq('id', embeddingId);

      if (error) {
        return {
          success: false,
          error: {
            code: 'UPDATE_USAGE_FAILED',
            message: error.message,
            details: error
          }
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Failed to update embedding usage',
          details: error
        }
      };
    }
  }

  // Record analytics data
  async recordAnalytics(
    projectId: string,
    profileId: string,
    metrics: Partial<ReviewAnalytics>
  ): Promise<RAGResponse<void>> {
    try {
      if (!this.supabase) await this.initSupabase();

      const today = new Date().toISOString().split('T')[0];

      const { error } = await this.supabase
        .from('review_analytics')
        .upsert({
          project_id: projectId,
          profile_id: profileId,
          date: today,
          ...metrics
        }, {
          onConflict: 'project_id,profile_id,date'
        });

      if (error) {
        return {
          success: false,
          error: {
            code: 'RECORD_ANALYTICS_FAILED',
            message: error.message,
            details: error
          }
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Failed to record analytics',
          details: error
        }
      };
    }
  }

  // Helper function to calculate similarity score
  private calculateSimilarityScore(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      return 0;
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  // Cleanup old embeddings and messages
  async cleanupOldData(daysToKeep: number = 30): Promise<RAGResponse<void>> {
    try {
      if (!this.supabase) await this.initSupabase();

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Delete old review requests (cascades to messages and embeddings)
      const { error } = await this.supabase
        .from('review_requests')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        return {
          success: false,
          error: {
            code: 'CLEANUP_FAILED',
            message: error.message,
            details: error
          }
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Failed to cleanup old data',
          details: error
        }
      };
    }
  }
}

// Export singleton instance
export const ragService = new RAGService();
