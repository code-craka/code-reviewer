
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import ProfileClientPage from './ProfileClientPage';
import prisma from '@/lib/prisma';
import type { UserProfile } from '@/types/index';
import { motion } from 'framer-motion'; // Import motion
import Spinner from '@/components/ui/spinner';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    redirect('/login?next=/profile'); // Ensure redirect includes next path
  }
  const { user } = session;
  let userProfileData: UserProfile | null = null;

  if (user) {
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
    });
    if (profile) {
        userProfileData = profile as UserProfile;
    } else {
        try {
            const newProfile = await prisma.profile.create({
                data: {
                    id: user.id,
                    email: user.email || '',
                    username: user.user_metadata?.user_name || user.email?.split('@')[0] || `user_${Date.now()}`,
                    profilePictureUrl: user.user_metadata?.avatar_url || null
                }
            });
            userProfileData = newProfile as UserProfile;
        } catch (e: any) {
            if (e.code === 'P2002') { 
                 const existingProfile = await prisma.profile.findUnique({ where: { id: user.id } });
                 userProfileData = existingProfile as UserProfile;
            } else {
                console.error("Error ensuring profile exists:", e);
            }
        }
    }
  } else {
    redirect('/login'); 
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 mt-4"
      >
        <header className="mb-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-primary animate-fade-in">User Profile</h1>
        </header>
        {userProfileData ? (
             <ProfileClientPage initialProfile={userProfileData} />
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-center bg-card rounded-lg">
              <Spinner className="h-10 w-10 text-primary mb-4" />
              <p className="text-muted-foreground">Loading profile or creating one...</p>
              <p className="text-xs text-muted-foreground mt-2">If this persists, please try refreshing the page.</p>
          </div>
        )}
      </motion.main>
    </div>
  );
}