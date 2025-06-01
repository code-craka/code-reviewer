// Service for team-related operations
import prisma from '@/lib/prisma';
import { Team, TeamMember, Invitation, ActionResponse } from '@/types';

/**
 * Get a team by its ID
 */
export async function getTeamById(teamId: string): Promise<Team | null> {
  try {
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
        invitations: true
      }
    });
    
    if (team) {
      return {
        ...team,
        members: team.members.map(member => ({
          ...member,
          role: member.role as 'owner' | 'admin' | 'member' | 'viewer'
        })) as TeamMember[],
        invitations: team.invitations.map(invitation => ({
          ...invitation,
          role: invitation.role as 'admin' | 'member' | 'viewer',
          status: invitation.status as 'pending' | 'accepted' | 'declined' | 'expired'
        })) as Invitation[]
      } as Team;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching team:', error);
    return null;
  }
}

/**
 * Get all teams for a user (both owned and member of)
 */
export async function getUserTeams(userId: string): Promise<Team[]> {
  try {
    // Get teams the user owns
    const ownedTeams = await prisma.team.findMany({
      where: { ownerId: userId },
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
            userId: userId,
            NOT: {
              team: {
                ownerId: userId
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

    // Combine and return all teams with proper type casting
    const typedOwnedTeams = ownedTeams.map(team => ({
      ...team,
      members: team.members.map(member => ({
        ...member,
        role: member.role as 'owner' | 'admin' | 'member' | 'viewer'
      })) as TeamMember[]
    })) as Team[];
    
    const typedMemberTeams = memberTeams.map(team => ({
      ...team,
      members: team.members.map(member => ({
        ...member,
        role: member.role as 'owner' | 'admin' | 'member' | 'viewer'
      })) as TeamMember[]
    })) as Team[];
    
    return [...typedOwnedTeams, ...typedMemberTeams];
  } catch (error) {
    console.error('Error fetching user teams:', error);
    return [];
  }
}

/**
 * Get all pending invitations for a user by email
 */
export async function getPendingInvitationsByEmail(email: string): Promise<Invitation[]> {
  try {
    const invitations = await prisma.invitation.findMany({
      where: {
        email: email,
        status: 'pending'
      },
      include: {
        team: true
      }
    });
    
    return invitations.map(invitation => ({
      ...invitation,
      role: invitation.role as 'admin' | 'member' | 'viewer',
      status: invitation.status as 'pending' | 'accepted' | 'declined' | 'expired'
    })) as Invitation[];
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    return [];
  }
}

/**
 * Generate a unique invitation token
 */
function generateInvitationToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Create a new team
 */
export async function createTeam(
  name: string, 
  description: string | null, 
  ownerId: string
): Promise<ActionResponse<Team>> {
  try {
    const team = await prisma.team.create({
      data: {
        name,
        description,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: 'owner'
          }
        }
      }
    });
    
    // For newly created teams, we need to fetch the team with members included
    const teamWithMembers = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    });
    
    return { 
      success: true, 
      data: {
        ...team,
        members: teamWithMembers?.members.map(member => ({
          ...member,
          role: member.role as 'owner' | 'admin' | 'member' | 'viewer'
        })) || []
      } as Team, 
      message: 'Team created successfully' 
    };
  } catch (error) {
    console.error('Error creating team:', error);
    return { 
      success: false, 
      error: 'Failed to create team' 
    };
  }
}

/**
 * Invite a user to a team
 */
export async function inviteUserToTeam(
  teamId: string,
  email: string,
  role: string = 'member'
): Promise<ActionResponse<Invitation>> {
  try {
    // Check if invitation already exists
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        teamId,
        email,
        status: 'pending'
      }
    });

    if (existingInvitation) {
      return {
        success: false,
        error: 'An invitation has already been sent to this email'
      };
    }

    // Create expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the invitation
    const invitation = await prisma.invitation.create({
      data: {
        teamId,
        email,
        role,
        token: generateInvitationToken(),
        expiresAt
      }
    });

    return {
      success: true,
      data: {
        ...invitation,
        role: invitation.role as 'admin' | 'member' | 'viewer',
        status: invitation.status as 'pending' | 'accepted' | 'declined' | 'expired'
      } as Invitation,
      message: 'Invitation sent successfully'
    };
  } catch (error) {
    console.error('Error inviting user to team:', error);
    return {
      success: false,
      error: 'Failed to send invitation'
    };
  }
}

/**
 * Accept a team invitation
 */
export async function acceptTeamInvitation(
  token: string,
  userId: string
): Promise<ActionResponse<TeamMember>> {
  try {
    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token }
    });

    if (!invitation) {
      return {
        success: false,
        error: 'Invitation not found'
      };
    }

    if (invitation.status !== 'pending') {
      return {
        success: false,
        error: `Invitation has already been ${invitation.status}`
      };
    }

    if (invitation.expiresAt < new Date()) {
      // Update invitation status to expired
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' }
      });
      
      return {
        success: false,
        error: 'Invitation has expired'
      };
    }

    // Check if user is already a member of the team
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: invitation.teamId,
        userId
      }
    });

    if (existingMember) {
      // Update invitation status to accepted
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' }
      });
      
      return {
        success: false,
        error: 'You are already a member of this team'
      };
    }

    // Add user to team and update invitation status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create team member
      const teamMember = await tx.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId,
          role: invitation.role
        }
      });

      // Update invitation status
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' }
      });

      return teamMember;
    });

    return {
      success: true,
      data: {
        ...result,
        role: result.role as 'owner' | 'admin' | 'member' | 'viewer'
      } as TeamMember,
      message: 'You have joined the team'
    };
  } catch (error) {
    console.error('Error accepting team invitation:', error);
    return {
      success: false,
      error: 'Failed to accept invitation'
    };
  }
}

/**
 * Remove a member from a team
 */
export async function removeTeamMember(
  teamId: string,
  userId: string,
  currentUserId: string
): Promise<ActionResponse<void>> {
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

    // Check if current user is the owner or an admin
    const currentUserMember = team.members.find(m => m.userId === currentUserId);
    if (!currentUserMember || (currentUserMember.role !== 'owner' && currentUserMember.role !== 'admin')) {
      return {
        success: false,
        error: 'You do not have permission to remove members from this team'
      };
    }

    // Cannot remove the owner
    if (team.ownerId === userId) {
      return {
        success: false,
        error: 'Cannot remove the team owner'
      };
    }

    // Remove the member
    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      }
    });

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
