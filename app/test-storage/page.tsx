'use client';

import { useState, useEffect } from 'react';
import { uploadAvatar, deleteAvatar, getAvatarUrl, AVATARS_BUCKET, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/supabase/storage';
import { safeStorageOperation } from '@/lib/utils/error-handler';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import PlaceholderImage from '@/components/ui/PlaceholderImage';

export default function TestStoragePage() {
  const [file, setFile] = useState<File | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [setupResult, setSetupResult] = useState<any>(null);
  const [setupLoading, setSetupLoading] = useState(false);

  // Get the current user ID on component mount
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (profile && profile.role === 'admin') {
          setIsAdmin(true);
        }
      } else if (error) {
        toast({
          title: 'Authentication Error',
          description: 'Please sign in to test storage functionality',
          variant: 'destructive',
        });
      }
    };
    
    fetchUser();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Validate file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast({
          title: 'File Too Large',
          description: `File size exceeds the maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
        toast({
          title: 'Invalid File Type',
          description: `File type ${selectedFile.type} is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !userId) {
      toast({
        title: 'Error',
        description: 'Please select a file and ensure you are logged in',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const path = await safeStorageOperation(
        () => uploadAvatar(file, userId),
        null,
        'Failed to upload avatar'
      );
      
      if (path) {
        setAvatarPath(path);
        const url = getAvatarUrl(path);
        setAvatarUrl(url);
        
        toast({
          title: 'Success',
          description: 'Avatar uploaded successfully',
        });
      }
    } catch (error) {
      console.error('Error in handleUpload:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!avatarPath) {
      toast({
        title: 'Error',
        description: 'No avatar to delete',
        variant: 'destructive',
      });
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const success = await safeStorageOperation(
        () => deleteAvatar(avatarPath),
        false,
        'Failed to delete avatar'
      );
      
      if (success) {
        setAvatarPath(null);
        setAvatarUrl(null);
        setFile(null);
        
        toast({
          title: 'Success',
          description: 'Avatar deleted successfully',
        });
      }
    } catch (error) {
      console.error('Error in handleDelete:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetupStorage = async () => {
    if (!isAdmin) {
      toast({
        title: 'Unauthorized',
        description: 'Only admin users can set up storage',
        variant: 'destructive',
      });
      return;
    }
    
    setSetupLoading(true);
    
    try {
      const response = await fetch('/api/admin/setup-storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      setSetupResult(result);
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Storage bucket and policies set up successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to set up storage',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error setting up storage:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <Toaster />
      <h1 className="text-3xl font-bold mb-8">Storage Test Page</h1>
      
      {userId ? (
        <div className="space-y-8">
          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <p><strong>User ID:</strong> {userId}</p>
            <p><strong>Role:</strong> {isAdmin ? 'Admin' : 'User'}</p>
          </div>
          
          {isAdmin && (
            <div className="p-6 border rounded-lg bg-card">
              <h2 className="text-xl font-semibold mb-4">Admin Controls</h2>
              <Button 
                onClick={handleSetupStorage} 
                disabled={setupLoading}
                className="mb-4"
              >
                {setupLoading ? 'Setting up...' : 'Setup Storage Bucket & Policies'}
              </Button>
              
              {setupResult && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <h3 className="font-medium mb-2">Setup Result:</h3>
                  <pre className="text-xs overflow-auto p-2 bg-background rounded">
                    {JSON.stringify(setupResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          
          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">Avatar Upload</h2>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    onError={() => {
                      setAvatarUrl(null);
                      toast({
                        title: 'Error',
                        description: 'Failed to load avatar image',
                        variant: 'destructive',
                      });
                    }}
                  />
                ) : (
                  <PlaceholderImage 
                    text={userId.substring(0, 2)}
                    width={96}
                    height={96}
                    rounded={true}
                    initials={true}
                  />
                )}
              </div>
              
              <div className="flex-1">
                <Input 
                  type="file" 
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  onChange={handleFileChange}
                  className="mb-2"
                />
                <div className="text-xs text-muted-foreground mb-4">
                  Max size: {MAX_FILE_SIZE / 1024 / 1024}MB. Allowed types: {ALLOWED_FILE_TYPES.join(', ')}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpload} 
                    disabled={!file || isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete} 
                    disabled={!avatarPath || isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </div>
            
            {avatarPath && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <h3 className="font-medium mb-2">Storage Details:</h3>
                <p><strong>Bucket:</strong> {AVATARS_BUCKET}</p>
                <p><strong>Path:</strong> {avatarPath}</p>
                <p><strong>URL:</strong> {avatarUrl}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 border rounded-lg bg-card text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="mb-4">Please sign in to test storage functionality</p>
          <Button asChild>
            <a href="/login?next=/test-storage">Sign In</a>
          </Button>
        </div>
      )}
    </div>
  );
}
