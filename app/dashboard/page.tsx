import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOrGetProfile } from "@/lib/auth/profile-service";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import DashboardClientPage from "./DashboardClientPage";
import { MotionMain } from "@/components/ui/motion-wrapper";
import prisma from "@/lib/prisma";

async function getProjects(userId: string) {
  return await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
  });
}

async function getDashboardStats(userId: string) {
  const [totalProjects, totalReviews, issuesCount] = await Promise.all([
    prisma.project.count({ where: { ownerId: userId } }),
    prisma.review.count({ 
      where: { project: { ownerId: userId } }
    }),
    prisma.reviewResult.count({
      where: { 
        review: { project: { ownerId: userId } }
      }
    }),
  ]);

  const issuesFixed = Math.floor(issuesCount * 0.75); // Mock calculation

  return {
    totalProjects,
    totalReviews,
    issuesFound: issuesCount,
    issuesFixed,
  };
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Get the user profile
  const profileResponse = await createOrGetProfile(user);
  
  if (!profileResponse.success || !profileResponse.data) {
    console.error("Failed to get profile:", profileResponse.error);
    redirect("/login");
  }

  const profile = profileResponse.data;

  // Get dashboard data
  const [projects, dashboardStats] = await Promise.all([
    getProjects(profile.id),
    getDashboardStats(profile.id),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardNavigation
        initialUser={user}
        profilePictureUrl={profile.profilePictureUrl}
        username={profile.username}
        currentPage="dashboard"
      />
      <MotionMain className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <DashboardClientPage
          initialProjects={projects}
          dashboardStats={dashboardStats}
        />
      </MotionMain>
    </div>
  );
}
