
'use client';

import React, { useState, useEffect, useTransition, FormEvent } from 'react';
import { UserProfile, ActionResponse } from '@/types/index';
import Spinner from '@/components/ui/spinner';
import AlertComponent from '@/components/ui/customalert';
import { Edit3, Save, ShieldCheck, BarChart3, Image as LucideImage, X } from 'lucide-react'; // Replaced UserCircle2, Added X
// NextImage import removed as it's not being used
import { MOCK_AVATAR_URL_BASE } from '@/lib/constants';
import { updateProfileServerAction } from './actions'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

interface ProfileClientPageProps {
  initialProfile: UserProfile;
}

const ProfileClientPage: React.FC<ProfileClientPageProps> = ({ initialProfile }) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isPending, startTransition] = useTransition();

  const [newProfilePicUrl, setNewProfilePicUrl] = useState<string>(initialProfile.profilePictureUrl || '');
  const [usernameInput, setUsernameInput] = useState<string>(initialProfile.username || '');
  
  const [isEditingPic, setIsEditingPic] = useState<boolean>(false);
  const [isEditingUsername, setIsEditingUsername] = useState<boolean>(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  useEffect(() => {
    setProfile(initialProfile);
    setNewProfilePicUrl(initialProfile.profilePictureUrl || '');
    setUsernameInput(initialProfile.username || '');
  }, [initialProfile]);

  const handleProfileUpdate = async (formData: FormData) => {
    startTransition(async () => {
      const result: ActionResponse<UserProfile> = await updateProfileServerAction(formData);
      if (result.success && result.data) {
        setProfile(result.data);
        setNewProfilePicUrl(result.data.profilePictureUrl || '');
        setUsernameInput(result.data.username || '');
        setFeedback({ type: 'success', message: result.message || 'Profile updated successfully!' });
        setIsEditingPic(false);
        setIsEditingUsername(false);
      } else {
        setFeedback({ type: 'error', message: result.error as string || 'Failed to update profile.' });
      }
    });
  };

  const handlePicUrlSubmit = (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('profilePictureUrl', newProfilePicUrl); // Send empty string if user clears it
    handleProfileUpdate(formData);
  };

  const handleUsernameSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setFeedback({ type: 'error', message: 'Username cannot be empty.' });
      return;
    }
    const formData = new FormData();
    formData.append('username', usernameInput);
    handleProfileUpdate(formData);
  };

  const displayUsername = profile.username || profile.email?.split('@')[0] || 'User';
  const displayProfilePic = profile.profilePictureUrl || `${MOCK_AVATAR_URL_BASE}${encodeURIComponent(displayUsername)}`;
  const initials = displayUsername.substring(0, 2).toUpperCase();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start">
            <div className="relative mb-4 sm:mb-0 sm:mr-6">
              <Avatar className="w-32 h-32 border-4 border-primary shadow-lg">
                <AvatarImage src={displayProfilePic} alt={displayUsername} />
                <AvatarFallback className="text-4xl">{initials}</AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsEditingPic(!isEditingPic)}
                className="absolute -bottom-1 -right-1 bg-background rounded-full shadow-md"
                aria-label="Edit profile picture"
              >
                <LucideImage size={18} />
              </Button>
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start">
                {isEditingUsername ? (
                  <form onSubmit={handleUsernameSubmit} className="flex items-baseline gap-2">
                    <Input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="text-3xl font-bold h-auto p-0 border-0 border-b-2 border-primary rounded-none focus-visible:ring-0 focus-visible:border-primary bg-transparent"
                      required
                    />
                    <Button type="submit" variant="ghost" size="icon" disabled={isPending} className="text-green-500 hover:text-green-400">
                      {isPending ? <Spinner className="h-5 w-5" /> : <Save size={20}/>}
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => { setIsEditingUsername(false); setUsernameInput(profile.username || '');}} className="text-destructive hover:text-red-400">
                       <X size={20}/>
                    </Button>
                  </form>
                ) : (
                  <>
                    <CardTitle className="text-3xl">{displayUsername}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditingUsername(true)} className="ml-2 text-primary hover:text-primary/80">
                      <Edit3 size={20} />
                    </Button>
                  </>
                )}
              </div>
              <CardDescription>{profile.email || 'No email provided'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {feedback && <AlertComponent type={feedback.type} title={feedback.type.toUpperCase()} message={feedback.message} onClose={() => setFeedback(null)} className="mb-4"/>}

          {isEditingPic && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handlePicUrlSubmit} className="p-6 bg-muted/50 rounded-lg shadow-sm space-y-3"
            >
              <Label htmlFor="profilePicUrl" className="text-base font-semibold">Update Profile Picture URL</Label>
              <Input
                id="profilePicUrl"
                type="url"
                value={newProfilePicUrl}
                onChange={(e) => setNewProfilePicUrl(e.target.value)}
                placeholder="https://example.com/your-image.png or leave blank to remove"
              />
              <Button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                {isPending ? <Spinner className="h-5 w-5 mr-2" /> : <Save size={18} className="mr-2" />}
                Save Picture
              </Button>
            </motion.form>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><ShieldCheck size={22} className="mr-2 text-primary"/>Account Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Password changes can be initiated via Supabase's "Forgot Password" flow if email is configured.
                Direct password change from within the app is not implemented in this version.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><BarChart3 size={22} className="mr-2 text-primary"/>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Token usage tracking per API call is displayed with each review.
                A comprehensive summary of your overall token usage is planned for a future update.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProfileClientPage;

// Remember to add ShadCN UI components:
// npx shadcn-ui@latest add button input label card avatar
// AlertComponent from components/ui/CustomAlert.tsx
// Spinner from components/ui/Spinner.tsx
// NextImage from 'next/image' is used
// MOCK_AVATAR_URL_BASE from '@/lib/constants'
// X icon from lucide-react