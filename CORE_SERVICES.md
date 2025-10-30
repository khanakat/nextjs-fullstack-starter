# Core Services Documentation

This document provides an overview of the core services implemented in this Next.js fullstack starter.

## 🚀 Overview

The core services include:
- **Email System**: Multi-provider email service with fallback support
- **Queue System**: Redis-based background job processing
- **PDF Generation**: Dynamic PDF creation with templates
- **Error Handling**: Comprehensive error management with retry logic
- **Health Monitoring**: System health checks and metrics

## 📧 Email System

### Features
- Multi-provider support (Resend, SendGrid)
- Automatic fallback between providers
- Template-based emails
- Queue-based sending for reliability
- Comprehensive error handling

### Configuration
```env
# Email Providers
RESEND_API_KEY=your_resend_api_key
SENDGRID_API_KEY=your_sendgrid_api_key

# Email Settings
EMAIL_FROM=noreply@yourapp.com
EMAIL_FROM_NAME="Your App Name"
```

### Usage
```typescript
import { emailService } from '@/lib/email/email-service';

// Send simple email
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome to our app!</h1>',
  text: 'Welcome to our app!'
});

// Send template-based email
await emailService.sendTemplateEmail('welcome', 'user@example.com', {
  firstName: 'John',
  lastName: 'Doe',
  appName: 'Your App'
});
```

### Available Templates
- `welcome`: Welcome new users
- `password-reset`: Password reset instructions
- `report-notification`: Report generation notifications
- `system-alert`: System alerts and notifications

## 🔄 Queue System

### Features
- Redis-based job queues using BullMQ
- Multiple queue types (email, export, notification)
- Job priorities and retry logic
- Worker management and scaling
- Queue monitoring and statistics

### Configuration
```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Queue Settings
QUEUE_CONCURRENCY=5
QUEUE_MAX_RETRIES=3
QUEUE_RETRY_DELAY=5000
```

### Usage
```typescript
import { QueueHelpers } from '@/lib/queue';

// Add email job
await QueueHelpers.sendEmail({
  to: 'user@example.com',
  subject: 'Hello',
  text: 'Hello World!'
});

// Add export job
await QueueHelpers.addExportJob({
  type: 'EXPORT_DATA',
  format: 'pdf',
  data: exportData,
  userId: 'user123'
});
```

### Queue Types
- **Email Queue**: Email sending jobs
- **Export Queue**: Data export and report generation
- **Notification Queue**: Push notifications and alerts

## 📄 PDF Generation

### Features
- Template-based PDF generation
- Custom PDF creation with jsPDF
- Multiple report templates
- Chart and table support
- Metadata and styling options

### Usage
```typescript
import { pdfService } from '@/lib/pdf/pdf-service';

// Generate from template
const result = await pdfService.generateFromTemplate('user-report', userData);

// Generate custom PDF
const customResult = await pdfService.generateCustom({
  title: 'Custom Report',
  data: myData,
  options: {
    format: 'a4',
    orientation: 'portrait'
  }
});
```

### Available Templates
- `user-report`: User data reports
- `analytics-report`: Analytics and metrics
- `export-summary`: Data export summaries
- `financial-report`: Financial data reports
- `system-health`: System health reports
- `custom-report`: Flexible custom reports

## ⚠️ Error Handling

### Features
- Centralized error management
- Automatic retry logic
- Error categorization
- Logging and monitoring
- User-friendly error messages

### Error Types
- `ValidationError`: Input validation failures
- `AuthenticationError`: Authentication issues
- `AuthorizationError`: Permission denied
- `NotFoundError`: Resource not found
- `ConflictError`: Data conflicts
- `RateLimitError`: Rate limiting
- `ExternalServiceError`: Third-party service issues
- `DatabaseError`: Database operations
- `FileSystemError`: File operations

### Usage
```typescript
import { ErrorHandler, AppError } from '@/lib/error-handling';

try {
  // Your code here
} catch (error) {
  const handled = await ErrorHandler.handle(error, {
    context: 'user-registration',
    userId: 'user123'
  });
  
  if (!handled.recovered) {
    throw new AppError.ValidationError('Registration failed', {
      field: 'email',
      code: 'INVALID_EMAIL'
    });
  }
}
```

## 🏥 Health Monitoring

### Endpoints
- `GET /api/health` - Basic health check
- `GET /api/health?detailed=true` - Detailed system status

### Monitored Services
- Database connectivity
- Redis connectivity
- Email providers status
- Queue system health
- External service availability

## 🚀 Getting Started

### 1. Environment Setup
Copy `.env.example` to `.env` and configure your services:

```bash
cp .env.example .env
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Redis (Required for queues)
```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or install locally
# Windows: Download from https://redis.io/download
# macOS: brew install redis
# Linux: sudo apt-get install redis-server
```

### 4. Initialize Services
The services will auto-initialize when the application starts. You can also manually initialize:

```typescript
import { applicationStartup } from '@/lib/startup';

await applicationStartup.initialize();
```

### 5. Test Services
Run the test script to verify everything is working:

```bash
node test-services.js
```

## 📊 Monitoring and Debugging

### Queue Dashboard
Access the queue dashboard at `/api/queue` (requires authentication)

### Health Status
Check system health at `/api/health?detailed=true`

### Logs
All services use structured logging. Check your console or log files for detailed information.

### Common Issues

#### Redis Connection Issues
- Ensure Redis is running
- Check `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT` configuration
- Verify network connectivity

#### Email Provider Issues
- Verify API keys are correct
- Check provider status pages
- Review rate limits and quotas

#### PDF Generation Issues
- Ensure sufficient memory for large datasets
- Check file permissions for temporary files
- Verify jsPDF dependencies

## 🔧 Advanced Configuration

### Custom Email Templates
Create new templates in `lib/email/templates/`:

```typescript
export const myCustomTemplate = {
  name: 'my-custom',
  subject: 'Custom Subject',
  html: `<h1>Hello {{name}}!</h1>`,
  text: `Hello {{name}}!`,
  variables: ['name']
};
```

### Custom PDF Templates
Add new templates in `lib/pdf/report-templates.ts`:

```typescript
export const myReportTemplate: ReportTemplate = {
  name: 'my-report',
  title: 'My Custom Report',
  description: 'Custom report description',
  options: {
    format: 'a4',
    orientation: 'portrait',
    // ... other options
  }
};
```

### Custom Queue Workers
Create new workers in `lib/queue/workers/`:

```typescript
export async function processMyJob(job: Job<MyJobPayload>) {
  // Your job processing logic
}
```

## 🤝 Contributing

When adding new features:
1. Follow existing patterns and conventions
2. Add proper error handling
3. Include tests
4. Update documentation
5. Ensure TypeScript types are correct

## 📝 License

This project is licensed under the MIT License.