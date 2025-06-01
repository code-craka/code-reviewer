import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navigation as Navbar } from "@/components/navigation";
import ReviewerClientPage from "./ReviewerClientPage";
import prisma from "@/lib/prisma";
import type { UserProfile, Project } from "@/types/index";
import { Suspense, ReactElement } from "react";
import Spinner from "@/components/ui/spinner";
import { motion } from "framer-motion"; // Import motion

export const dynamic = "force-dynamic";

async function ReviewerPageContent(): Promise<ReactElement> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    redirect("/login?next=/reviewer");
  }

  const { user } = session;
  let projectsData: Project[] = [];

  const profileResult = await prisma.profile.findUnique({
    where: { id: user.id },
  });

  if (!profileResult) {
    try {
      await prisma.profile.create({
        data: {
          id: user.id,
          email: user.email || "",
          username:
            user.user_metadata?.user_name ||
            (user.email ? user.email.split("@")[0] : "user"),
          profilePictureUrl: user.user_metadata?.avatar_url,
        },
      });
    } catch (error) {
      console.warn(
        "Could not create profile on the fly for user:",
        user.id,
        error,
      );
    }
  }

  projectsData = (await prisma.project.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
  })) as Project[];

  return <ReviewerClientPage initialProjects={projectsData} />;
}

export default async function ReviewerPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let userProfile: UserProfile | null = null;
  if (session?.user) {
    const profileResult = await prisma.profile.findUnique({
      where: { id: session.user.id },
    });
    if (profileResult) userProfile = profileResult as UserProfile;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        initialUser={session?.user ?? null}
        profilePictureUrl={userProfile?.profilePictureUrl}
        username={userProfile?.username}
      />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 mt-4"
      >
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary animate-fade-in">
            AI Code Reviewer
          </h1>
          <p
            className="text-muted-foreground mt-2 text-sm sm:text-base animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Get instant feedback on your code from leading AI models.
          </p>
        </header>
        <Suspense
          fallback={
            <div className="flex flex-col justify-center items-center p-10 min-h-[400px]">
              <Spinner className="h-12 w-12 text-primary" />
              <p className="ml-4 text-lg text-muted-foreground mt-4">
                Loading Reviewer...
              </p>
            </div>
          }
        >
          <ReviewerPageContent />
        </Suspense>
      </motion.main>
    </div>
  );
}
