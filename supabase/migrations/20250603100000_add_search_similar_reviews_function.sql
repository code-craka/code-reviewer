-- Update cr_embeddings table to support 3072 dimensions for text-embedding-3-large
-- Add support for storing review content and model information directly

ALTER TABLE cr_embeddings 
ADD COLUMN IF NOT EXISTS review_content TEXT,
ADD COLUMN IF NOT EXISTS model_used VARCHAR(100),
ADD COLUMN IF NOT EXISTS tokens_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cache_hit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS profile_id TEXT REFERENCES "Profile"(id) ON DELETE CASCADE;

-- Update embedding vector dimension to support text-embedding-3-large (3072 dimensions)
-- Note: This will require re-creating the table if data exists
-- ALTER TABLE cr_embeddings ALTER COLUMN embedding TYPE vector(3072);

-- For now, we'll keep the existing dimension and adjust the Edge Function
-- In production, you might want to migrate existing embeddings

-- Create the search_similar_reviews function
CREATE OR REPLACE FUNCTION search_similar_reviews(
    query_embedding vector(1536), -- Keeping existing dimension for now
    project_uuid TEXT,
    similarity_threshold DECIMAL(3,2) DEFAULT 0.70,
    result_limit INTEGER DEFAULT 5
) RETURNS TABLE (
    id TEXT,
    similarity_score DECIMAL(3,2),
    review_content TEXT,
    model_used VARCHAR(100),
    created_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        (1.0 - (query_embedding <=> e.embedding))::DECIMAL(3,2) as similarity_score,
        COALESCE(e.review_content, 'No content available') as review_content,
        COALESCE(e.model_used, 'unknown') as model_used,
        e.created_at
    FROM cr_embeddings e
    WHERE e.project_id = project_uuid
        AND (1.0 - (query_embedding <=> e.embedding)) >= similarity_threshold
        AND e.review_content IS NOT NULL
    ORDER BY query_embedding <=> e.embedding
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cr_embeddings_profile_id ON cr_embeddings(profile_id);
CREATE INDEX IF NOT EXISTS idx_cr_embeddings_cache_hit ON cr_embeddings(cache_hit);
CREATE INDEX IF NOT EXISTS idx_cr_embeddings_model_used ON cr_embeddings(model_used);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_similar_reviews TO authenticated;

-- Alternative function that works with projects and profiles
CREATE OR REPLACE FUNCTION search_project_reviews(
    query_embedding vector(1536),
    project_uuid TEXT,
    profile_uuid TEXT,
    similarity_threshold DECIMAL(3,2) DEFAULT 0.70,
    result_limit INTEGER DEFAULT 5
) RETURNS TABLE (
    id TEXT,
    similarity_score DECIMAL(3,2),
    review_content TEXT,
    model_used VARCHAR(100),
    file_path TEXT,
    language VARCHAR(50),
    created_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check if user has access to the project
    IF NOT EXISTS (
        SELECT 1 FROM "Project" p 
        WHERE p.id = project_uuid 
        AND (
            p."userId" = profile_uuid 
            OR EXISTS (
                SELECT 1 FROM "TeamMember" tm 
                JOIN "Team" t ON tm."teamId" = t.id 
                WHERE t."projectId" = project_uuid 
                AND tm."userId" = profile_uuid
            )
        )
    ) THEN
        RAISE EXCEPTION 'Access denied to project';
    END IF;

    RETURN QUERY
    SELECT 
        e.id,
        (1.0 - (query_embedding <=> e.embedding))::DECIMAL(3,2) as similarity_score,
        COALESCE(e.review_content, 'No content available') as review_content,
        COALESCE(e.model_used, 'unknown') as model_used,
        e.file_path,
        e.language,
        e.created_at
    FROM cr_embeddings e
    WHERE e.project_id = project_uuid
        AND (1.0 - (query_embedding <=> e.embedding)) >= similarity_threshold
        AND e.review_content IS NOT NULL
    ORDER BY query_embedding <=> e.embedding
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_project_reviews TO authenticated;

-- Add comment
COMMENT ON FUNCTION search_similar_reviews IS 'Search for similar code reviews using vector similarity';
COMMENT ON FUNCTION search_project_reviews IS 'Search for similar code reviews with project access control';
