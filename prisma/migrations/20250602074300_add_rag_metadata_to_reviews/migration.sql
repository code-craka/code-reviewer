-- Migration: Add RAG metadata fields to Review table
-- Description: Add RAG pipeline integration fields for similarity search and caching
-- Date: 2025-06-02

BEGIN;

-- Add RAG metadata columns to Review table
ALTER TABLE "Review" ADD COLUMN "ragReviewRequestId" TEXT;
ALTER TABLE "Review" ADD COLUMN "cacheHit" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Review" ADD COLUMN "similarReviewsCount" INTEGER DEFAULT 0;

-- Add index for RAG review request lookup
CREATE INDEX "idx_review_rag_request_id" ON "Review"("ragReviewRequestId");

-- Add index for cache hit analytics
CREATE INDEX "idx_review_cache_hit" ON "Review"("cacheHit");

COMMIT;
