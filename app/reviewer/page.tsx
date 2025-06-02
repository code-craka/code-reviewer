import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createOrGetProfile } from "@/lib/auth/profile-service";
import { UserProfile } from "@/types/index";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import { MotionMain } from "@/components/ui/motion-wrapper";
import ReviewerClientPage from "./ReviewerClientPage";
import { getUserProjects } from "@/app/actions/projectActions";

export default async function ReviewerPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Single authentication check
  if (userError || !user) {
    redirect("/login?next=/reviewer");
  }

  // Get user profile for navbar
  const profileResult = await createOrGetProfile(user);
  let userProfile: UserProfile | null = null;
  if (profileResult.success && profileResult.data) {
    userProfile = profileResult.data as UserProfile;
  }

  // Get user projects
  const projects = await getUserProjects();

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardNavigation
        initialUser={user ?? null}
        profilePictureUrl={userProfile?.profilePictureUrl}
        username={userProfile?.username}
        currentPage="reviewer"
      />
      <MotionMain className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 pt-20">
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary animate-fade-in">
            AI Code Reviewer
          </h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
            Get instant feedback on your code from leading AI models
          </p>
        </header>
        <ReviewerClientPage initialProjects={projects.data || []} />
      </MotionMain>
    </div>
  );
}
