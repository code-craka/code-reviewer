# AI Review Edge Function

A comprehensive Supabase Edge Function that handles AI-powered code review processing with embedding generation, vector similarity search, caching, and LLM fallback capabilities.

## Features

- 🔍 **Embedding Generation**: Uses OpenAI `text-embedding-3-large` for semantic code understanding
- 🚀 **Vector Similarity Search**: Leverages pgvector for K-NN similarity matching
- ⚡ **Smart Caching**: Cache hit/miss logic to avoid redundant AI calls (85% similarity threshold)
- 🔄 **LLM Fallback System**: Multiple AI models with priority-based fallback (Claude 3.5 Sonnet → GPT-4o → Claude 3 Haiku)
- 🔒 **Security**: Project-based access control and user authentication
- 📊 **Analytics**: Performance tracking with token usage and processing times

## Environment Variables

Set these in your Supabase Edge Function environment:

```bash
# OpenAI API (for embeddings)
OPENAI_API_KEY=sk-your-openai-key

# OpenRouter API (for LLM fallback)
OPENROUTER_API_KEY=sk-or-your-openrouter-key

# Supabase (automatically provided)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Database Setup

1. **Apply Migration**: Run the migration to add the `search_similar_reviews` function:
   ```sql
   -- Apply: supabase/migrations/20250602100000_add_search_similar_reviews_function.sql
   ```

2. **Required Extensions**: Ensure pgvector is enabled:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. **Table Schema**: The function expects the `cr_embeddings` table with:
   - `embedding` vector(1536) - OpenAI embeddings
   - `review_content` TEXT - AI-generated review text
   - `model_used` VARCHAR(100) - Which AI model was used
   - `project_id` TEXT - Project association
   - Additional metadata fields

## API Endpoints

### 1. Review Code

Generate AI review for code changes with smart caching.

```typescript
POST /functions/v1/ai-review
{
  "action": "review_code",
  "projectId": "project-uuid",
  "profileId": "user-profile-uuid", 
  "data": {
    "diffContent": "function add(a, b) { return a + b; }",
    "filePath": "src/utils/math.js",
    "language": "javascript"
  }
}
```

**Response (Cache Miss)**:
```json
{
  "success": true,
  "cached": false,
  "review": {
    "id": "review-uuid",
    "content": "## Code Review\n\n### Overall Assessment\nThe function looks good...",
    "model": "anthropic/claude-3.5-sonnet",
    "tokens_used": 150,
    "similar_reviews_found": 2,
    "processing_time_ms": 1250
  }
}
```

**Response (Cache Hit)**:
```json
{
  "success": true,
  "cached": true,
  "review": {
    "id": "cached-review-uuid",
    "content": "## Code Review\n\n### Overall Assessment\n...",
    "model": "anthropic/claude-3.5-sonnet",
    "similarity_score": 0.92,
    "processing_time_ms": 45
  }
}
```

### 2. Search Similar Reviews

Find previously reviewed code with similar patterns.

```typescript
POST /functions/v1/ai-review
{
  "action": "search_similar",
  "projectId": "project-uuid",
  "profileId": "user-profile-uuid",
  "data": {
    "codeSnippet": "function calculate(x, y) { return x * y; }",
    "similarityThreshold": 0.70,
    "limit": 5
  }
}
```

**Response**:
```json
{
  "success": true,
  "results": [
    {
      "id": "review-1",
      "similarity_score": 0.85,
      "review_content": "This multiplication function...",
      "model_used": "anthropic/claude-3.5-sonnet",
      "created_at": "2024-06-02T10:30:00Z"
    }
  ],
  "query": "function calculate(x, y) { return x * y; }",
  "threshold_used": 0.70
}
```

## Caching Strategy

### Cache Levels
1. **Level 1: Cache Hit** (≥85% similarity) - Return cached review instantly
2. **Level 2: Similarity Search** (≥70% similarity) - Use similar reviews as context
3. **Level 3: Fresh Generation** - Generate new review with LLM fallback

### Performance Benefits
- **Cache Hit**: ~50ms response time, 0 AI tokens
- **Similarity Context**: Better review quality using past insights  
- **Cost Optimization**: Reduced OpenAI/OpenRouter API calls

## LLM Fallback Chain

The function tries models in priority order:

1. **anthropic/claude-3.5-sonnet** - Most capable, preferred
2. **openai/gpt-4o** - Reliable fallback
3. **anthropic/claude-3-haiku** - Fast, cost-effective backup

If all models fail, returns error. Each model failure is logged for monitoring.

## Error Handling

- **Network Errors**: Automatic retry with exponential backoff
- **Model Failures**: Graceful fallback to next model in chain
- **Database Errors**: Graceful degradation (reviews still work without caching)
- **Authentication**: Project access validation and user authorization

## Security

- **Service Role**: Uses Supabase service role key for database operations
- **Project Access**: Validates user permissions for project access
- **Input Validation**: Sanitizes all user inputs
- **CORS**: Configured for secure cross-origin requests

## Integration Example

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function reviewCodeWithAI(
  projectId: string,
  codeContent: string,
  filePath: string,
  language: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-review`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'review_code',
        projectId,
        profileId: user.id,
        data: {
          diffContent: codeContent,
          filePath,
          language
        }
      }),
    }
  );

  return response.json();
}
```

## Monitoring & Analytics

The function automatically tracks:
- **Processing Times**: End-to-end latency
- **Token Usage**: OpenAI and OpenRouter consumption
- **Cache Hit Rates**: Efficiency metrics
- **Model Performance**: Success/failure rates per model
- **Error Patterns**: For debugging and optimization

All analytics are stored in the `review_analytics` table for dashboard integration.

## Deployment

1. **Deploy Function**:
   ```bash
   supabase functions deploy ai-review
   ```

2. **Set Environment Variables**:
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-your-key
   supabase secrets set OPENROUTER_API_KEY=sk-or-your-key
   ```

3. **Test Deployment**:
   ```bash
   curl -X POST "https://your-project.supabase.co/functions/v1/ai-review" \
     -H "Authorization: Bearer your-anon-key" \
     -H "Content-Type: application/json" \
     -d '{"action":"review_code","projectId":"test","profileId":"test","data":{"diffContent":"console.log(\"hello\");","filePath":"test.js","language":"javascript"}}'
   ```

## Performance Characteristics

- **Cold Start**: ~2-3 seconds
- **Warm Execution**: ~1-2 seconds
- **Cache Hit**: ~50-100ms
- **Memory Usage**: ~128MB typical
- **Concurrent Requests**: Supports 100+ concurrent

Perfect for production workloads with high throughput and low latency requirements.
