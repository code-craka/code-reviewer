-- =====================================
-- SUPABASE ROW LEVEL SECURITY POLICIES
-- =====================================
-- This file enables RLS and creates comprehensive security policies
-- for the AI Code Reviewer application

-- Enable RLS on all tables
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

-- Note: _prisma_migrations table should NOT have RLS enabled as it's internal to Prisma

-- =====================================
-- HELPER FUNCTIONS
-- =====================================

-- Function to get current user's profile ID
CREATE OR REPLACE FUNCTION get_current_profile_id()
RETURNS TEXT AS $$
BEGIN
  RETURN auth.uid()::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is team member with specific role
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

-- Function to check if user owns a project or is team member
CREATE OR REPLACE FUNCTION can_access_project(project_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  project_owner_id TEXT;
  project_team_id TEXT;
BEGIN
  SELECT "ownerId", "teamId" INTO project_owner_id, project_team_id
  FROM "Project" WHERE "id" = project_id;
  
  -- User owns the project
  IF project_owner_id = get_current_profile_id() THEN
    RETURN TRUE;
  END IF;
  
  -- Project belongs to a team where user is a member
  IF project_team_id IS NOT NULL THEN
    RETURN is_team_member_with_role(project_team_id, 'viewer');
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- PROFILE POLICIES
-- =====================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON "Profile"
  FOR SELECT USING (id = get_current_profile_id());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON "Profile"
  FOR UPDATE USING (id = get_current_profile_id());

-- Users can insert their own profile (for initial profile creation)
CREATE POLICY "Users can insert own profile" ON "Profile"
  FOR INSERT WITH CHECK (id = get_current_profile_id());

-- =====================================
-- PROJECT POLICIES
-- =====================================

-- Users can view projects they own or are team members of
CREATE POLICY "Users can view accessible projects" ON "Project"
  FOR SELECT USING (
    "ownerId" = get_current_profile_id() OR
    ("teamId" IS NOT NULL AND is_team_member_with_role("teamId", 'viewer'))
  );

-- Users can create projects
CREATE POLICY "Users can create projects" ON "Project"
  FOR INSERT WITH CHECK ("ownerId" = get_current_profile_id());

-- Users can update projects they own or are team admins
CREATE POLICY "Users can update own projects" ON "Project"
  FOR UPDATE USING (
    "ownerId" = get_current_profile_id() OR
    ("teamId" IS NOT NULL AND is_team_member_with_role("teamId", 'admin'))
  );

-- Users can delete projects they own
CREATE POLICY "Users can delete own projects" ON "Project"
  FOR DELETE USING ("ownerId" = get_current_profile_id());

-- =====================================
-- PROJECT SETTINGS POLICIES
-- =====================================

-- Users can view settings for accessible projects
CREATE POLICY "Users can view project settings" ON "ProjectSettings"
  FOR SELECT USING (can_access_project("projectId"));

-- Users can update settings for projects they own or are team admins
CREATE POLICY "Users can update project settings" ON "ProjectSettings"
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

-- Users can create settings for their projects
CREATE POLICY "Users can create project settings" ON "ProjectSettings"
  FOR INSERT WITH CHECK (can_access_project("projectId"));

-- =====================================
-- REVIEW POLICIES
-- =====================================

-- Users can view reviews for accessible projects
CREATE POLICY "Users can view accessible reviews" ON "Review"
  FOR SELECT USING (can_access_project("projectId"));

-- Users can create reviews for accessible projects
CREATE POLICY "Users can create reviews" ON "Review"
  FOR INSERT WITH CHECK (
    "authorId" = get_current_profile_id() AND
    can_access_project("projectId")
  );

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON "Review"
  FOR UPDATE USING ("authorId" = get_current_profile_id());

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON "Review"
  FOR DELETE USING ("authorId" = get_current_profile_id());

-- =====================================
-- REVIEW RESULT POLICIES
-- =====================================

-- Users can view review results for accessible projects
CREATE POLICY "Users can view accessible review results" ON "ReviewResult"
  FOR SELECT USING (can_access_project("projectId"));

-- Users can create review results for accessible projects
CREATE POLICY "Users can create review results" ON "ReviewResult"
  FOR INSERT WITH CHECK (
    "authorId" = get_current_profile_id() AND
    can_access_project("projectId")
  );

-- Users can update their own review results
CREATE POLICY "Users can update own review results" ON "ReviewResult"
  FOR UPDATE USING ("authorId" = get_current_profile_id());

-- Users can delete their own review results
CREATE POLICY "Users can delete own review results" ON "ReviewResult"
  FOR DELETE USING ("authorId" = get_current_profile_id());

-- =====================================
-- TEAM POLICIES
-- =====================================

-- Users can view teams they own or are members of
CREATE POLICY "Users can view accessible teams" ON "Team"
  FOR SELECT USING (
    "ownerId" = get_current_profile_id() OR
    is_team_member_with_role("id", 'viewer')
  );

-- Users can create teams
CREATE POLICY "Users can create teams" ON "Team"
  FOR INSERT WITH CHECK ("ownerId" = get_current_profile_id());

-- Users can update teams they own
CREATE POLICY "Users can update own teams" ON "Team"
  FOR UPDATE USING ("ownerId" = get_current_profile_id());

-- Users can delete teams they own
CREATE POLICY "Users can delete own teams" ON "Team"
  FOR DELETE USING ("ownerId" = get_current_profile_id());

-- =====================================
-- TEAM MEMBER POLICIES
-- =====================================

-- Users can view team members for teams they have access to
CREATE POLICY "Users can view team members" ON "TeamMember"
  FOR SELECT USING (is_team_member_with_role("teamId", 'viewer'));

-- Team owners/admins can add members
CREATE POLICY "Team admins can add members" ON "TeamMember"
  FOR INSERT WITH CHECK (is_team_member_with_role("teamId", 'admin'));

-- Team owners/admins can update member roles
CREATE POLICY "Team admins can update members" ON "TeamMember"
  FOR UPDATE USING (is_team_member_with_role("teamId", 'admin'));

-- Team owners/admins can remove members, or users can remove themselves
CREATE POLICY "Team admins can remove members" ON "TeamMember"
  FOR DELETE USING (
    is_team_member_with_role("teamId", 'admin') OR
    "userId" = get_current_profile_id()
  );

-- =====================================
-- INVITATION POLICIES
-- =====================================

-- Team members can view invitations for their teams
CREATE POLICY "Team members can view invitations" ON "Invitation"
  FOR SELECT USING (is_team_member_with_role("teamId", 'viewer'));

-- Team admins can create invitations
CREATE POLICY "Team admins can create invitations" ON "Invitation"
  FOR INSERT WITH CHECK (is_team_member_with_role("teamId", 'admin'));

-- Team admins can update invitations
CREATE POLICY "Team admins can update invitations" ON "Invitation"
  FOR UPDATE USING (is_team_member_with_role("teamId", 'admin'));

-- Team admins can delete invitations
CREATE POLICY "Team admins can delete invitations" ON "Invitation"
  FOR DELETE USING (is_team_member_with_role("teamId", 'admin'));

-- =====================================
-- BILLING DETAIL POLICIES
-- =====================================

-- Users can view their own billing details
CREATE POLICY "Users can view own billing" ON "BillingDetail"
  FOR SELECT USING ("profileId" = get_current_profile_id());

-- Users can create their own billing details
CREATE POLICY "Users can create own billing" ON "BillingDetail"
  FOR INSERT WITH CHECK ("profileId" = get_current_profile_id());

-- Users can update their own billing details
CREATE POLICY "Users can update own billing" ON "BillingDetail"
  FOR UPDATE USING ("profileId" = get_current_profile_id());

-- Users can delete their own billing details
CREATE POLICY "Users can delete own billing" ON "BillingDetail"
  FOR DELETE USING ("profileId" = get_current_profile_id());

-- =====================================
-- SUBSCRIPTION POLICIES
-- =====================================

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON "Subscription"
  FOR SELECT USING ("profileId" = get_current_profile_id());

-- Users can create their own subscriptions
CREATE POLICY "Users can create own subscriptions" ON "Subscription"
  FOR INSERT WITH CHECK ("profileId" = get_current_profile_id());

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" ON "Subscription"
  FOR UPDATE USING ("profileId" = get_current_profile_id());

-- =====================================
-- API KEY POLICIES
-- =====================================

-- Users can view their own API keys
CREATE POLICY "Users can view own API keys" ON "ApiKey"
  FOR SELECT USING ("profileId" = get_current_profile_id());

-- Users can create their own API keys
CREATE POLICY "Users can create own API keys" ON "ApiKey"
  FOR INSERT WITH CHECK ("profileId" = get_current_profile_id());

-- Users can update their own API keys
CREATE POLICY "Users can update own API keys" ON "ApiKey"
  FOR UPDATE USING ("profileId" = get_current_profile_id());

-- Users can delete their own API keys
CREATE POLICY "Users can delete own API keys" ON "ApiKey"
  FOR DELETE USING ("profileId" = get_current_profile_id());

-- =====================================
-- NOTIFICATION POLICIES
-- =====================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON "Notification"
  FOR SELECT USING ("profileId" = get_current_profile_id());

-- System can create notifications for users
CREATE POLICY "System can create notifications" ON "Notification"
  FOR INSERT WITH CHECK (true); -- This should be restricted in application logic

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON "Notification"
  FOR UPDATE USING ("profileId" = get_current_profile_id());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON "Notification"
  FOR DELETE USING ("profileId" = get_current_profile_id());

-- =====================================
-- STORAGE BUCKET POLICIES (AVATARS)
-- =====================================

-- Enable RLS on the avatars bucket
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Users can upload their own profile pictures
-- File path should be: {user_id}/avatar.{extension}
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = get_current_profile_id()
  );

-- Anyone can view profile pictures (public read access)
-- This allows profile pictures to be displayed in the UI
CREATE POLICY "Public can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Users can update their own profile pictures
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = get_current_profile_id()
  );

-- Users can delete their own profile pictures
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = get_current_profile_id()
  );

-- =====================================
-- CLEANUP AND VERIFICATION
-- =====================================

-- Add comments for documentation
COMMENT ON FUNCTION get_current_profile_id() IS 'Returns the current authenticated user profile ID';
COMMENT ON FUNCTION is_team_member_with_role(TEXT, TEXT) IS 'Checks if current user is team member with specified role or higher';
COMMENT ON FUNCTION can_access_project(TEXT) IS 'Checks if current user can access a project (owner or team member)';

-- Enable realtime for necessary tables (optional)
-- ALTER PUBLICATION supabase_realtime ADD TABLE "Project";
-- ALTER PUBLICATION supabase_realtime ADD TABLE "Review";
-- ALTER PUBLICATION supabase_realtime ADD TABLE "ReviewResult";
-- ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";

-- =====================================
-- VERIFICATION QUERIES
-- =====================================

-- To verify policies are working, you can run these test queries:
-- SELECT * FROM "Profile"; -- Should only return current user's profile
-- SELECT * FROM "Project"; -- Should only return accessible projects
-- SELECT * FROM "Team"; -- Should only return teams user belongs to

COMMIT;
