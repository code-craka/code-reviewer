-- Migration: Enable Row Level Security
-- Description: Enable RLS and create security policies for AI Code Reviewer tables
-- Date: 2025-06-02

BEGIN;

-- =====================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================

ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReviewResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BillingDetail" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- =====================================
-- 2. CREATE HELPER FUNCTIONS
-- =====================================

CREATE OR REPLACE FUNCTION get_current_profile_id()
RETURNS TEXT AS $$
BEGIN
  RETURN auth.uid()::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_team_member_with_role(team_id TEXT, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "TeamMember"
    WHERE "teamId" = team_id
    AND "userId" = get_current_profile_id()
    AND (
      "role" = required_role OR
      "role" = 'owner' OR
      "role" = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_access_project(project_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  project_owner_id TEXT;
  project_team_id TEXT;
BEGIN
  SELECT "ownerId", "teamId" INTO project_owner_id, project_team_id
  FROM "Project" WHERE "id" = project_id;
  
  IF project_owner_id = get_current_profile_id() THEN
    RETURN TRUE;
  END IF;
  
  IF project_team_id IS NOT NULL THEN
    RETURN is_team_member_with_role(project_team_id, 'viewer');
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 3. PROFILE POLICIES
-- =====================================

CREATE POLICY "profile_select_own" ON "Profile"
  FOR SELECT USING (id = get_current_profile_id());

CREATE POLICY "profile_update_own" ON "Profile"
  FOR UPDATE USING (id = get_current_profile_id());

CREATE POLICY "profile_insert_own" ON "Profile"
  FOR INSERT WITH CHECK (id = get_current_profile_id());

-- =====================================
-- 4. PROJECT POLICIES
-- =====================================

CREATE POLICY "project_select_accessible" ON "Project"
  FOR SELECT USING (
    "ownerId" = get_current_profile_id() OR
    ("teamId" IS NOT NULL AND is_team_member_with_role("teamId", 'viewer'))
  );

CREATE POLICY "project_insert_own" ON "Project"
  FOR INSERT WITH CHECK ("ownerId" = get_current_profile_id());

CREATE POLICY "project_update_own_or_admin" ON "Project"
  FOR UPDATE USING (
    "ownerId" = get_current_profile_id() OR
    ("teamId" IS NOT NULL AND is_team_member_with_role("teamId", 'admin'))
  );

CREATE POLICY "project_delete_own" ON "Project"
  FOR DELETE USING ("ownerId" = get_current_profile_id());

-- =====================================
-- 5. PROJECT SETTINGS POLICIES
-- =====================================

CREATE POLICY "project_settings_select" ON "ProjectSettings"
  FOR SELECT USING (can_access_project("projectId"));

CREATE POLICY "project_settings_insert" ON "ProjectSettings"
  FOR INSERT WITH CHECK (can_access_project("projectId"));

CREATE POLICY "project_settings_update" ON "ProjectSettings"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Project" 
      WHERE "id" = "projectId" 
      AND (
        "ownerId" = get_current_profile_id() OR
        ("teamId" IS NOT NULL AND is_team_member_with_role("teamId", 'admin'))
      )
    )
  );

-- =====================================
-- 6. REVIEW POLICIES
-- =====================================

CREATE POLICY "review_select_accessible" ON "Review"
  FOR SELECT USING (can_access_project("projectId"));

CREATE POLICY "review_insert_own" ON "Review"
  FOR INSERT WITH CHECK (
    "authorId" = get_current_profile_id() AND
    can_access_project("projectId")
  );

CREATE POLICY "review_update_own" ON "Review"
  FOR UPDATE USING ("authorId" = get_current_profile_id());

CREATE POLICY "review_delete_own" ON "Review"
  FOR DELETE USING ("authorId" = get_current_profile_id());

-- =====================================
-- 7. REVIEW RESULT POLICIES
-- =====================================

CREATE POLICY "review_result_select_accessible" ON "ReviewResult"
  FOR SELECT USING (can_access_project("projectId"));

CREATE POLICY "review_result_insert_own" ON "ReviewResult"
  FOR INSERT WITH CHECK (
    "authorId" = get_current_profile_id() AND
    can_access_project("projectId")
  );

CREATE POLICY "review_result_update_own" ON "ReviewResult"
  FOR UPDATE USING ("authorId" = get_current_profile_id());

CREATE POLICY "review_result_delete_own" ON "ReviewResult"
  FOR DELETE USING ("authorId" = get_current_profile_id());

-- =====================================
-- 8. TEAM POLICIES
-- =====================================

CREATE POLICY "team_select_accessible" ON "Team"
  FOR SELECT USING (
    "ownerId" = get_current_profile_id() OR
    is_team_member_with_role("id", 'viewer')
  );

CREATE POLICY "team_insert_own" ON "Team"
  FOR INSERT WITH CHECK ("ownerId" = get_current_profile_id());

CREATE POLICY "team_update_own" ON "Team"
  FOR UPDATE USING ("ownerId" = get_current_profile_id());

CREATE POLICY "team_delete_own" ON "Team"
  FOR DELETE USING ("ownerId" = get_current_profile_id());

-- =====================================
-- 9. TEAM MEMBER POLICIES
-- =====================================

CREATE POLICY "team_member_select" ON "TeamMember"
  FOR SELECT USING (is_team_member_with_role("teamId", 'viewer'));

CREATE POLICY "team_member_insert_admin" ON "TeamMember"
  FOR INSERT WITH CHECK (is_team_member_with_role("teamId", 'admin'));

CREATE POLICY "team_member_update_admin" ON "TeamMember"
  FOR UPDATE USING (is_team_member_with_role("teamId", 'admin'));

CREATE POLICY "team_member_delete_admin_or_self" ON "TeamMember"
  FOR DELETE USING (
    is_team_member_with_role("teamId", 'admin') OR
    "userId" = get_current_profile_id()
  );

-- =====================================
-- 10. PERSONAL DATA POLICIES
-- =====================================

-- Billing Details
CREATE POLICY "billing_select_own" ON "BillingDetail"
  FOR SELECT USING ("profileId" = get_current_profile_id());

CREATE POLICY "billing_insert_own" ON "BillingDetail"
  FOR INSERT WITH CHECK ("profileId" = get_current_profile_id());

CREATE POLICY "billing_update_own" ON "BillingDetail"
  FOR UPDATE USING ("profileId" = get_current_profile_id());

CREATE POLICY "billing_delete_own" ON "BillingDetail"
  FOR DELETE USING ("profileId" = get_current_profile_id());

-- Subscriptions
CREATE POLICY "subscription_select_own" ON "Subscription"
  FOR SELECT USING ("profileId" = get_current_profile_id());

CREATE POLICY "subscription_insert_own" ON "Subscription"
  FOR INSERT WITH CHECK ("profileId" = get_current_profile_id());

CREATE POLICY "subscription_update_own" ON "Subscription"
  FOR UPDATE USING ("profileId" = get_current_profile_id());

-- API Keys
CREATE POLICY "api_key_select_own" ON "ApiKey"
  FOR SELECT USING ("profileId" = get_current_profile_id());

CREATE POLICY "api_key_insert_own" ON "ApiKey"
  FOR INSERT WITH CHECK ("profileId" = get_current_profile_id());

CREATE POLICY "api_key_update_own" ON "ApiKey"
  FOR UPDATE USING ("profileId" = get_current_profile_id());

CREATE POLICY "api_key_delete_own" ON "ApiKey"
  FOR DELETE USING ("profileId" = get_current_profile_id());

-- Notifications
CREATE POLICY "notification_select_own" ON "Notification"
  FOR SELECT USING ("profileId" = get_current_profile_id());

CREATE POLICY "notification_insert_system" ON "Notification"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "notification_update_own" ON "Notification"
  FOR UPDATE USING ("profileId" = get_current_profile_id());

CREATE POLICY "notification_delete_own" ON "Notification"
  FOR DELETE USING ("profileId" = get_current_profile_id());

-- =====================================
-- 11. INVITATION POLICIES
-- =====================================

CREATE POLICY "invitation_select_team_member" ON "Invitation"
  FOR SELECT USING (is_team_member_with_role("teamId", 'viewer'));

CREATE POLICY "invitation_insert_admin" ON "Invitation"
  FOR INSERT WITH CHECK (is_team_member_with_role("teamId", 'admin'));

CREATE POLICY "invitation_update_admin" ON "Invitation"
  FOR UPDATE USING (is_team_member_with_role("teamId", 'admin'));

CREATE POLICY "invitation_delete_admin" ON "Invitation"
  FOR DELETE USING (is_team_member_with_role("teamId", 'admin'));

-- =====================================
-- 12. STORAGE BUCKET POLICIES (AVATARS)
-- =====================================

-- Secure the avatars bucket
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Users can upload their own avatars (path: {user_id}/avatar.{ext})
CREATE POLICY "avatar_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = get_current_profile_id()
  );

-- Public read access for displaying avatars in UI
CREATE POLICY "avatar_view_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Users can update their own avatars
CREATE POLICY "avatar_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = get_current_profile_id()
  );

-- Users can delete their own avatars
CREATE POLICY "avatar_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = get_current_profile_id()
  );

COMMIT;
