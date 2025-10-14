# 📧 Email System

The template includes a comprehensive email system powered by **Resend**, providing reliable transactional email delivery with beautiful, responsive templates.

## 🌟 Features

- ✅ **Transactional Emails**: Welcome, password reset, verification emails
- ✅ **Pre-built Templates**: Professional, responsive email designs
- ✅ **Retry Logic**: Automatic retry with exponential backoff
- ✅ **Bulk Sending**: Support for newsletters and announcements
- ✅ **Error Handling**: Comprehensive error tracking and logging
- ✅ **Type Safety**: Full TypeScript support for all email operations

## 📦 Email Templates

### Available Templates
- **Welcome Email**: Onboarding for new users
- **Email Verification**: Confirm email addresses
- **Password Reset**: Secure password recovery
- **Notifications**: General purpose notifications
- **Custom Emails**: Flexible template system

## 🛠️ Configuration

### Environment Variables
```env
# Resend configuration
RESEND_API_KEY="re_your_resend_api_key"

# Email settings
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_REPLY_TO="support@yourdomain.com"

# App settings (used in templates)
NEXT_PUBLIC_APP_NAME="Your App Name"
NEXT_PUBLIC_APP_URL="https://yourapp.com"
```

### Getting Resend API Key
1. Visit [resend.com](https://resend.com) and create an account
2. Verify your domain (or use resend.dev for testing)
3. Generate an API key in the dashboard
4. Add the key to your `.env.local` file

## 🚀 Usage Examples

### Basic Email Service
```tsx
import { EmailService } from '@/lib/email-service';

// Send welcome email
await EmailService.sendWelcomeEmail(
  'user@example.com',
  'John Doe'
);

// Send password reset
await EmailService.sendPasswordResetEmail(
  'user@example.com',
  'John Doe',
  'secure-reset-token'
);

// Send notification
await EmailService.sendNotification(
  'user@example.com',
  'New Message',
  'You have a new message in your inbox.',
  'https://app.com/messages',
  'View Message'
);
```

### Custom Email Template
```tsx
import { sendEmail } from '@/lib/email';

const customTemplate = {
  subject: "Welcome to Our Platform!",
  html: `
    <div style="font-family: Arial, sans-serif;">
      <h1>Welcome!</h1>
      <p>Thank you for joining our platform.</p>
      <a href="https://app.com/dashboard" 
         style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Get Started
      </a>
    </div>
  `,
  text: "Welcome! Thank you for joining our platform. Get started: https://app.com/dashboard"
};

await sendEmail({
  to: 'user@example.com',
  subject: customTemplate.subject,
  html: customTemplate.html,
  text: customTemplate.text
});
```

### Bulk Email Sending
```tsx
import { EmailService } from '@/lib/email-service';

const recipients = [
  'user1@example.com',
  'user2@example.com',
  'user3@example.com'
];

await EmailService.sendBulkEmail(
  recipients,
  'Monthly Newsletter',
  '<h1>Newsletter</h1><p>Your monthly update...</p>',
  'Newsletter: Your monthly update...'
);
```

## 🎨 Template Customization

### Modifying Existing Templates
Edit templates in `lib/email-templates.ts`:

```tsx
export const welcomeEmailTemplate = (data: {
  name: string;
  appName: string;
}): EmailTemplate => ({
  subject: `Welcome to ${data.appName}! 🎉`,
  html: `
    <!-- Your custom HTML -->
    <div style="max-width: 600px; margin: 0 auto;">
      <h1>Welcome, ${data.name}!</h1>
      <!-- Add your branding, colors, and content -->
    </div>
  `,
  text: `Welcome to ${data.appName}, ${data.name}!`
});
```

### Creating New Templates
```tsx
export const customTemplate = (data: {
  title: string;
  content: string;
}): EmailTemplate => ({
  subject: data.title,
  html: `
    <div style="font-family: Arial, sans-serif;">
      <h1>${data.title}</h1>
      <div>${data.content}</div>
    </div>
  `,
  text: `${data.title}\n\n${data.content}`
});
```

## 🔧 Advanced Features

### Email Hooks Integration
Add email hooks to your authentication flow:

```tsx
// In your auth callback or user creation
import { EmailService } from '@/lib/email-service';

export async function createUser(userData: UserData) {
  const user = await db.user.create({
    data: userData
  });

  // Send welcome email
  await EmailService.sendWelcomeEmail(
    user.email,
    user.name || 'New User'
  );

  return user;
}
```

### Error Handling
```tsx
try {
  await EmailService.sendWelcomeEmail(email, name);
} catch (error) {
  console.error('Welcome email failed:', error);
  // Handle error - maybe queue for retry, log to monitoring service
  throw new Error('Email delivery failed');
}
```

### Email Queue (Advanced)
For high-volume applications, consider implementing an email queue:

```tsx
// Example with a simple queue
interface EmailJob {
  type: 'welcome' | 'reset' | 'notification';
  to: string;
  data: any;
}

const emailQueue: EmailJob[] = [];

export async function queueEmail(job: EmailJob) {
  emailQueue.push(job);
  // Process queue in background
  processEmailQueue();
}
```

## 📱 Testing

### Interactive Testing
Visit `/dashboard` to test email functionality:
- Pre-built template previews
- Custom email composition  
- Real email sending to your account

### Development Testing
```tsx
// Test in development
if (process.env.NODE_ENV === 'development') {
  await EmailService.sendWelcomeEmail(
    'test@example.com',
    'Test User'
  );
}
```

## 🛡️ Security & Best Practices

### Rate Limiting
- Resend has built-in rate limiting
- Implement application-level limits for user-triggered emails
- Use queues for bulk operations

### Template Security
- Always sanitize user inputs in templates
- Use parameterized templates instead of string concatenation
- Validate email addresses before sending

### Privacy Compliance
- Include unsubscribe links in marketing emails
- Respect user email preferences
- Implement proper data retention policies

## 📊 Monitoring & Analytics

### Email Delivery Tracking
```tsx
// Track email delivery status
const result = await EmailService.sendWelcomeEmail(email, name);
console.log('Email ID:', result.data?.id);

// Log to your analytics service
analytics.track('email_sent', {
  type: 'welcome',
  userId: user.id,
  emailId: result.data?.id
});
```

### Error Logging
```tsx
try {
  await EmailService.sendEmail(emailData);
} catch (error) {
  // Log to monitoring service (Sentry, DataDog, etc.)
  logger.error('Email delivery failed', {
    error: error.message,
    emailData,
    userId: user.id
  });
}
```

## 🔗 Integration Examples

### With Authentication
```tsx
// Clerk webhook handler
export async function POST(req: Request) {
  const { type, data } = await req.json();
  
  if (type === 'user.created') {
    await EmailService.sendWelcomeEmail(
      data.email_addresses[0].email_address,
      data.first_name || 'New User'
    );
  }
}
```

### With Database Events
```tsx
// Prisma middleware for email triggers
prisma.$use(async (params, next) => {
  const result = await next(params);
  
  if (params.model === 'Post' && params.action === 'create') {
    // Send notification to followers
    await EmailService.sendNotification(
      followerEmails,
      'New Post Published',
      `${result.author.name} published: ${result.title}`
    );
  }
  
  return result;
});
```

## 📚 Learn More

- [Resend Documentation](https://resend.com/docs)
- [Email Best Practices](https://resend.com/docs/send/best-practices)
- [HTML Email Design Guide](https://www.campaignmonitor.com/dev-resources/guides/coding-html-emails/)
- [GDPR Email Compliance](https://gdpr.eu/email-compliance/)