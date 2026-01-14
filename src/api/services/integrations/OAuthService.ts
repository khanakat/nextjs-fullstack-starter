/**
 * TODO: Implement OAuthService
 * Placeholder to prevent TypeScript compilation errors
 */
export class OAuthService {
  async connect() { return { success: true, connectionId: 'temp-id' }; }
  async revokeConnection() { return { success: true }; }
  async getAuthorizationUrl() { return 'https://example.com/oauth'; }
}
