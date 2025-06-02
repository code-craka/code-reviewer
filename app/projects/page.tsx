import { redirect } from "next/navigation";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import ProjectsClientPage from "./ProjectsClientPage";
import { MotionMain } from "@/components/ui/motion-wrapper";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOrGetProfile } from "@/lib/auth/profile-service";
import { getUserProjects } from "@/app/actions/projectActions";

export const dynamic = "force-dynamic";

async function getProjects() {
  const projects = await getUserProjects();
  return projects.data || [];
}

export default async function ProjectsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?next=/dashboard"); // Projects are now part of dashboard
  }

  // Get or create user profile
  const profileResult = await createOrGetProfile(user);
  if (!profileResult.success || !profileResult.data) {
    console.error("Failed to create/get profile:", profileResult.error);
    redirect("/login?error=profile-error");
  }

  const profile = profileResult.data;
  const projects = await getProjects();

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardNavigation
        initialUser={user ?? null}
        profilePictureUrl={profile.profilePictureUrl}
        username={profile.username}
        currentPage="projects"
      />
      <MotionMain className="flex-grow pt-16">
        <ProjectsClientPage initialProjects={projects} />
      </MotionMain>
    </div>
  );
}
