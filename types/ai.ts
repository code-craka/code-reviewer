/**
 * Type definitions for AI models and code review
 */

// AI Model Types
export type AIModelProvider = "gemini" | "openai" | "anthropic" | "custom";
export type AIModelSize = "small" | "medium" | "large";
export type AIModelType = "text" | "code" | "multimodal";

export interface AIModel {
  id: string;
  name: string;
  provider: AIModelProvider;
  version?: string;
  size: AIModelSize;
  type: AIModelType;
  description?: string;
  context_window?: number;
  enabled: boolean;
  requires_api_key: boolean;
  pros?: string[];
  cons?: string[];
}

// Review Severity - ensure proper typing as mentioned in our fixes
export type ReviewSeverity = "info" | "warning" | "error";

// Review Status - ensure proper typing as mentioned in our fixes
export type ReviewStatus = "open" | "fixed" | "ignored";

// Review Depth - ensure proper typing as mentioned in our fixes
export type ReviewDepth = "basic" | "standard" | "comprehensive";

// Base review result interface
export interface ReviewResult {
  id: string;
  reviewId: string;
  modelId: string;
  message: string;
  context?: string;
  file?: string;
  line?: number;
  column?: number;
  code?: string;
  suggestion?: string;
  severity: ReviewSeverity;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

// Review submission
export interface ReviewSubmission {
  projectId: string;
  code: string;
  language?: string;
  fileName?: string;
  models: string[];
  depth: ReviewDepth;
}

// Full review details
export interface Review {
  id: string;
  projectId: string;
  userId: string; // Add userId property to match usage in model files
  modelId: string;
  code: string;
  language?: string;
  fileName?: string;
  depth: ReviewDepth;
  createdAt: string;
  results?: ReviewResult[];
  summary?: string;
  stats?: {
    info: number;
    warning: number;
    error: number;
    total: number;
  };
}

// AI Review response
export interface AIReviewResponse {
  modelId: string;
  results: ReviewResult[];
  summary: string;
  executionTime?: number;
}

// Review filter options
export interface ReviewFilterOptions {
  severity?: ReviewSeverity[];
  status?: ReviewStatus[];
  file?: string;
  searchTerm?: string;
}

// Export review prompt types
export interface ReviewPromptTemplate {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  systemContext?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// Review visualization options
export interface ReviewVisualizationOptions {
  groupBy?: "file" | "severity" | "status";
  sortBy?: "severity" | "line" | "file";
  sortDirection?: "asc" | "desc";
  showDiff?: boolean;
  showContext?: boolean;
  compactView?: boolean;
}
