
'use server';

import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { UserProfile, ActionResponse } from '@/types/index';
import { revalidatePath } from 'next/cache';

export async function updateProfileServerAction(formData: FormData): Promise<ActionResponse<UserProfile>> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const updates: Partial<Pick<UserProfile, 'username' | 'profilePictureUrl'>> = {};
  const newUsername = formData.get('username') as string | null;
  const newProfilePicUrl = formData.get('profilePictureUrl') as string | null;

  if (newUsername !== null && newUsername.trim() !== '') {
    if (newUsername.length < 3 || newUsername.length > 30) {
        return {success: false, error: "Username must be between 3 and 30 characters."};
    }
    const existingUserWithUsername = await prisma.profile.findFirst({
        where: {
            username: newUsername.trim(),
            NOT: { id: user.id }
        }
    });
    if (existingUserWithUsername) {
        return {success: false, error: "Username is already taken."};
    }
    updates.username = newUsername.trim();
  }
  
  if (newProfilePicUrl !== null) {
    if (newProfilePicUrl.trim() !== '') {
        try {
            new URL(newProfilePicUrl); 
            updates.profilePictureUrl = newProfilePicUrl;
        } catch (_) {
            return { success: false, error: "Invalid profile picture URL format."};
        }
    } else {
        updates.profilePictureUrl = null; 
    }
  }


  if (Object.keys(updates).length === 0) {
    return { success: false, error: 'No updates provided' };
  }

  try {
    let profile = await prisma.profile.findUnique({ where: { id: user.id } });
    if (!profile) {
        profile = await prisma.profile.create({
            data: {
                id: user.id,
                email: user.email || '', 
                username: user.email?.split('@')[0] || `user_${Date.now()}`,
                ...(updates as any) 
            }
        });
    } else {
        profile = await prisma.profile.update({
            where: { id: user.id },
            data: updates as any, // Cast to any to satisfy Prisma's type requirements
        });
    }

    revalidatePath('/profile'); 
    revalidatePath('/reviewer'); // If navbar showing profile info is on /reviewer page

    return { success: true, data: profile as UserProfile, message: 'Profile updated successfully!' };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
        return { success: false, error: 'This username is already taken. Please choose another.' };
    }
    return { success: false, error: 'Failed to update profile. Please try again.' };
  }
}