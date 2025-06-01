'use server';

import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Team, TeamMember, Invitation, ActionResponse } from '@/types';
import { revalidatePath } from 'next/cache';

/**
 * Get all teams for the current user
 */
export async function getUserTeams(): Promise<ActionResponse<Team[]>> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    // Get teams the user owns
    const ownedTeams = await prisma.team.findMany({
      where: { ownerId: user.id },
      include: {
        members: {
          include: {
            user: true
          }
        },
        projects: true
      }
    });

    // Get teams the user is a member of (but doesn't own)
    const memberTeams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
            NOT: {
              team: {
                ownerId: user.id
              }
            }
          }
        }
      },
      include: {
        owner: true,
        members: {
          include: {
            user: true
          }
        },
        projects: true
      }
    });

    // Combine and return all teams
    return { 
      success: true, 
      data: [...ownedTeams, ...memberTeams] as Team[]
    };
  } catch (error) {
    console.error('Error fetching user teams:', error);
    return { success: false, error: 'Failed to fetch teams' };
  }
}

/**
 * Get a team by ID
 */
export async function getTeam(teamId: string): Promise<ActionResponse<Team>> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    // Get the team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: true,
        members: {
          include: {
            user: true
          }
        },
        projects: true,
        invitations: {
          where: {
            status: 'pending'
          }
        }
      }
    });

    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    // Check if user is a member of the team
    const isMember = team.ownerId === user.id || team.members.some(member => member.userId === user.id);
    
    if (!isMember) {
      return { success: false, error: 'You do not have access to this team' };
    }

    return { success: true, data: team as Team };
  } catch (error) {
    console.error('Error fetching team:', error);
    return { success: false, error: 'Failed to fetch team' };
  }
}

/**
 * Create a new team
 */
export async function createTeam(formData: FormData): Promise<ActionResponse<Team>> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string || null;

  if (!name || name.trim() === '') {
    return { success: false, error: 'Team name is required' };
  }

  try {
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'owner'
          }
        }
      },
      include: {
        members: true
      }
    });

    revalidatePath('/teams');
    return { 
      success: true, 
      data: team as Team, 
      message: 'Team created successfully!' 
    };
  } catch (error) {
    console.error('Error creating team:', error);
    return { success: false, error: 'Failed to create team' };
  }
}

/**
 * Update a team
 */
export async function updateTeam(formData: FormData): Promise<ActionResponse<Team>> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const teamId = formData.get('teamId') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string || null;

  if (!teamId) {
    return { success: false, error: 'Team ID is required' };
  }

  if (!name || name.trim() === '') {
    return { success: false, error: 'Team name is required' };
  }

  try {
    // Get the team to check ownership
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    if (team.ownerId !== user.id) {
      return { success: false, error: 'Only the team owner can update the team' };
    }

    // Update the team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: name.trim(),
        description
      },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    });

    revalidatePath('/teams');
    revalidatePath(`/teams/${teamId}`);
    
    return { 
      success: true, 
      data: updatedTeam as Team, 
      message: 'Team updated successfully!' 
    };
  } catch (error) {
    console.error('Error updating team:', error);
    return { success: false, error: 'Failed to update team' };
  }
}

/**
 * Delete a team
 */
export async function deleteTeam(teamId: string): Promise<ActionResponse<void>> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    // Get the team to check ownership
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    if (team.ownerId !== user.id) {
      return { success: false, error: 'Only the team owner can delete the team' };
    }

    // Delete the team
    await prisma.team.delete({
      where: { id: teamId }
    });

    revalidatePath('/teams');
    
    return { 
      success: true, 
      message: 'Team deleted successfully!' 
    };
  } catch (error) {
    console.error('Error deleting team:', error);
    return { success: false, error: 'Failed to delete team' };
  }
}

/**
 * Invite a user to a team
 */
export async function inviteUserToTeam(formData: FormData): Promise<ActionResponse<Invitation>> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const teamId = formData.get('teamId') as string;
  const email = formData.get('email') as string;
  const role = formData.get('role') as 'admin' | 'member' | 'viewer';

  if (!teamId) {
    return { success: false, error: 'Team ID is required' };
  }

  if (!email || !email.includes('@')) {
    return { success: false, error: 'Valid email is required' };
  }

  if (!role || !['admin', 'member', 'viewer'].includes(role)) {
    return { success: false, error: 'Valid role is required' };
  }

  try {
    // Get the team to check permissions
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true
      }
    });

    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    // Check if current user is the owner or an admin
    const currentUserMember = team.members.find(m => m.userId === user.id);
    if (!currentUserMember || (currentUserMember.role !== 'owner' && currentUserMember.role !== 'admin')) {
      return { success: false, error: 'You do not have permission to invite users to this team' };
    }

    // Check if user is already a member
    const existingUser = await prisma.profile.findFirst({
      where: { email }
    });

    if (existingUser) {
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: existingUser.id
        }
      });

      if (existingMember) {
        return { success: false, error: 'User is already a member of this team' };
      }
    }

    // Check for existing invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        teamId,
        email,
        status: 'pending'
      }
    });

    if (existingInvitation) {
      return { success: false, error: 'An invitation has already been sent to this email' };
    }

    // Create the invitation
    const invitation = await prisma.invitation.create({
      data: {
        teamId,
        email,
        role,
        // Store inviter ID in a custom field or metadata
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'pending',
        token: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      }
    });

    // TODO: Send invitation email

    revalidatePath(`/teams/${teamId}`);
    
    return { 
      success: true, 
      data: invitation as Invitation, 
      message: 'Invitation sent successfully!' 
    };
  } catch (error) {
    console.error('Error inviting user to team:', error);
    return { success: false, error: 'Failed to send invitation' };
  }
}

/**
 * Accept a team invitation
 */
export async function acceptTeamInvitation(token: string): Promise<ActionResponse<TeamMember>> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    // Get the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        team: true
      }
    });

    if (!invitation) {
      return { success: false, error: 'Invitation not found or has expired' };
    }

    if (invitation.status !== 'pending') {
      return { success: false, error: 'Invitation has already been used' };
    }

    // Check if the invitation email matches the user's email
    const userProfile = await prisma.profile.findUnique({
      where: { id: user.id }
    });

    if (!userProfile || userProfile.email !== invitation.email) {
      return { success: false, error: 'This invitation was sent to a different email address' };
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: invitation.teamId,
        userId: user.id
      }
    });

    if (existingMember) {
      // Mark the invitation as accepted
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' }
      });

      return { success: false, error: 'You are already a member of this team' };
    }

    // Create the team member
    const teamMember = await prisma.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId: user.id,
        role: invitation.role
      }
    });

    // Mark the invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'accepted' }
    });

    revalidatePath('/teams');
    revalidatePath(`/teams/${invitation.teamId}`);
    
    return { 
      success: true, 
      data: teamMember as TeamMember, 
      message: `You have joined ${invitation.team.name}!` 
    };
  } catch (error) {
    console.error('Error accepting team invitation:', error);
    return { success: false, error: 'Failed to accept invitation' };
  }
}

/**
 * Decline a team invitation
 */
export async function declineTeamInvitation(token: string): Promise<ActionResponse<void>> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    // Get the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token }
    });

    if (!invitation) {
      return { success: false, error: 'Invitation not found or has expired' };
    }

    if (invitation.status !== 'pending') {
      return { success: false, error: 'Invitation has already been used' };
    }

    // Check if the invitation email matches the user's email
    const userProfile = await prisma.profile.findUnique({
      where: { id: user.id }
    });

    if (!userProfile || userProfile.email !== invitation.email) {
      return { success: false, error: 'This invitation was sent to a different email address' };
    }

    // Mark the invitation as declined
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'declined' }
    });

    return { 
      success: true,
      message: 'Invitation declined'
    };
  } catch (error) {
    console.error('Error declining team invitation:', error);
    return {
      success: false,
      error: 'Failed to decline invitation'
    };
  }
}

/**
 * Remove a member from a team
 */
export async function removeTeamMember(teamId: string, memberId: string): Promise<ActionResponse<void>> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    // Get the team to check permissions
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true
      }
    });

    if (!team) {
      return {
        success: false,
        error: 'Team not found'
      };
    }

    // Get the member to be removed
    const memberToRemove = team.members.find(m => m.id === memberId);
    if (!memberToRemove) {
      return {
        success: false,
        error: 'Team member not found'
      };
    }

    // Check if current user is the owner or an admin
    const currentUserMember = team.members.find(m => m.userId === user.id);
    if (!currentUserMember || (currentUserMember.role !== 'owner' && currentUserMember.role !== 'admin')) {
      return {
        success: false,
        error: 'You do not have permission to remove members from this team'
      };
    }

    // Cannot remove the owner
    if (memberToRemove.userId === team.ownerId) {
      return {
        success: false,
        error: 'Cannot remove the team owner'
      };
    }

    // Admins cannot remove other admins
    if (currentUserMember.role === 'admin' && memberToRemove.role === 'admin') {
      return {
        success: false,
        error: 'Admins cannot remove other admins'
      };
    }

    // Remove the member
    await prisma.teamMember.delete({
      where: { id: memberId }
    });

    revalidatePath(`/teams/${teamId}`);
    
    return {
      success: true,
      message: 'Team member removed successfully'
    };
  } catch (error) {
    console.error('Error removing team member:', error);
    return {
      success: false,
      error: 'Failed to remove team member'
    };
  }
}

/**
 * Update a team member's role
 */
export async function updateTeamMemberRole(
  teamId: string, 
  memberId: string, 
  role: 'admin' | 'member' | 'viewer'
): Promise<ActionResponse<TeamMember>> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    // Get the team to check permissions
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true
      }
    });

    if (!team) {
      return {
        success: false,
        error: 'Team not found'
      };
    }

    // Get the member to be updated
    const memberToUpdate = team.members.find(m => m.id === memberId);
    if (!memberToUpdate) {
      return {
        success: false,
        error: 'Team member not found'
      };
    }

    // Check if current user is the owner
    if (team.ownerId !== user.id) {
      return {
        success: false,
        error: 'Only the team owner can change member roles'
      };
    }

    // Cannot change the owner's role
    if (memberToUpdate.userId === team.ownerId) {
      return {
        success: false,
        error: 'Cannot change the team owner\'s role'
      };
    }

    // Update the member's role
    const updatedMember = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role }
    });

    revalidatePath(`/teams/${teamId}`);
    
    return {
      success: true,
      data: updatedMember as TeamMember,
      message: 'Team member role updated successfully'
    };
  } catch (error) {
    console.error('Error updating team member role:', error);
    return {
      success: false,
      error: 'Failed to update team member role'
    };
  }
}
