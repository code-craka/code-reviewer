import { createHash } from 'crypto';
import type { RAGResponse } from '@/lib/services/rag-service';
import { ragService } from './rag-service';

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

interface EmbeddingAnalytics {
  prompt_tokens: number;
  total_tokens: number;
  generation_time: number;
  status: 'success' | 'failure';
  error_message?: string;
}

class EmbeddingService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
  }

  async generateEmbedding(text: string): Promise<RAGResponse<number[]>> {
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'Text input is required'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text,
          encoding_format: 'float',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `OpenAI API error: ${response.status} - ${errorText}`
        };
      }

      const data: OpenAIEmbeddingResponse = await response.json();
      
      if (!data.data || data.data.length === 0) {
        return {
          success: false,
          error: 'No embedding data returned from OpenAI'
        };
      }

      return {
        success: true,
        data: data.data[0].embedding
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async processAndStoreEmbedding(
    messageId: string,
    text: string,
    projectId: string,
    messageType: 'user' | 'assistant' = 'user'
  ): Promise<RAGResponse<string>> {
    const startTime = Date.now();
    
    // Generate embedding
    const embeddingResult = await this.generateEmbedding(text);
    
    if (!embeddingResult.success) {
      // Analytics recording for failed embedding
      await this.recordEmbeddingAnalytics({
        prompt_tokens: 0,
        total_tokens: 0,
        generation_time: Date.now() - startTime,
        status: 'failure',
        error_message: embeddingResult.error,
      });
      
      return {
        success: false,
        error: embeddingResult.error
      };
    }

    // Store embedding in database
    const storeResult = await ragService.createEmbedding({
      message_id: messageId,
      project_id: projectId,
      embedding: embeddingResult.data,
      content_hash: this.generateTextHash(text),
      message_type: messageType,
    });

    if (!storeResult.success) {
      return {
        success: false,
        error: storeResult.error
      };
    }

    return {
      success: true,
      data: 'Embedding processed and stored successfully'
    };
  }

  async generateEmbeddingsForContent(
    text: string,
    projectId: string,
    messageId?: string
  ): Promise<RAGResponse<string>> {
    
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'Text content is required'
      };
    }

    try {
      const embeddingResult = await this.generateEmbedding(text);
      
      if (!embeddingResult.success) {
        return {
          success: false,
          error: embeddingResult.error
        };
      }

      // If messageId is provided, store the embedding
      if (messageId) {
        const storeResult = await ragService.createEmbedding({
          message_id: messageId,
          project_id: projectId,
          embedding: embeddingResult.data,
          content_hash: this.generateTextHash(text),
          message_type: 'user',
        });

        if (!storeResult.success) {
          return {
            success: false,
            error: storeResult.error
          };
        }
      }

      return {
        success: true,
        data: 'Embedding generated successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to process embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async generateBatchEmbeddings(
    texts: string[]
  ): Promise<RAGResponse<number[][]>> {
    if (!texts || texts.length === 0) {
      return {
        success: false,
        error: 'At least one text input is required'
      };
    }

    const validTexts = texts.filter(text => text && text.trim().length > 0);
    if (validTexts.length === 0) {
      return {
        success: false,
        error: 'No valid text inputs provided'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: validTexts,
          encoding_format: 'float',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `OpenAI API error: ${response.status} - ${errorText}`
        };
      }

      const data: OpenAIEmbeddingResponse = await response.json();
      
      if (!data.data || data.data.length === 0) {
        return {
          success: false,
          error: 'No embedding data returned from OpenAI'
        };
      }

      const embeddings = data.data.map(item => item.embedding);

      return {
        success: true,
        data: embeddings
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private generateTextHash(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  private async recordEmbeddingAnalytics(analytics: EmbeddingAnalytics): Promise<void> {
    // This would typically record to an analytics service
    console.log('Embedding Analytics:', analytics);
  }
}

export const embeddingService = new EmbeddingService();
