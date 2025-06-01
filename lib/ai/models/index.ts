import { AIReviewResponse, Review, ReviewDepth } from "@/types/ai";
import { generateGeminiReview } from "./gemini";
import { generateOpenAIReview } from "./openai";
import { generateAnthropicReview } from "./anthropic";
import { logger } from "@/lib/utils/logger";

/**
 * Factory function to get the appropriate review generator based on model ID
 */
export function getReviewGenerator(modelId: string) {
  switch (modelId) {
    case "gemini-pro":
      return generateGeminiReview;
    case "gpt-4":
      return generateOpenAIReview;
    case "claude-3-opus":
      return generateAnthropicReview;
    default:
      logger.error(`Unknown model ID: ${modelId}`);
      throw new Error(`Unsupported model: ${modelId}`);
  }
}

/**
 * Generate a code review using the specified AI model
 */
export async function generateReview(
  review: Review,
  depth: ReviewDepth,
): Promise<AIReviewResponse> {
  try {
    const modelId = review.modelId || "gemini-pro";
    const generator = getReviewGenerator(modelId);
    return generator(review, depth);
  } catch (error) {
    logger.error("Error generating review", {
      error,
      reviewId: review.id,
      modelId: review.modelId,
    });
    throw new Error(`Review generation failed: ${(error as Error).message}`);
  }
}
