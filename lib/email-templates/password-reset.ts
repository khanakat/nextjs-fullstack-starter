export interface PasswordResetEmailData {
  name: string;
  resetUrl: string;
  expiresIn: string;
}

export const passwordResetEmailTemplate = (data: PasswordResetEmailData) => {
  return {
    subject: "Reset Your Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello ${data.name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in ${data.expiresIn}.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          ${data.resetUrl}
        </p>
      </div>
    `,
    text: `
      Password Reset Request
      
      Hello ${data.name},
      
      We received a request to reset your password. Visit the following link to create a new password:
      ${data.resetUrl}
      
      This link will expire in ${data.expiresIn}.
      
      If you didn't request this password reset, please ignore this email.
    `,
  };
};
