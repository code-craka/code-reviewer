-- =====================================================
-- AI Code Reviewer: Production-Grade Database Extensions
-- =====================================================

-- Add role-based access control to Profile
ALTER TABLE "Profile" ADD COLUMN "role" TEXT DEFAULT 'user';
UPDATE "Profile" SET "role" = 'user' WHERE "role" IS NULL;

-- Add admin flags and enhanced user management
ALTER TABLE "Profile" ADD COLUMN "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "Profile" ADD COLUMN "lastLoginAt" TIMESTAMP;
ALTER TABLE "Profile" ADD COLUMN "onboardingCompleted" BOOLEAN DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN "preferences" JSONB DEFAULT '{}';

-- Enhance ApiKey for BYOK (Bring Your Own Key)
ALTER TABLE "ApiKey" ADD COLUMN "provider" TEXT DEFAULT 'platform'; -- platform, openai, anthropic, gemini
ALTER TABLE "ApiKey" ADD COLUMN "isCustom" BOOLEAN DEFAULT false;
ALTER TABLE "ApiKey" ADD COLUMN "usage" JSONB DEFAULT '{"requests": 0, "tokens": 0}';
ALTER TABLE "ApiKey" ADD COLUMN "limits" JSONB DEFAULT '{"dailyRequests": 1000, "monthlyTokens": 100000}';

-- Create Chat/Conversation models for AI chat caching
CREATE TABLE "Conversation" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "profileId" TEXT NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "type" TEXT DEFAULT 'general', -- general, code_review, assistance
  "isArchived" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "Message" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "conversationId" TEXT NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL, -- user, assistant, system
  "content" TEXT NOT NULL,
  "metadata" JSONB DEFAULT '{}', -- model, tokens, cached, etc.
  "cached" BOOLEAN DEFAULT false,
  "cacheKey" TEXT,
  "createdAt" TIMESTAMP DEFAULT now()
);

-- Create Analytics models
CREATE TABLE "AnalyticsEvent" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "profileId" TEXT REFERENCES "Profile"("id") ON DELETE SET NULL,
  "eventType" TEXT NOT NULL, -- page_view, api_call, review_created, etc.
  "eventData" JSONB DEFAULT '{}',
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "UsageMetrics" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "profileId" TEXT NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "date" DATE NOT NULL,
  "apiCalls" INTEGER DEFAULT 0,
  "tokensUsed" INTEGER DEFAULT 0,
  "reviewsGenerated" INTEGER DEFAULT 0,
  "chatMessages" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  UNIQUE("profileId", "date")
);

-- Add indexes for performance
CREATE INDEX "idx_conversation_profile" ON "Conversation"("profileId", "createdAt");
CREATE INDEX "idx_message_conversation" ON "Message"("conversationId", "createdAt");
CREATE INDEX "idx_message_cache" ON "Message"("cacheKey") WHERE "cached" = true;
CREATE INDEX "idx_analytics_profile_date" ON "AnalyticsEvent"("profileId", "createdAt");
CREATE INDEX "idx_usage_metrics_profile_date" ON "UsageMetrics"("profileId", "date");
CREATE INDEX "idx_profile_role" ON "Profile"("role");

-- Create RLS policies for new tables
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UsageMetrics" ENABLE ROW LEVEL SECURITY;

-- Conversation policies
CREATE POLICY "Users can manage their own conversations" ON "Conversation"
  FOR ALL USING (auth.uid()::text = "profileId");

-- Message policies  
CREATE POLICY "Users can manage messages in their conversations" ON "Message"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Conversation" 
      WHERE "id" = "conversationId" 
      AND "profileId" = auth.uid()::text
    )
  );

-- Analytics policies (users see their own, admins see all)
CREATE POLICY "Users can view their own analytics" ON "AnalyticsEvent"
  FOR SELECT USING (
    "profileId" = auth.uid()::text 
    OR EXISTS (
      SELECT 1 FROM "Profile" 
      WHERE "id" = auth.uid()::text 
      AND "role" = 'admin'
    )
  );

CREATE POLICY "Users can view their own usage metrics" ON "UsageMetrics"
  FOR ALL USING (
    "profileId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM "Profile" 
      WHERE "id" = auth.uid()::text 
      AND "role" = 'admin'
    )
  );

-- Insert analytics for system events
CREATE POLICY "System can insert analytics" ON "AnalyticsEvent"
  FOR INSERT WITH CHECK (true);

COMMIT;
