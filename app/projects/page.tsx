import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navigation as Navbar } from "@/components/navigation";
import ProjectsClientPage from "./ProjectsClientPage";
import prisma from "@/lib/prisma";
import type { UserProfile, Project } from "@/types/index";
import { motion } from "framer-motion"; // Import motion

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    redirect("/login?next=/projects"); // Ensure redirect includes next path
  }
  const { user } = session;
  let userProfile: UserProfile | null = null;
  let projects: Project[] = [];

  if (user) {
    const profileResult = await prisma.profile.findUnique({
      where: { id: user.id },
    });
    if (profileResult) {
      userProfile = profileResult as UserProfile;
    }
    projects = (await prisma.project.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
    })) as Project[];
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        initialUser={user ?? null}
        profilePictureUrl={userProfile?.profilePictureUrl}
        username={userProfile?.username}
      />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-grow" // Added flex-grow to ensure it takes space
      >
        <ProjectsClientPage initialProjects={projects} />
      </motion.main>
    </div>
  );
}
