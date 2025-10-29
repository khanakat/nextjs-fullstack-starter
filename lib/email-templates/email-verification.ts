export interface EmailVerificationEmailData {
  name: string;
  verificationUrl: string;
  expiresIn: string;
}

export const emailVerificationEmailTemplate = (
  data: EmailVerificationEmailData,
) => {
  return {
    subject: "Verify Your Email Address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Hello ${data.name},</p>
        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verificationUrl}" 
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>This link will expire in ${data.expiresIn}.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          ${data.verificationUrl}
        </p>
      </div>
    `,
    text: `
      Email Verification
      
      Hello ${data.name},
      
      Thank you for signing up! Please verify your email address by visiting:
      ${data.verificationUrl}
      
      This link will expire in ${data.expiresIn}.
      
      If you didn't create an account, please ignore this email.
    `,
  };
};
