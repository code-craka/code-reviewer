// Test client for AI Review Edge Function
// This demonstrates how to integrate the Edge Function with your frontend

interface AIReviewRequest {
  action: 'review_code' | 'search_similar' | 'analyze_diff';
  projectId: string;
  profileId: string;
  data: {
    diffContent?: string;
    filePath?: string;
    language?: string;
    codeSnippet?: string;
    searchQuery?: string;
    similarityThreshold?: number;
    limit?: number;
  };
}

interface AIReviewResponse {
  success: boolean;
  cached?: boolean;
  review?: {
    id: string;
    content: string;
    model: string;
    similarity_score?: number;
    tokens_used?: number;
    similar_reviews_found?: number;
    processing_time_ms: number;
  };
  results?: Array<{
    id: string;
    similarity_score: number;
    review_content: string;
    model_used: string;
    created_at: string;
  }>;
  error?: string;
  details?: string;
}

/**
 * Call the AI Review Edge Function
 */
export async function callAIReviewFunction(
  supabaseUrl: string,
  supabaseAnonKey: string,
  request: AIReviewRequest
): Promise<AIReviewResponse> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/ai-review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error calling AI Review function:', error);
    throw error;
  }
}

/**
 * Example usage: Review code
 */
export async function reviewCode(
  supabaseUrl: string,
  supabaseAnonKey: string,
  projectId: string,
  profileId: string,
  codeContent: string,
  filePath: string,
  language: string
): Promise<AIReviewResponse> {
  return callAIReviewFunction(supabaseUrl, supabaseAnonKey, {
    action: 'review_code',
    projectId,
    profileId,
    data: {
      diffContent: codeContent,
      filePath,
      language
    }
  });
}

/**
 * Example usage: Search similar reviews
 */
export async function searchSimilarReviews(
  supabaseUrl: string,
  supabaseAnonKey: string,
  projectId: string,
  profileId: string,
  codeSnippet: string,
  threshold: number = 0.70,
  limit: number = 5
): Promise<AIReviewResponse> {
  return callAIReviewFunction(supabaseUrl, supabaseAnonKey, {
    action: 'search_similar',
    projectId,
    profileId,
    data: {
      codeSnippet,
      similarityThreshold: threshold,
      limit
    }
  });
}

// Example usage in your React component:
/*
import { reviewCode, searchSimilarReviews } from './test-client';

const MyComponent = () => {
  const handleReviewCode = async () => {
    try {
      const result = await reviewCode(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'project-id',
        'profile-id',
        'function add(a, b) { return a + b; }',
        'utils/math.js',
        'javascript'
      );
      
      if (result.success) {
        console.log('Review:', result.review?.content);
        console.log('Cached:', result.cached);
        console.log('Model:', result.review?.model);
      }
    } catch (error) {
      console.error('Review failed:', error);
    }
  };

  const handleSearchSimilar = async () => {
    try {
      const result = await searchSimilarReviews(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'project-id', 
        'profile-id',
        'function calculate(x, y) { return x * y; }'
      );
      
      if (result.success && result.results) {
        console.log('Similar reviews found:', result.results.length);
        result.results.forEach((review, i) => {
          console.log(`${i+1}. Similarity: ${review.similarity_score}`);
          console.log(`   Content: ${review.review_content.slice(0, 100)}...`);
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleReviewCode}>Review Code</button>
      <button onClick={handleSearchSimilar}>Search Similar</button>
    </div>
  );
};
*/
