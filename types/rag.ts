// RAG Pipeline Types
export type ReviewStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type MessageType = 'human' | 'ai' | 'system';
export type AIModelType = 'gpt-4o' | 'claude-3.5-sonnet' | 'gpt-4-turbo' | 'local-mistral' | 'deepseek-v2' | 'deepseek-chat';

// Review Request - represents a code review request
export interface ReviewRequest {
  id: string;
  project_id: string;
  profile_id: string;
  
  // Git/diff context
  commit_hash?: string;
  branch_name?: string;
  file_path: string;
  diff_content: string;
  diff_hash: string;
  
  // Review context
  review_prompt?: string;
  language?: string;
  framework?: string;
  
  // Status and metadata
  status: ReviewStatus;
  priority: number;
  cache_hit: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// CR Message - individual review comments/responses
export interface CRMessage {
  id: string;
  review_request_id: string;
  project_id: string;
  profile_id: string;
  
  // Message content
  content: string;
  message_type: MessageType;
  ai_model?: AIModelType;
  
  // Context metadata
  file_path?: string;
  line_start?: number;
  line_end?: number;
  code_snippet?: string;
  language?: string;
  
  // AI generation metadata
  token_count?: number;
  generation_time_ms?: number;
  confidence_score?: number; // 0.00 to 1.00
  
  // Feedback and learning
  was_helpful?: boolean;
  was_accepted?: boolean;
  human_feedback?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// CR Embedding - vector embeddings for similarity search
export interface CREmbedding {
  id: string;
  message_id: string;
  project_id: string;
  
  // Embedding data
  embedding: number[]; // 1536-dimensional vector
  content_hash: string;
  
  // Search metadata
  file_path?: string;
  language?: string;
  tags?: string[];
  
  // Performance tracking
  similarity_threshold: number;
  usage_count: number;
  last_used_at?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Review Analytics - performance and cost tracking
export interface ReviewAnalytics {
  id: string;
  project_id: string;
  profile_id: string;
  
  // Performance metrics
  date: string;
  total_reviews: number;
  cache_hits: number;
  cache_misses: number;
  avg_response_time_ms: number;
  
  // Cost tracking
  total_tokens_used: number;
  estimated_cost: number;
  
  // Model usage breakdown
  gpt4o_calls: number;
  claude_calls: number;
  local_model_calls: number;
  
  // Quality metrics
  avg_confidence_score?: number;
  helpful_reviews: number;
  total_feedback: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Input types for creating new records
export interface CreateReviewRequestInput {
  project_id: string;
  file_path: string;
  diff_content: string;
  commit_hash?: string;
  branch_name?: string;
  review_prompt?: string;
  language?: string;
  framework?: string;
  priority?: number;
}

export interface CreateCRMessageInput {
  review_request_id: string;
  project_id: string;
  content: string;
  message_type: MessageType;
  ai_model?: AIModelType;
  file_path?: string;
  line_start?: number;
  line_end?: number;
  code_snippet?: string;
  language?: string;
  token_count?: number;
  generation_time_ms?: number;
  confidence_score?: number;
}

export interface CreateEmbeddingInput {
  message_id: string;
  project_id: string;
  embedding: number[];
  content_hash: string;
  file_path?: string;
  language?: string;
  tags?: string[];
}

// Search and retrieval types
export interface SimilaritySearchQuery {
  embedding: number[];
  project_id: string;
  file_path?: string;
  language?: string;
  limit?: number;
  similarity_threshold?: number;
}

export interface SimilaritySearchResult {
  message: CRMessage;
  embedding: CREmbedding;
  similarity_score: number;
}

// Cache and performance types
export interface CacheResult {
  hit: boolean;
  message?: CRMessage;
  similarity_score?: number;
  response_time_ms: number;
}

export interface AIGenerationRequest {
  prompt: string;
  context: string[];
  diff_content: string;
  file_path: string;
  language?: string;
  model?: AIModelType;
  max_tokens?: number;
  temperature?: number;
}

export interface AIGenerationResponse {
  content: string;
  model: AIModelType;
  token_count: number;
  generation_time_ms: number;
  confidence_score: number;
  finish_reason: string;
}

// Error and status types
export interface RAGError {
  code: string;
  message: string;
  details?: any;
}

export interface RAGResponse<T = any> {
  success: boolean;
  data?: T;
  error?: RAGError;
  metadata?: {
    cache_hit?: boolean;
    response_time_ms?: number;
    token_count?: number;
    model_used?: AIModelType;
  };
}

// Analytics and reporting types
export interface ProjectAnalytics {
  project_id: string;
  date_range: {
    start: string;
    end: string;
  };
  metrics: {
    total_reviews: number;
    cache_hit_rate: number;
    avg_response_time: number;
    total_cost: number;
    avg_confidence: number;
    user_satisfaction: number;
  };
  model_usage: {
    [key in AIModelType]: number;
  };
  daily_breakdown: ReviewAnalytics[];
}

// Configuration types
export interface RAGConfig {
  embedding_model: string;
  embedding_dimensions: number;
  similarity_threshold: number;
  max_context_length: number;
  cache_ttl_hours: number;
  default_ai_model: AIModelType;
  fallback_models: AIModelType[];
  max_tokens: number;
  temperature: number;
  cost_limits: {
    daily_max_usd: number;
    monthly_max_usd: number;
  };
}
