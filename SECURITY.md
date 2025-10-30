# Security Features Documentation

## Overview

This document provides comprehensive documentation for the security features implemented in the Next.js Fullstack Starter application. The security system includes rate limiting, API key management, security monitoring, and comprehensive security headers.

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [Rate Limiting](#rate-limiting)
3. [API Key Management](#api-key-management)
4. [Security Monitoring](#security-monitoring)
5. [Security Headers](#security-headers)
6. [Brute Force Protection](#brute-force-protection)
7. [Security Dashboard](#security-dashboard)
8. [API Endpoints](#api-endpoints)
9. [Configuration](#configuration)
10. [Best Practices](#best-practices)

## Security Architecture

The security system is built with a layered approach:

```
┌─────────────────────────────────────────┐
│           Security Middleware           │
├─────────────────────────────────────────┤
│  Rate Limiting │ Headers │ Validation   │
├─────────────────────────────────────────┤
│           Security Service              │
├─────────────────────────────────────────┤
│    Monitoring │ Logging │ Analytics     │
├─────────────────────────────────────────┤
│           Database Layer                │
└─────────────────────────────────────────┘
```

### Core Components

- **Security Middleware**: Request-level security enforcement
- **Security Service**: Business logic for security operations
- **Security Dashboard**: UI for monitoring and management
- **API Key System**: External integration security

## Rate Limiting

### Implementation

Rate limiting is implemented using a token bucket algorithm with Redis backing for distributed environments.

```typescript
// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
  standardHeaders: true,
  legacyHeaders: false,
};
```

### Rate Limit Tiers

| Tier          | Requests/Hour | Use Case                     |
| ------------- | ------------- | ---------------------------- |
| Anonymous     | 100           | Unauthenticated users        |
| Authenticated | 1000          | Logged-in users              |
| Premium       | 5000          | Premium organization members |
| API Key       | 10000         | External integrations        |

### Configuration

Rate limits can be configured per:

- IP Address
- User ID
- Organization ID
- API Key

```typescript
interface RateLimitConfig {
  windowMs: number;
  max: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}
```

## API Key Management

### Features

- **Key Generation**: Secure API key creation with configurable permissions
- **Permission System**: Granular access control (READ, WRITE, DELETE, ADMIN)
- **Rate Limiting**: Per-key rate limiting
- **Usage Tracking**: Monitor API key usage and analytics
- **Expiration**: Configurable key expiration dates

### API Key Structure

```typescript
interface ApiKey {
  id: string;
  name: string;
  keyHash: string; // SHA-256 hash of the actual key
  permissions: ApiKeyPermission[];
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  rateLimit: {
    requests: number;
    windowMs: number;
  };
  usageCount: number;
  isActive: boolean;
}
```

### Permissions

```typescript
enum ApiKeyPermission {
  READ = "READ",
  WRITE = "WRITE",
  DELETE = "DELETE",
  ADMIN = "ADMIN",
}
```

### Usage

```bash
# Create API key
curl -X POST /api/security/api-keys \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Integration Key",
    "permissions": ["READ", "WRITE"],
    "expiresAt": "2024-12-31T23:59:59Z"
  }'

# Use API key
curl -X GET /api/data \
  -H "X-API-Key: <api-key>"
```

## Security Monitoring

### Event Types

The system monitors and logs various security events:

```typescript
enum SecurityEventType {
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  BRUTE_FORCE_ATTEMPT = "BRUTE_FORCE_ATTEMPT",
  SUSPICIOUS_REQUEST = "SUSPICIOUS_REQUEST",
  INVALID_API_KEY = "INVALID_API_KEY",
  CORS_VIOLATION = "CORS_VIOLATION",
  SQL_INJECTION_ATTEMPT = "SQL_INJECTION_ATTEMPT",
  XSS_ATTEMPT = "XSS_ATTEMPT",
}
```

### Event Structure

```typescript
interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: "low" | "medium" | "high" | "critical";
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  timestamp: string;
  resolved: boolean;
  organizationId: string;
  details: Record<string, any>;
}
```

### Metrics Tracked

- Total requests per time period
- Blocked requests count
- Rate limit violations
- Brute force attempts
- Top targeted endpoints
- Geographic distribution of threats

## Security Headers

### Implemented Headers

```typescript
const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};
```

### CSP Configuration

Content Security Policy is configured to prevent XSS attacks:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https://api.clerk.dev;
```

## Brute Force Protection

### Features

- **Login Attempt Monitoring**: Track failed login attempts
- **Account Lockout**: Temporary account suspension after threshold
- **IP-based Blocking**: Block suspicious IP addresses
- **Progressive Delays**: Increasing delays between attempts

### Configuration

```typescript
const bruteForceConfig = {
  maxAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  progressiveDelay: true,
  ipBlockDuration: 60 * 60 * 1000, // 1 hour
};
```

## Security Dashboard

### Features

- **Real-time Monitoring**: Live security event feed
- **Metrics Visualization**: Charts and graphs for security metrics
- **Event Management**: Resolve and investigate security events
- **API Key Management**: Create, view, and revoke API keys
- **Analytics**: Security trends and patterns

### Dashboard Sections

1. **Overview**: Key security metrics and alerts
2. **Events**: Detailed security event log
3. **API Keys**: Manage external integration keys
4. **Analytics**: Security trends and insights

### Access Control

Dashboard access is restricted to:

- Organization administrators
- Users with security management permissions
- System administrators

## API Endpoints

### Security Metrics

```
GET /api/security/metrics
Query Parameters:
- organizationId: string (required)
- range: '1h' | '24h' | '7d' | '30d' (default: '24h')

Response:
{
  "metrics": {
    "totalRequests": number,
    "blockedRequests": number,
    "rateLimitViolations": number,
    "bruteForceAttempts": number,
    "topTargetedEndpoints": Array<{endpoint: string, count: number}>
  }
}
```

### Security Events

```
GET /api/security/events
Query Parameters:
- organizationId: string (required)
- limit: number (default: 50)
- offset: number (default: 0)

Response:
{
  "events": SecurityEvent[]
}

PATCH /api/security/events
Body:
{
  "eventId": string,
  "resolved": boolean
}
```

### API Keys

```
GET /api/security/api-keys
Query Parameters:
- organizationId: string (required)

POST /api/security/api-keys
Body:
{
  "name": string,
  "permissions": ApiKeyPermission[],
  "expiresAt"?: string,
  "rateLimit"?: {
    "requests": number,
    "windowMs": number
  }
}

DELETE /api/security/api-keys/:id
```

## Configuration

### Environment Variables

```bash
# Security Configuration
SECURITY_RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
SECURITY_RATE_LIMIT_MAX=100
SECURITY_BRUTE_FORCE_MAX_ATTEMPTS=5
SECURITY_BRUTE_FORCE_LOCKOUT_DURATION=900000  # 15 minutes

# Redis Configuration (for distributed rate limiting)
REDIS_URL=redis://localhost:6379

# Security Headers
SECURITY_HEADERS_ENABLED=true
SECURITY_CSP_ENABLED=true
```

### Database Schema

```sql
-- Security Events Table
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  endpoint VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  organization_id UUID REFERENCES organizations(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys Table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  permissions TEXT[] NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  rate_limit_requests INTEGER DEFAULT 1000,
  rate_limit_window_ms INTEGER DEFAULT 3600000,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);
```

## Best Practices

### Development

1. **Never log sensitive data** in security events
2. **Use environment variables** for configuration
3. **Implement proper error handling** to avoid information leakage
4. **Regular security audits** of dependencies
5. **Monitor security metrics** continuously

### Production

1. **Enable all security headers** in production
2. **Use HTTPS everywhere** with proper certificates
3. **Configure rate limiting** based on expected traffic
4. **Set up monitoring alerts** for security events
5. **Regular backup** of security logs

### API Key Management

1. **Rotate API keys regularly** (recommended: every 90 days)
2. **Use least privilege principle** for permissions
3. **Monitor API key usage** for anomalies
4. **Implement key expiration** for temporary access
5. **Secure key storage** on client side

### Incident Response

1. **Immediate response** to critical security events
2. **Document all incidents** for future reference
3. **Regular security training** for team members
4. **Automated alerting** for high-severity events
5. **Post-incident analysis** and improvements

## Troubleshooting

### Common Issues

1. **Rate limiting too aggressive**: Adjust limits based on usage patterns
2. **False positive security events**: Fine-tune detection algorithms
3. **API key authentication failures**: Check key format and permissions
4. **Dashboard not loading**: Verify organization permissions

### Debug Mode

Enable debug logging for security components:

```bash
DEBUG=security:* npm run dev
```

### Health Checks

Monitor security system health:

```bash
curl /api/health/security
```

## Support

For security-related issues or questions:

1. Check this documentation first
2. Review security event logs
3. Contact the development team
4. For critical security issues, follow the incident response procedure

---

**Last Updated**: January 2024  
**Version**: 1.0.0
