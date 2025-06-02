import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface WelcomeEmailData {
  username: string;
  email: string;
}

export interface TeamInviteEmailData {
  inviterName: string;
  teamName: string;
  inviteLink: string;
  recipientEmail: string;
}

export interface PasswordResetEmailData {
  username: string;
  resetLink: string;
}

export class EmailService {
  private readonly from: string;

  constructor() {
    this.from = process.env.EMAIL_FROM || 'hello@creavibe.pro';
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email send');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      // Ensure at least one of html or text is provided
      if (!options.html && !options.text) {
        throw new Error('Either html or text content must be provided');
      }

      const emailData: any = {
        from: options.from || this.from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
      };

      // Add content fields only if they exist
      if (options.html) {
        emailData.html = options.html;
      }
      if (options.text) {
        emailData.text = options.text;
      }

      const { data, error } = await resend.emails.send(emailData);

      if (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
      }

      console.log('Email sent successfully:', data?.id);
      return { success: true, id: data?.id };
    } catch (error) {
      console.error('Email service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(data: WelcomeEmailData) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to AI Code Reviewer</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px 0;">
              <h1 style="color: #2563eb; margin: 0;">Welcome to AI Code Reviewer</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1e40af; margin-top: 0;">Hello ${data.username}! 👋</h2>
              
              <p>Welcome to AI Code Reviewer! We're excited to have you on board.</p>
              
              <p>With AI Code Reviewer, you can:</p>
              <ul style="color: #4b5563;">
                <li>Get instant feedback from leading AI models (GPT-4, Claude, Gemini)</li>
                <li>Review code with different depth levels</li>
                <li>Collaborate with your team</li>
                <li>Track and manage code quality over time</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to Dashboard
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                If you have any questions, feel free to reach out to our support team.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px 0; color: #9ca3af; font-size: 12px;">
              <p>© 2024 AI Code Reviewer. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Welcome to AI Code Reviewer, ${data.username}!

We're excited to have you on board. With AI Code Reviewer, you can get instant feedback from leading AI models, collaborate with your team, and track code quality over time.

Get started: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

If you have any questions, feel free to reach out to our support team.

© 2024 AI Code Reviewer. All rights reserved.
    `;

    return this.sendEmail({
      to: data.email,
      subject: 'Welcome to AI Code Reviewer! 🚀',
      html,
      text,
    });
  }

  /**
   * Send team invitation email
   */
  async sendTeamInviteEmail(data: TeamInviteEmailData) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Team Invitation - AI Code Reviewer</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px 0;">
              <h1 style="color: #2563eb; margin: 0;">Team Invitation</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1e40af; margin-top: 0;">You're invited to join a team! 🎉</h2>
              
              <p><strong>${data.inviterName}</strong> has invited you to join the <strong>${data.teamName}</strong> team on AI Code Reviewer.</p>
              
              <p>Join your team to:</p>
              <ul style="color: #4b5563;">
                <li>Collaborate on code reviews</li>
                <li>Share projects and insights</li>
                <li>Work together on improving code quality</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.inviteLink}" 
                   style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                This invitation will expire in 7 days. If you don't want to join this team, you can safely ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px 0; color: #9ca3af; font-size: 12px;">
              <p>© 2024 AI Code Reviewer. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
You're invited to join a team!

${data.inviterName} has invited you to join the ${data.teamName} team on AI Code Reviewer.

Accept invitation: ${data.inviteLink}

This invitation will expire in 7 days. If you don't want to join this team, you can safely ignore this email.

© 2024 AI Code Reviewer. All rights reserved.
    `;

    return this.sendEmail({
      to: data.recipientEmail,
      subject: `Invitation to join ${data.teamName} team`,
      html,
      text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - AI Code Reviewer</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px 0;">
              <h1 style="color: #2563eb; margin: 0;">Password Reset</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1e40af; margin-top: 0;">Reset Your Password</h2>
              
              <p>Hello ${data.username},</p>
              
              <p>We received a request to reset your password for your AI Code Reviewer account.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.resetLink}" 
                   style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                This link will expire in 1 hour for security reasons. If you didn't request a password reset, you can safely ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px 0; color: #9ca3af; font-size: 12px;">
              <p>© 2024 AI Code Reviewer. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Reset Your Password

Hello ${data.username},

We received a request to reset your password for your AI Code Reviewer account.

Reset your password: ${data.resetLink}

This link will expire in 1 hour for security reasons. If you didn't request a password reset, you can safely ignore this email.

© 2024 AI Code Reviewer. All rights reserved.
    `;

    return this.sendEmail({
      to: data.username, // Assuming username is email
      subject: 'Reset your AI Code Reviewer password',
      html,
      text,
    });
  }
}

// Export a singleton instance
export const emailService = new EmailService();
