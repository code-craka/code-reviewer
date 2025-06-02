import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createHash } from 'crypto';

export interface RAGRequest {
  id: string;
  projectId: string;
  profileId: string;
  contentHash: string;
  language?: string;
  filePath?: string;
  createdAt: string;
}

export interface SimilaritySearchResult {
  reviewId: string;
  similarity: number;
  content: string;
  createdAt: string;
}

export interface RAGResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cacheHit?: boolean;
  similarReviews?: SimilaritySearchResult[];
}

export class RAGService {
  private supabase: any;

  constructor() {
    this.initSupabase();
  }

  private async initSupabase() {
    this.supabase = await createSupabaseServerClient();
  }

  // Utility function to generate diff hash
  private generateDiffHash(diffContent: string): string {
    return createHash('sha256').update(diffContent).digest('hex');
  }

  // Create a new review request
  async createReviewRequest(input: any): Promise<RAGResponse<any>> {
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
          error: error.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create review request'
      };
    }
  }

  // Check for similar review requests (cache hit detection)
  async findSimilarReviews(query: any): Promise<RAGResponse<SimilaritySearchResult[]>> {
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
          error: error.message
        };
      }

      // Calculate similarity scores and format results
      const results: SimilaritySearchResult[] = data.map((item: any) => ({
        reviewId: item.id,
        similarity: this.calculateSimilarityScore(query.embedding, item.embedding),
        content: item.content,
        createdAt: item.created_at
      }));

      return {
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to search similar reviews'
      };
    }
  }

  // Create a new message
  async createMessage(input: any): Promise<RAGResponse<any>> {
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
          error: error.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create message'
      };
    }
  }

  // Create embedding for a message
  async createEmbedding(input: any): Promise<RAGResponse<any>> {
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
          error: error.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create embedding'
      };
    }
  }

  // Update review request status
  async updateReviewStatus(
    id: string, 
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    cacheHit?: boolean
  ): Promise<RAGResponse<any>> {
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
          error: error.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update review status'
      };
    }
  }

  // Get review request with messages
  async getReviewWithMessages(reviewId: string): Promise<RAGResponse<any>> {
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
          error: error.message
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
        error: 'Failed to get review with messages'
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
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update embedding usage'
      };
    }
  }

  // Record analytics data
  async recordAnalytics(
    projectId: string,
    profileId: string,
    metrics: any
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
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to record analytics'
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
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to cleanup old data'
      };
    }
  }
}

// Export singleton instance
export const ragService = new RAGService();
