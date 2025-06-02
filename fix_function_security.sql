-- Fix function search path security warnings
-- Run this after the main RLS policies

BEGIN;

-- Fix get_current_profile_id function search path
CREATE OR REPLACE FUNCTION get_current_profile_id()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid()::text;
$$;

-- Fix is_team_member_with_role function search path
CREATE OR REPLACE FUNCTION is_team_member_with_role(team_id TEXT, required_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public."TeamMember" tm 
    WHERE tm."teamId" = team_id
    AND tm."userId" = get_current_profile_id()
    AND (
      required_role = 'viewer' OR
      (required_role = 'member' AND tm.role IN ('member', 'admin', 'owner')) OR
      (required_role = 'admin' AND tm.role IN ('admin', 'owner')) OR
      (required_role = 'owner' AND tm.role = 'owner')
    )
  );
$$;

-- Fix can_access_project function search path
CREATE OR REPLACE FUNCTION can_access_project(project_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public."Project" p
    LEFT JOIN public."Team" t ON p."teamId" = t.id
    WHERE p.id = project_id
    AND (
      p."ownerId" = get_current_profile_id() OR
      (p."teamId" IS NOT NULL AND is_team_member_with_role(p."teamId", 'viewer'))
    )
  );
$$;

COMMIT;
