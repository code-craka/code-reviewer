import { NextRequest, NextResponse } from 'next/server';
import { createOrGetProfile } from '@/lib/auth/profile-service';

export async function POST(request: NextRequest) {
  try {
    // Get the webhook payload
    const payload = await request.json();
    const { type, record } = payload;

    console.log('Received auth webhook:', type);

    // Only handle user creation events
    if (type !== 'INSERT' || !record) {
      return NextResponse.json({ success: true });
    }

    const user = record;
    console.log('Processing new user:', user.id);

    // Use the profile service to create or get the profile
    // This ensures consistency with the rest of the application
    // and handles welcome email sending automatically
    const profileResult = await createOrGetProfile(user);
    
    if (!profileResult.success || !profileResult.data) {
      console.error('Failed to create profile for user:', user.id);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create user profile' 
        },
        { status: 500 }
      );
    }

    const profile = profileResult.data;
    console.log('Profile created/retrieved for user:', user.id, 'with username:', profile.username);

    return NextResponse.json({ 
      success: true, 
      profile: { 
        id: profile.id, 
        username: profile.username 
      } 
    });

  } catch (error) {
    console.error('Error in auth webhook:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
