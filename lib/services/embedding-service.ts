import { createHash } from 'crypto';
import type { RAGResponse, CreateEmbeddingInput } from '@/types/rag';
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

export class EmbeddingService {
  private readonly apiKey: string;
  private readonly model = 'text-embedding-3-large';
  private readonly dimensions = 1536;
  private readonly baseUrl = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Embedding generation will fail.');
    }
  }

  // Generate embeddings using OpenAI API
  async generateEmbedding(text: string): Promise<RAGResponse<number[]>> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: {
            code: 'MISSING_API_KEY',
            message: 'OpenAI API key not configured'
          }
        };
      }

      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          input: text,
          dimensions: this.dimensions,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: {
            code: 'OPENAI_API_ERROR',
            message: `OpenAI API error: ${response.status} ${response.statusText}`,
            details: errorText
          }
        };
      }

      const data: OpenAIEmbeddingResponse = await response.json();

      if (!data.data || data.data.length === 0) {
        return {
          success: false,
          error: {
            code: 'EMPTY_EMBEDDING_RESPONSE',
            message: 'No embedding data returned from OpenAI'
          }
        };
      }

      return {
        success: true,
        data: data.data[0].embedding,
        metadata: {
          token_count: data.usage.total_tokens,
          model_used: data.model as any
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EMBEDDING_GENERATION_FAILED',
          message: 'Failed to generate embedding',
          details: error
        }
      };
    }
  }

  // Generate and store embedding for a message
  async generateAndStoreEmbedding(
    messageId: string,
    projectId: string,
    content: string,
    filePath?: string,
    language?: string,
    tags?: string[]
  ): Promise<RAGResponse<string>> {
    try {
      // Generate content hash for deduplication
      const contentHash = createHash('sha256').update(content).digest('hex');

      // Check if embedding already exists
      const existingEmbedding = await this.findExistingEmbedding(contentHash, projectId);
      if (existingEmbedding.success && existingEmbedding.data) {
        return {
          success: true,
          data: existingEmbedding.data.id,
          metadata: {
            cache_hit: true,
            response_time_ms: 0
          }
        };
      }

      // Generate new embedding
      const startTime = Date.now();
      const embeddingResult = await this.generateEmbedding(content);
      
      if (!embeddingResult.success) {
        return embeddingResult as RAGResponse<string>;
      }

      const generationTime = Date.now() - startTime;

      // Store embedding in database
      const storeResult = await ragService.createEmbedding({
        message_id: messageId,
        project_id: projectId,
        embedding: embeddingResult.data!,
        content_hash: contentHash,
        file_path: filePath,
        language,
        tags
      });

      if (!storeResult.success) {
        return storeResult as RAGResponse<string>;
      }

      return {
        success: true,
        data: storeResult.data!.id,
        metadata: {
          cache_hit: false,
          response_time_ms: generationTime,
          token_count: embeddingResult.metadata?.token_count
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STORE_EMBEDDING_FAILED',
          message: 'Failed to generate and store embedding',
          details: error
        }
      };
    }
  }

  // Find existing embedding by content hash
  private async findExistingEmbedding(
    contentHash: string,
    projectId: string
  ): Promise<RAGResponse<{ id: string; embedding: number[] }>> {
    try {
      // This would be implemented using the RAG service to check for existing embeddings
      // For now, we'll assume no duplicates exist
      return {
        success: true,
        data: null as any
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FIND_EMBEDDING_FAILED',
          message: 'Failed to find existing embedding',
          details: error
        }
      };
    }
  }

  // Batch generate embeddings for multiple texts
  async generateBatchEmbeddings(texts: string[]): Promise<RAGResponse<number[][]>> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: {
            code: 'MISSING_API_KEY',
            message: 'OpenAI API key not configured'
          }
        };
      }

      if (texts.length === 0) {
        return {
          success: true,
          data: []
        };
      }

      // OpenAI supports batch embeddings, but we'll limit to 100 texts per batch
      const batchSize = 100;
      const batches = [];
      
      for (let i = 0; i < texts.length; i += batchSize) {
        batches.push(texts.slice(i, i + batchSize));
      }

      const allEmbeddings: number[][] = [];
      let totalTokens = 0;

      for (const batch of batches) {
        const response = await fetch(`${this.baseUrl}/embeddings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model,
            input: batch,
            dimensions: this.dimensions,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return {
            success: false,
            error: {
              code: 'OPENAI_BATCH_API_ERROR',
              message: `OpenAI batch API error: ${response.status} ${response.statusText}`,
              details: errorText
            }
          };
        }

        const data: OpenAIEmbeddingResponse = await response.json();
        
        // Sort by index to maintain order
        const sortedData = data.data.sort((a, b) => a.index - b.index);
        allEmbeddings.push(...sortedData.map(item => item.embedding));
        totalTokens += data.usage.total_tokens;
      }

      return {
        success: true,
        data: allEmbeddings,
        metadata: {
          token_count: totalTokens,
          model_used: this.model as any
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BATCH_EMBEDDING_FAILED',
          message: 'Failed to generate batch embeddings',
          details: error
        }
      };
    }
  }

  // Extract meaningful text from code for embedding
  extractEmbeddableText(
    content: string,
    fileType?: string,
    context?: {
      fileName?: string;
      lineStart?: number;
      lineEnd?: number;
    }
  ): string {
    const contextPrefix = context?.fileName ? `File: ${context.fileName}\n` : '';
    const lineInfo = context?.lineStart ? `Lines ${context.lineStart}-${context.lineEnd}:\n` : '';
    
    // Add language context if available
    const languagePrefix = fileType ? `Language: ${fileType}\n` : '';
    
    // Clean and normalize content
    const cleanContent = content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\t/g, '  ') // Convert tabs to spaces
      .trim();
    
    return `${contextPrefix}${languagePrefix}${lineInfo}${cleanContent}`;
  }

  // Create semantic tags for better search
  generateSemanticTags(
    content: string,
    fileType?: string,
    fileName?: string
  ): string[] {
    const tags: string[] = [];
    
    // Add file type tag
    if (fileType) {
      tags.push(`lang:${fileType.toLowerCase()}`);
    }
    
    // Add file extension tag
    if (fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase();
      if (extension) {
        tags.push(`ext:${extension}`);
      }
    }
    
    // Add content-based tags
    const contentLower = content.toLowerCase();
    
    // Framework detection
    if (contentLower.includes('react') || contentLower.includes('jsx')) {
      tags.push('framework:react');
    }
    if (contentLower.includes('vue')) {
      tags.push('framework:vue');
    }
    if (contentLower.includes('angular')) {
      tags.push('framework:angular');
    }
    if (contentLower.includes('next')) {
      tags.push('framework:nextjs');
    }
    
    // Pattern detection
    if (contentLower.includes('class ') || contentLower.includes('interface ')) {
      tags.push('pattern:class');
    }
    if (contentLower.includes('function ') || contentLower.includes('const ') || contentLower.includes('let ')) {
      tags.push('pattern:function');
    }
    if (contentLower.includes('import ') || contentLower.includes('require(')) {
      tags.push('pattern:import');
    }
    if (contentLower.includes('export ')) {
      tags.push('pattern:export');
    }
    
    // Issue type detection
    if (contentLower.includes('error') || contentLower.includes('bug')) {
      tags.push('issue:error');
    }
    if (contentLower.includes('performance') || contentLower.includes('optimization')) {
      tags.push('issue:performance');
    }
    if (contentLower.includes('security') || contentLower.includes('vulnerability')) {
      tags.push('issue:security');
    }
    
    return tags;
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
