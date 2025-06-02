-- Enable RLS on all RAG tables
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cr_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cr_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_analytics ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's profile ID
CREATE OR REPLACE FUNCTION get_current_profile_id()
RETURNS TEXT AS $$
BEGIN
    RETURN auth.uid()::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can access project
CREATE OR REPLACE FUNCTION can_access_project_for_review(project_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM "Project" p
        LEFT JOIN "TeamMember" tm ON p."teamId" = tm."teamId"
        WHERE p.id = project_text
        AND (
            p."ownerId" = get_current_profile_id()
            OR tm."profileId" = get_current_profile_id()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for review_requests
CREATE POLICY "Users can view review requests for accessible projects"
    ON review_requests FOR SELECT
    USING (can_access_project_for_review(project_id));

CREATE POLICY "Users can create review requests for accessible projects"
    ON review_requests FOR INSERT
    WITH CHECK (
        can_access_project_for_review(project_id) 
        AND profile_id = get_current_profile_id()
    );

CREATE POLICY "Users can update their review requests for accessible projects"
    ON review_requests FOR UPDATE
    USING (
        can_access_project_for_review(project_id) 
        AND profile_id = get_current_profile_id()
    );

CREATE POLICY "Users can delete their review requests for accessible projects"
    ON review_requests FOR DELETE
    USING (
        can_access_project_for_review(project_id) 
        AND profile_id = get_current_profile_id()
    );

-- RLS Policies for cr_messages
CREATE POLICY "Users can view messages for accessible projects"
    ON cr_messages FOR SELECT
    USING (can_access_project_for_review(project_id));

CREATE POLICY "Users can create messages for accessible projects"
    ON cr_messages FOR INSERT
    WITH CHECK (
        can_access_project_for_review(project_id) 
        AND profile_id = get_current_profile_id()
    );

CREATE POLICY "Users can update their messages for accessible projects"
    ON cr_messages FOR UPDATE
    USING (
        can_access_project_for_review(project_id) 
        AND profile_id = get_current_profile_id()
    );

CREATE POLICY "Users can delete their messages for accessible projects"
    ON cr_messages FOR DELETE
    USING (
        can_access_project_for_review(project_id) 
        AND profile_id = get_current_profile_id()
    );

-- RLS Policies for cr_embeddings
CREATE POLICY "Users can view embeddings for accessible projects"
    ON cr_embeddings FOR SELECT
    USING (can_access_project_for_review(project_id));

CREATE POLICY "System can manage embeddings for accessible projects"
    ON cr_embeddings FOR ALL
    USING (can_access_project_for_review(project_id));

-- RLS Policies for review_analytics
CREATE POLICY "Users can view analytics for accessible projects"
    ON review_analytics FOR SELECT
    USING (can_access_project_for_review(project_id));

CREATE POLICY "Users can manage analytics for their projects"
    ON review_analytics FOR ALL
    USING (
        can_access_project_for_review(project_id) 
        AND profile_id = get_current_profile_id()
    );

-- Grant permissions for service role (for Edge Functions)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Create function for AI service to bypass RLS when needed
CREATE OR REPLACE FUNCTION ai_service_operation()
RETURNS BOOLEAN AS $$
BEGIN
    -- This function can be used by Edge Functions with service role
    -- to perform operations that bypass RLS when necessary
    RETURN current_setting('role') = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Additional indexes for RLS performance
CREATE INDEX idx_review_requests_profile_project ON review_requests(profile_id, project_id);
CREATE INDEX idx_cr_messages_profile_project ON cr_messages(profile_id, project_id);
CREATE INDEX idx_cr_embeddings_project_content ON cr_embeddings(project_id, content_hash);
CREATE INDEX idx_review_analytics_profile_project ON review_analytics(profile_id, project_id);
