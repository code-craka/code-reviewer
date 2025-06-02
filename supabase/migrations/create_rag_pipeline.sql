-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum for review status
CREATE TYPE review_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- Create enum for message types
CREATE TYPE message_type AS ENUM ('human', 'ai', 'system');

-- Create enum for AI model types
CREATE TYPE ai_model_type AS ENUM ('gpt-4o', 'claude-3.5-sonnet', 'gpt-4-turbo', 'local-mistral', 'deepseek-v2', 'deepseek-chat');

-- Review requests table - stores diff metadata and review context
CREATE TABLE review_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Git/diff context
    commit_hash VARCHAR(40),
    branch_name VARCHAR(255),
    file_path TEXT NOT NULL,
    diff_content TEXT NOT NULL,
    diff_hash VARCHAR(64) NOT NULL, -- SHA-256 of diff for deduplication
    
    -- Review context
    review_prompt TEXT,
    language VARCHAR(50),
    framework VARCHAR(100),
    
    -- Status and metadata
    status review_status DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    cache_hit BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- CR messages table - stores all review comments and AI responses
CREATE TABLE cr_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_request_id UUID NOT NULL REFERENCES review_requests(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Message content
    content TEXT NOT NULL,
    message_type message_type NOT NULL,
    ai_model ai_model_type,
    
    -- Context metadata
    file_path TEXT,
    line_start INTEGER,
    line_end INTEGER,
    code_snippet TEXT,
    language VARCHAR(50),
    
    -- AI generation metadata
    token_count INTEGER,
    generation_time_ms INTEGER,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    
    -- Feedback and learning
    was_helpful BOOLEAN,
    was_accepted BOOLEAN,
    human_feedback TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CR embeddings table - pgvector embeddings for similarity search
CREATE TABLE cr_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES cr_messages(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Embedding data
    embedding vector(1536), -- OpenAI text-embedding-3-large dimension
    content_hash VARCHAR(64) NOT NULL, -- SHA-256 of content for deduplication
    
    -- Search metadata
    file_path TEXT,
    language VARCHAR(50),
    tags TEXT[], -- Array of searchable tags
    
    -- Performance tracking
    similarity_threshold DECIMAL(3,2) DEFAULT 0.85,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review analytics table - track performance and costs
CREATE TABLE review_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Performance metrics
    date DATE NOT NULL,
    total_reviews INTEGER DEFAULT 0,
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    
    -- Cost tracking
    total_tokens_used INTEGER DEFAULT 0,
    estimated_cost DECIMAL(10,4) DEFAULT 0.0000,
    
    -- Model usage breakdown
    gpt4o_calls INTEGER DEFAULT 0,
    claude_calls INTEGER DEFAULT 0,
    local_model_calls INTEGER DEFAULT 0,
    
    -- Quality metrics
    avg_confidence_score DECIMAL(3,2),
    helpful_reviews INTEGER DEFAULT 0,
    total_feedback INTEGER DEFAULT 0,
    
    -- Constraints
    UNIQUE(project_id, profile_id, date),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_review_requests_project_id ON review_requests(project_id);
CREATE INDEX idx_review_requests_status ON review_requests(status);
CREATE INDEX idx_review_requests_diff_hash ON review_requests(diff_hash);
CREATE INDEX idx_review_requests_created_at ON review_requests(created_at DESC);

CREATE INDEX idx_cr_messages_review_request_id ON cr_messages(review_request_id);
CREATE INDEX idx_cr_messages_project_id ON cr_messages(project_id);
CREATE INDEX idx_cr_messages_message_type ON cr_messages(message_type);
CREATE INDEX idx_cr_messages_file_path ON cr_messages(file_path);
CREATE INDEX idx_cr_messages_language ON cr_messages(language);
CREATE INDEX idx_cr_messages_created_at ON cr_messages(created_at DESC);

CREATE INDEX idx_cr_embeddings_message_id ON cr_embeddings(message_id);
CREATE INDEX idx_cr_embeddings_project_id ON cr_embeddings(project_id);
CREATE INDEX idx_cr_embeddings_content_hash ON cr_embeddings(content_hash);
CREATE INDEX idx_cr_embeddings_file_path ON cr_embeddings(file_path);
CREATE INDEX idx_cr_embeddings_language ON cr_embeddings(language);
CREATE INDEX idx_cr_embeddings_usage_count ON cr_embeddings(usage_count DESC);

-- Vector similarity index (cosine distance)
CREATE INDEX idx_cr_embeddings_vector ON cr_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_review_analytics_project_date ON review_analytics(project_id, date DESC);
CREATE INDEX idx_review_analytics_date ON review_analytics(date DESC);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_review_requests_updated_at 
    BEFORE UPDATE ON review_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cr_messages_updated_at 
    BEFORE UPDATE ON cr_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cr_embeddings_updated_at 
    BEFORE UPDATE ON cr_embeddings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_analytics_updated_at 
    BEFORE UPDATE ON review_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function to calculate similarity score
CREATE OR REPLACE FUNCTION calculate_similarity_score(
    query_embedding vector(1536),
    target_embedding vector(1536)
) RETURNS DECIMAL(3,2) AS $$
BEGIN
    RETURN 1.0 - (query_embedding <=> target_embedding);
END;
$$ LANGUAGE plpgsql;
