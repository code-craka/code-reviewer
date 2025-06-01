// app/api/admin/setup-storage/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Constants
const AVATARS_BUCKET = 'avatars';

// Define policy types for better type safety
type StorageOperation = 'INSERT' | 'SELECT' | 'UPDATE' | 'DELETE';

interface PolicyConfig {
  name: string;
  definition: string;
  operation: StorageOperation;
}

// Define the policies for the avatars bucket
const AVATAR_POLICIES: PolicyConfig[] = [
  {
    name: 'Allow users to upload their own avatars',
    definition: `(auth.uid() = (storage.foldername(name))[1])`,
    operation: 'INSERT',
  },
  {
    name: 'Allow public read access to avatars',
    definition: 'true', // Allow anyone to read
    operation: 'SELECT',
  },
  {
    name: 'Allow users to update their own avatars',
    definition: `(auth.uid() = (storage.foldername(name))[1])`,
    operation: 'UPDATE',
  },
  {
    name: 'Allow users to delete their own avatars',
    definition: `(auth.uid() = (storage.foldername(name))[1])`,
    operation: 'DELETE',
  },
];

export async function POST(_request: Request) {
  console.log('Starting storage setup process...');
  try {
    // Authenticate the user and check for admin role
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json({ 
        error: 'Unauthorized: Authentication required',
        details: userError?.message 
      }, { status: 401 });
    }
    
    console.log(`User authenticated: ${user.id}`);
    
    // Check if user has admin role by querying the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ 
        error: 'Error fetching user profile',
        details: profileError.message 
      }, { status: 500 });
    }
    
    if (!profile || profile.role !== 'admin') {
      console.warn(`Access denied for user ${user.id} with role ${profile?.role || 'undefined'}`);
      return NextResponse.json({ 
        error: 'Forbidden: Admin access required',
        currentRole: profile?.role || 'undefined'
      }, { status: 403 });
    }
    
    console.log(`Admin role verified for user: ${user.id}`);
    
    // Proceed with admin operations using service role key
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing required environment variables for Supabase admin client');
      return NextResponse.json({ 
        error: 'Server configuration error: Missing Supabase credentials' 
      }, { status: 500 });
    }
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Checking if bucket exists...');
    // Create the avatars bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabaseAdmin
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return NextResponse.json({ 
        error: 'Failed to list storage buckets',
        details: bucketsError.message 
      }, { status: 500 });
    }

    const bucketExists = buckets.some(bucket => bucket.name === AVATARS_BUCKET);
    console.log(`Bucket ${AVATARS_BUCKET} exists: ${bucketExists}`);

    if (!bucketExists) {
      console.log(`Creating bucket: ${AVATARS_BUCKET}`);
      const { error: createBucketError } = await supabaseAdmin
        .storage
        .createBucket(AVATARS_BUCKET, {
          public: false, // Not public by default, we'll control access with policies
          fileSizeLimit: 1024 * 1024 * 2, // 2MB limit for avatar images
        });

      if (createBucketError) {
        console.error('Error creating bucket:', createBucketError);
        return NextResponse.json({ 
          error: 'Failed to create storage bucket',
          details: createBucketError.message 
        }, { status: 500 });
      }
      console.log(`Bucket ${AVATARS_BUCKET} created successfully`);
    }

    // Set up storage policies for the avatars bucket
    console.log('Setting up storage policies...');
    const policyResults = [];
    
    for (const policy of AVATAR_POLICIES) {
      console.log(`Creating policy: ${policy.name} for operation ${policy.operation}`);
      try {
        const { error: policyError } = await supabaseAdmin.rpc('create_storage_policy', {
          bucket_name: AVATARS_BUCKET,
          policy_name: policy.name,
          policy_definition: policy.definition,
          operation: policy.operation,
          allow: true
        });

        if (policyError) {
          console.warn(`Warning: Error creating policy ${policy.name}:`, policyError);
          policyResults.push({
            name: policy.name,
            success: false,
            error: policyError.message
          });
        } else {
          console.log(`Policy ${policy.name} created successfully`);
          policyResults.push({
            name: policy.name,
            success: true
          });
        }
      } catch (policyErr: any) {
        console.warn(`Exception creating policy ${policy.name}:`, policyErr);
        policyResults.push({
          name: policy.name,
          success: false,
          error: policyErr.message || 'Unknown error'
        });
      }
    }

    // Update bucket configuration
    console.log('Updating bucket configuration...');
    const { error: s3Error } = await supabaseAdmin.storage.updateBucket(AVATARS_BUCKET, {
      public: false,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      fileSizeLimit: 1024 * 1024 * 2, // 2MB
    });

    if (s3Error) {
      console.error('Error updating bucket configuration:', s3Error);
      return NextResponse.json({ 
        error: 'Failed to update bucket configuration',
        details: s3Error.message,
        policyResults // Include the policy results even if bucket update failed
      }, { status: 500 });
    }

    console.log('Storage setup completed successfully');
    return NextResponse.json({
      success: true,
      message: 'Storage bucket and policies configured successfully',
      bucketName: AVATARS_BUCKET,
      policyResults,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Unexpected error setting up storage:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred during storage setup',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
