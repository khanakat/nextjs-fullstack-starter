# Scheduled Reports System - Complete Guide

## 🎯 Overview

A comprehensive automated reporting system that enables users to schedule, monitor, and manage recurring report generation with real-time updates and multi-format delivery. The system provides automated report scheduling with different frequencies, real-time status monitoring via Server-Sent Events (SSE), and robust error handling with demo mode support.

## 🌟 Features

### Core Functionality

- **Automated Scheduling** with multiple frequencies (daily, weekly, monthly, quarterly)
- **Real-time Updates** via Server-Sent Events (SSE) for live status monitoring
- **Multi-format Exports** (PDF, Excel, CSV) with customizable delivery options
- **Email Delivery** to multiple recipients with automated notifications
- **Execution History** with detailed monitoring and performance metrics
- **Demo Mode Support** for testing and development environments
- **Rate Limiting** and robust error handling for production stability
- **Responsive Dashboard** with modern UI and intuitive controls

### User Roles & Permissions

- **Viewer**: View scheduled reports, monitor execution status, access history
- **Report Manager**: Create, edit, and manage scheduled reports, configure delivery settings
- **Admin**: Full access to all scheduled reports, system statistics, and configuration management

### Scheduling Options

- **Daily**: Execute reports every day at specified time
- **Weekly**: Execute reports on specific days of the week
- **Monthly**: Execute reports on specific dates each month
- **Quarterly**: Execute reports at the beginning/end of each quarter
- **Custom Time**: Flexible time configuration for each schedule

## 📦 Components Included

### 1. **Scheduled Reports Dashboard** (`components/scheduled-reports/scheduled-reports-dashboard.tsx`)

Main dashboard for scheduled report management:

- Overview with real-time statistics and connection status
- Tabbed interface for reports list, history, and statistics
- Create new scheduled report functionality
- Real-time updates via SSE connection
- Error boundary for robust error handling

### 2. **Scheduled Reports List** (`components/scheduled-reports/scheduled-reports-list.tsx`)

Interactive list of all scheduled reports:

- Search and filter capabilities (by status, format, frequency)
- Real-time status updates and next execution times
- Quick actions: activate/deactivate, execute now, edit, delete
- Pagination support for large datasets
- Responsive table design with mobile optimization

### 3. **Scheduled Reports History** (`components/scheduled-reports/scheduled-reports-history.tsx`)

Execution history and monitoring:

- Detailed execution logs with timestamps and duration
- Status tracking (pending, running, completed, failed)
- Download links for generated reports
- Performance metrics and statistics
- Advanced filtering by date range and status

### 4. **Scheduled Reports Stats** (`components/scheduled-reports/scheduled-reports-stats.tsx`)

Real-time statistics dashboard:

- Total scheduled reports count
- Active vs inactive reports
- Recent execution statistics
- Success/failure rates
- Performance metrics and trends

### 5. **Create Scheduled Report Dialog** (`components/scheduled-reports/create-scheduled-report-dialog.tsx`)

Report creation and configuration interface:

- Report selection from available templates
- Schedule configuration with frequency options
- Recipient management for email delivery
- Format selection (PDF, Excel, CSV)
- Advanced options and custom settings

## 🚀 Quick Start

### Basic Scheduled Reports Dashboard

```tsx
import { ScheduledReportsDashboard } from "@/components/scheduled-reports/scheduled-reports-dashboard";

function ScheduledReportsPage() {
  return (
    <div className="container mx-auto py-6">
      <ScheduledReportsDashboard />
    </div>
  );
}
```

### Standalone Scheduled Reports List

```tsx
import { ScheduledReportsList } from "@/components/scheduled-reports/scheduled-reports-list";

function ReportsListPage() {
  const handleReportUpdate = (reportId: string) => {
    console.log("Report updated:", reportId);
  };

  return (
    <ScheduledReportsList
      onReportUpdate={handleReportUpdate}
      showCreateButton={true}
      pageSize={20}
    />
  );
}
```

### Real-time Updates Hook

```tsx
import { useScheduledReportsRealtime } from "@/hooks/use-scheduled-reports-realtime";

function MyComponent() {
  const { 
    isConnected, 
    lastUpdate, 
    connectionStatus,
    reconnect 
  } = useScheduledReportsRealtime();

  return (
    <div>
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Badge variant="success">Connected</Badge>
        ) : (
          <Badge variant="destructive">Disconnected</Badge>
        )}
        <Button onClick={reconnect} size="sm">
          Reconnect
        </Button>
      </div>
    </div>
  );
}
```

## 🔧 API Reference

### Scheduled Reports Dashboard Props

```tsx
interface ScheduledReportsDashboardProps {
  className?: string; // Custom CSS classes
  showCreateButton?: boolean; // Show create new report button
  showStats?: boolean; // Show statistics tab
  showHistory?: boolean; // Show history tab
  defaultTab?: "reports" | "history" | "stats"; // Default active tab
  onReportCreate?: (report: ScheduledReport) => void;
}
```

### Scheduled Reports List Props

```tsx
interface ScheduledReportsListProps {
  className?: string; // Custom CSS classes
  showCreateButton?: boolean; // Show create button
  pageSize?: number; // Number of reports per page
  showSearch?: boolean; // Show search functionality
  showFilters?: boolean; // Show filter options
  onReportUpdate?: (reportId: string) => void;
  onReportDelete?: (reportId: string) => void;
}
```

### Scheduled Reports History Props

```tsx
interface ScheduledReportsHistoryProps {
  className?: string; // Custom CSS classes
  pageSize?: number; // Number of history items per page
  showFilters?: boolean; // Show filter options
  showDownloadLinks?: boolean; // Show download buttons
  dateRange?: { from: Date; to: Date }; // Default date range
  onHistoryUpdate?: (historyId: string) => void;
}
```

### Create Scheduled Report Dialog Props

```tsx
interface CreateScheduledReportDialogProps {
  open: boolean; // Dialog open state
  onOpenChange: (open: boolean) => void; // Handle dialog state
  onReportCreated?: (report: ScheduledReport) => void; // Success callback
  availableReports?: Report[]; // Available base reports
  defaultValues?: Partial<CreateScheduledReportRequest>; // Default form values
}
```

## 🔍 Hooks Documentation

### useScheduledReportsRealtime

Real-time connection management for scheduled reports:

```tsx
import { useScheduledReportsRealtime } from "@/hooks/use-scheduled-reports-realtime";

function RealtimeComponent() {
  const {
    isConnected,        // Connection status
    lastUpdate,         // Last update timestamp
    connectionStatus,   // Detailed connection info
    reconnect,          // Manual reconnection
    disconnect          // Manual disconnection
  } = useScheduledReportsRealtime();

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Last Update: {lastUpdate?.toLocaleString()}</p>
      <button onClick={reconnect}>Reconnect</button>
    </div>
  );
}
```

## 🌐 API Endpoints

### Main Scheduled Reports API

```typescript
// GET /api/scheduled-reports - List all scheduled reports
GET /api/scheduled-reports?page=1&limit=10&search=sales&status=active

Response:
{
  "reports": ScheduledReport[],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}

// POST /api/scheduled-reports - Create new scheduled report
POST /api/scheduled-reports
{
  "name": "Weekly Sales Report",
  "description": "Automated weekly sales analysis",
  "reportId": "report-123",
  "schedule": {
    "frequency": "weekly",
    "time": "09:00",
    "dayOfWeek": 1
  },
  "recipients": ["user@example.com"],
  "format": "PDF",
  "isActive": true
}
```

### Individual Report Management

```typescript
// GET /api/scheduled-reports/[id] - Get specific scheduled report
GET /api/scheduled-reports/report-123

// PUT /api/scheduled-reports/[id] - Update scheduled report
PUT /api/scheduled-reports/report-123
{
  "name": "Updated Report Name",
  "isActive": false
}

// DELETE /api/scheduled-reports/[id] - Delete scheduled report
DELETE /api/scheduled-reports/report-123
```

### Report Execution

```typescript
// POST /api/scheduled-reports/[id]/execute - Execute report immediately
POST /api/scheduled-reports/report-123/execute

Response:
{
  "executionId": "exec-456",
  "status": "PENDING",
  "startedAt": "2024-01-15T10:00:00Z"
}
```

### Real-time Updates (SSE)

```typescript
// GET /api/scheduled-reports/stream - Server-Sent Events endpoint
GET /api/scheduled-reports/stream

Events:
- report-updated: When report status changes
- report-executed: When report execution completes
- report-created: When new report is created
- report-deleted: When report is deleted
- heartbeat: Connection keepalive
```

### Statistics API

```typescript
// GET /api/scheduled-reports/stats - Get system statistics
GET /api/scheduled-reports/stats

Response:
{
  "totalReports": 25,
  "activeReports": 18,
  "inactiveReports": 7,
  "recentExecutions": 45,
  "successRate": 94.2,
  "avgExecutionTime": 1250
}
```

### Execution History

```typescript
// GET /api/scheduled-reports/history - Get execution history
GET /api/scheduled-reports/history?page=1&limit=20&status=completed

Response:
{
  "history": ExecutionHistory[],
  "pagination": PaginationInfo
}
```

## 🗄️ Data Models

### ScheduledReport Interface

```typescript
interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  reportId: string;
  schedule: {
    frequency: "daily" | "weekly" | "monthly" | "quarterly";
    time: string; // HH:mm format
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
  };
  recipients: string[]; // Email addresses
  format: "PDF" | "EXCEL" | "CSV";
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  
  // Relations
  report: {
    id: string;
    name: string;
    description?: string;
  };
}
```

### ExecutionHistory Interface

```typescript
interface ExecutionHistory {
  id: string;
  scheduledReportId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
  fileSize?: number; // bytes
  filePath?: string;
  error?: string;
  recipients: string[];
  format: string;
  
  // Relations
  scheduledReport: {
    id: string;
    name: string;
  };
}
```

### Statistics Interface

```typescript
interface ScheduledReportStats {
  totalReports: number;
  activeReports: number;
  inactiveReports: number;
  recentExecutions: number;
  successRate: number; // percentage
  avgExecutionTime: number; // milliseconds
  lastUpdated: Date;
}
```

## ⚙️ Configuration

### Environment Variables

```bash
# Required for scheduled reports functionality
DATABASE_URL="postgresql://..."
CLERK_SECRET_KEY="sk_..."

# Email delivery (optional)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user@example.com"
SMTP_PASS="password"

# Rate limiting configuration
RATE_LIMIT_GENERAL="100"  # requests per minute
RATE_LIMIT_STATS="50"     # requests per minute

# Demo mode (development)
DEMO_MODE="false"
```

### Rate Limiting Configuration

The system includes built-in rate limiting to prevent abuse:

```typescript
// lib/utils/rate-limiting.ts
export const generalRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // requests per window
});

export const statsRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // requests per window
});
```

## 🎨 Styling and Theming

### CSS Custom Properties

```css
:root {
  --scheduled-reports-primary: #3b82f6;
  --scheduled-reports-secondary: #6b7280;
  --scheduled-reports-success: #10b981;
  --scheduled-reports-warning: #f59e0b;
  --scheduled-reports-error: #ef4444;
  --scheduled-reports-background: #f9fafb;
  --scheduled-reports-card: #ffffff;
  --scheduled-reports-border: #e5e7eb;
}
```

### Component Styling

All components use Tailwind CSS classes and are fully responsive:

```tsx
// Example component styling
<div className="space-y-6">
  <Card className="border-0 shadow-sm">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg font-semibold">
        Scheduled Reports
      </CardTitle>
    </CardHeader>
    <CardContent>
      {/* Content */}
    </CardContent>
  </Card>
</div>
```

## 🔧 Troubleshooting

### Common Issues

#### 1. SSE Connection Failures

**Problem**: `net::ERR_ABORTED` errors for SSE stream

**Solution**:
```typescript
// Check connection status
const { isConnected, reconnect } = useScheduledReportsRealtime();

// Manual reconnection
if (!isConnected) {
  reconnect();
}
```

#### 2. Rate Limiting Errors

**Problem**: "Too Many Requests" errors

**Solution**:
```typescript
// Implement exponential backoff
const retryWithBackoff = async (fn: () => Promise<any>, retries = 3) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error.status === 429) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
      return retryWithBackoff(fn, retries - 1);
    }
    throw error;
  }
};
```

#### 3. React State Update Warnings

**Problem**: "Maximum update depth exceeded" errors

**Solution**:
```typescript
// Use useMemo for filtered data
const filteredReports = useMemo(() => {
  if (!scheduledReports || !Array.isArray(scheduledReports)) {
    return [];
  }
  return scheduledReports.filter(/* filter logic */);
}, [scheduledReports, searchTerm]);
```

#### 4. Demo Mode Issues

**Problem**: Reports not showing in demo mode

**Solution**:
```typescript
// Check demo mode configuration
if (process.env.DEMO_MODE === 'true') {
  // Demo data will be returned automatically
  console.log('Running in demo mode');
}
```

### Debug Mode

Enable debug mode for detailed logging:

```typescript
// Set environment variable
process.env.SCHEDULED_REPORTS_DEBUG = 'true';

// Or use debug flag in components
<ScheduledReportsDashboard debug={true} />
```

### Performance Optimization

#### 1. Pagination

Use pagination for large datasets:

```typescript
const [currentPage, setCurrentPage] = useState(1);
const pageSize = 20;

// API call with pagination
const { data } = useQuery({
  queryKey: ['scheduled-reports', currentPage],
  queryFn: () => fetchScheduledReports({ page: currentPage, limit: pageSize })
});
```

#### 2. Real-time Updates

Optimize SSE connections:

```typescript
// Debounce reconnection attempts
const debouncedReconnect = useMemo(
  () => debounce(reconnect, 1000),
  [reconnect]
);
```

## 🚀 Advanced Usage

### Custom Report Scheduling

```typescript
// Create custom scheduling logic
const createCustomSchedule = async (reportData: CustomScheduleRequest) => {
  const response = await fetch('/api/scheduled-reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...reportData,
      schedule: {
        frequency: 'custom',
        cronExpression: '0 9 * * 1-5' // Weekdays at 9 AM
      }
    })
  });
  
  return response.json();
};
```

### Batch Operations

```typescript
// Batch activate/deactivate reports
const batchUpdateReports = async (reportIds: string[], isActive: boolean) => {
  const promises = reportIds.map(id => 
    fetch(`/api/scheduled-reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive })
    })
  );
  
  return Promise.all(promises);
};
```

### Custom Email Templates

```typescript
// Configure custom email templates for report delivery
const customEmailTemplate = {
  subject: 'Your Scheduled Report: {{reportName}}',
  body: `
    <h2>{{reportName}}</h2>
    <p>Your scheduled report has been generated successfully.</p>
    <p>Generated on: {{generatedAt}}</p>
    <p>Report format: {{format}}</p>
  `
};
```

## 📊 Monitoring and Analytics

### Performance Metrics

Track system performance:

```typescript
// Monitor execution times
const trackExecutionTime = (reportId: string, duration: number) => {
  analytics.track('scheduled_report_executed', {
    reportId,
    duration,
    timestamp: new Date().toISOString()
  });
};
```

### Error Tracking

Implement comprehensive error tracking:

```typescript
// Error boundary for scheduled reports
<ErrorBoundary
  fallback={<ScheduledReportsErrorFallback />}
  onError={(error, errorInfo) => {
    console.error('Scheduled Reports Error:', error, errorInfo);
    // Send to error tracking service
  }}
>
  <ScheduledReportsDashboard />
</ErrorBoundary>
```

## 🔐 Security Considerations

### Authentication & Authorization

- All API endpoints require valid session authentication
- Role-based access control for report management
- Rate limiting to prevent abuse
- Input validation and sanitization

### Data Protection

- Sensitive data encryption in transit and at rest
- Secure file storage for generated reports
- Automatic cleanup of temporary files
- Audit logging for all operations

## 📝 Migration Guide

### From Basic Reports to Scheduled Reports

If you're upgrading from the basic reports system:

1. **Database Migration**: Add scheduled reports tables
2. **Component Updates**: Replace report components with scheduled versions
3. **API Integration**: Update API calls to use scheduled endpoints
4. **Configuration**: Add required environment variables

### Version Compatibility

- **Next.js**: 14.0+
- **React**: 18.0+
- **TypeScript**: 5.0+
- **Tailwind CSS**: 3.0+

## 🤝 Contributing

When contributing to the scheduled reports system:

1. Follow the existing code patterns and conventions
2. Add comprehensive tests for new features
3. Update documentation for any API changes
4. Ensure responsive design for all UI components
5. Test in both demo and production modes

## 📚 Related Documentation

- [Reports System](./reports-system.md) - Basic reporting functionality
- [Real-time Features](./realtime-features.md) - SSE implementation details
- [API Documentation](../api/README.md) - Complete API reference
- [Security Guide](../security/README.md) - Security best practices