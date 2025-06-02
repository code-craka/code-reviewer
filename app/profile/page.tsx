import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/navigation";
import ProfileClientPage from "./ProfileClientPage";
import type { UserProfile } from "@/types/index";
import { MotionMain } from "@/components/ui/motion-wrapper";
import Spinner from "@/components/ui/spinner";
import { createOrGetProfile } from "@/lib/auth/profile-service";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?next=/profile"); // Ensure redirect includes next path
  }
  let userProfileData: UserProfile | null = null;

  if (user) {
    try {
      // Use the profile service to get or create the profile
      const profileResult = await createOrGetProfile(user);
      if (profileResult.success && profileResult.data) {
        userProfileData = profileResult.data as UserProfile;
      } else {
        console.error("Failed to get or create profile:", profileResult.error);
      }
    } catch (error) {
      console.error("Error getting profile:", error);
    }
  } else {
    redirect("/login");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation 
        initialUser={user ?? null}
        profilePictureUrl={userProfileData?.profilePictureUrl}
        username={userProfileData?.username}
      />
      <MotionMain className="w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 pt-20">
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary animate-fade-in">
            User Profile
          </h1>
        </header>
        {userProfileData ? (
          <ProfileClientPage initialProfile={userProfileData} />
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-center bg-card rounded-lg">
            <Spinner className="h-10 w-10 text-primary mb-4" />
            <p className="text-muted-foreground">
              Loading profile or creating one...
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              If this persists, please try refreshing the page.
            </p>
          </div>
        )}
      </MotionMain>
    </div>
  );
}
