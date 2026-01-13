/**
 * Auth Response DTO
 * Data Transfer Object for authentication response
 */
export interface AuthResponseDto {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
    emailVerified: boolean;
  };
  session?: {
    sessionId: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
  };
  message?: string;
}
