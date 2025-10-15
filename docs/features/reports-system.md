# Reports System - Complete Guide

## 🎯 Overview

A comprehensive template-based reporting system that enables users to create, customize, and export professional reports with modern UI design. The system integrates seamlessly with existing data sources and provides both pre-built templates and a visual report builder for creating custom reports with Excel and PDF export capabilities.

## 🌟 Features

### Core Functionality
- **Template-based reporting** with pre-built and custom templates
- **Visual report builder** with drag-and-drop interface (powered by @dnd-kit)
- **Multi-format exports** (PDF, Excel, CSV) with customizable options
- **Real-time data visualization** with interactive charts and tables
- **Permission-based access control** with role-based security
- **Report scheduling** and automated generation
- **Advanced filtering** and search capabilities

### User Roles & Permissions
- **Viewer**: View reports, export to PDF/Excel, apply basic filters
- **Report Creator**: Create, edit, and manage custom reports, access report builder
- **Admin**: Full access to all reports, manage templates, user permissions, and system settings

### Export Capabilities
- **PDF Export**: Professional layouts with custom branding
- **Excel Export**: Structured data with formatting and charts
- **CSV Export**: Raw data for further analysis
- **Batch Export**: Multiple reports in a single operation
- **Scheduled Exports**: Automated report generation and delivery

## 📦 Components Included

### 1. **Reports Dashboard** (`components/reports/reports-dashboard.tsx`)
Main dashboard for report management:
- Report overview with statistics and recent activity
- Grid view of all available reports with thumbnails
- Search, filter, and sorting capabilities
- Quick actions for creating and managing reports
- Real-time updates and notifications

### 2. **Report Viewer** (`components/reports/report-viewer.tsx`)
Interactive report display component:
- Responsive report rendering with charts and tables
- Dynamic filtering and date range selection
- Export toolbar with multiple format options
- Share functionality and collaboration features
- Print-optimized layouts

### 3. **Report Builder** (`components/reports/report-builder.tsx`)
Visual report creation interface:
- Drag-and-drop component library (powered by @dnd-kit)
- Template selection and customization
- Data source binding and query configuration
- Real-time preview with responsive design
- Style customization and branding options

### 4. **Export Center** (`components/reports/export-center.tsx`)
Export management and history:
- Export job queue with status tracking
- Download history and file management
- Format preferences and quality settings
- Batch export operations
- Scheduled export management

## 🚀 Quick Start

### Basic Report Dashboard

```tsx
import { ReportsDashboard } from "@/components/reports/reports-dashboard";

function MyReportsPage() {
  const { userId } = useAuth();

  return (
    <div className="container mx-auto py-6">
      <ReportsDashboard userId={userId} />
    </div>
  );
}
```

### Report Viewer with Filters

```tsx
import { ReportViewer } from "@/components/reports/report-viewer";

function ReportPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <ReportViewer 
        reportId={params.id}
        showFilters={true}
        showExportOptions={true}
        allowEdit={true}
      />
    </div>
  );
}
```

### Custom Report Builder

```tsx
import { ReportBuilder } from "@/components/reports/report-builder";

function CreateReportPage() {
  const handleSave = (reportData: CreateReportRequest) => {
    // Handle report creation
    console.log("Saving report:", reportData);
  };

  return (
    <ReportBuilder
      onSave={handleSave}
      templates={availableTemplates}
      dataSources={dataSources}
    />
  );
}
```

## 🔧 API Reference

### Reports Dashboard Props

```tsx
interface ReportsDashboardProps {
  userId: string;                    // Current user ID for permissions
  className?: string;                // Custom CSS classes
  showCreateButton?: boolean;        // Show create new report button
  showStats?: boolean;               // Show dashboard statistics
  defaultView?: 'grid' | 'list';     // Default view mode
  pageSize?: number;                 // Number of reports per page
  onReportSelect?: (reportId: string) => void;
}
```

### Report Viewer Props

```tsx
interface ReportViewerProps {
  reportId: string;                  // Report ID to display
  showFilters?: boolean;             // Show filter panel
  showExportOptions?: boolean;       // Show export toolbar
  allowEdit?: boolean;               // Allow report editing
  className?: string;                // Custom CSS classes
  onExport?: (format: ExportFormat) => void;
  onShare?: (reportId: string) => void;
  onEdit?: (reportId: string) => void;
}
```

### Report Builder Props

```tsx
interface ReportBuilderProps {
  reportId?: string;                 // Existing report ID for editing
  templateId?: string;               // Template to start with
  onSave: (report: CreateReportRequest) => void;
  onCancel?: () => void;
  templates?: Template[];            // Available templates
  dataSources?: DataSource[];        // Available data sources
  className?: string;
}
```

### Export Center Props

```tsx
interface ExportCenterProps {
  userId: string;                    // Current user ID
  showHistory?: boolean;             // Show export history
  showScheduled?: boolean;           // Show scheduled exports
  allowBatchExport?: boolean;        // Enable batch operations
  className?: string;
  onExportComplete?: (exportId: string) => void;
}
```

## 🔍 Hooks Documentation

### useReportPermissions

Manage report permissions and access control:

```tsx
import { useReportPermissions } from "@/hooks/use-report-permissions";

function ReportPermissionsManager({ reportId }: { reportId: string }) {
  const {
    permissions,
    loading,
    error,
    addPermission,
    updatePermission,
    removePermission,
    hasPermission,
    checkUserPermission
  } = useReportPermissions(reportId);

  const handleAddUser = async (userId: string, role: PermissionType) => {
    await addPermission({
      userId,
      permissionType: role,
      reportId
    });
  };

  return (
    <div>
      {permissions.map(permission => (
        <div key={permission.id}>
          {permission.user.name} - {permission.permissionType}
        </div>
      ))}
    </div>
  );
}
```

### useReportBuilder

Manage report builder state and operations:

```tsx
import { useReportBuilder } from "@/hooks/use-report-builder";

function CustomReportBuilder() {
  const {
    components,
    selectedComponent,
    addComponent,
    updateComponent,
    removeComponent,
    moveComponent,
    saveReport,
    loading
  } = useReportBuilder();

  return (
    <div className="report-builder">
      <ComponentPalette onAddComponent={addComponent} />
      <Canvas 
        components={components}
        onSelectComponent={setSelectedComponent}
        onMoveComponent={moveComponent}
      />
      <PropertiesPanel 
        component={selectedComponent}
        onUpdate={updateComponent}
      />
    </div>
  );
}
```

### useExportJobs

Manage export operations and job status:

```tsx
import { useExportJobs } from "@/hooks/use-export-jobs";

function ExportManager() {
  const {
    jobs,
    loading,
    createExport,
    cancelExport,
    downloadExport,
    getJobStatus
  } = useExportJobs();

  const handleExport = async (reportId: string, format: ExportFormat) => {
    const job = await createExport({
      reportId,
      format,
      options: { includeCharts: true }
    });
    
    // Monitor job status
    const status = await getJobStatus(job.id);
    console.log("Export status:", status);
  };

  return (
    <div>
      {jobs.map(job => (
        <div key={job.id}>
          {job.status === 'completed' ? (
            <button onClick={() => downloadExport(job.id)}>
              Download
            </button>
          ) : (
            <span>Processing...</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

## 🗄️ Database Schema

### Core Tables

```sql
-- Reports table
model Report {
  id          String   @id @default(cuid())
  title       String
  description String?
  config      Json     // Report configuration and layout
  status      ReportStatus @default(DRAFT)
  isPublic    Boolean  @default(false)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  template    Template? @relation(fields: [templateId], references: [id])
  templateId  String?
  permissions ReportPermission[]
  exportJobs  ExportJob[]
}

-- Templates table
model Template {
  id          String   @id @default(cuid())
  name        String
  description String?
  config      Json     // Template configuration
  thumbnail   String?
  isPublic    Boolean  @default(true)
  createdBy   String
  createdAt   DateTime @default(now())
  
  // Relations
  category    TemplateCategory @relation(fields: [categoryId], references: [id])
  categoryId  String
  reports     Report[]
}

-- Permissions table
model ReportPermission {
  id             String         @id @default(cuid())
  userId         String
  reportId       String
  permissionType PermissionType
  createdAt      DateTime       @default(now())
  
  // Relations
  report         Report         @relation(fields: [reportId], references: [id], onDelete: Cascade)
  
  @@unique([userId, reportId])
}

-- Export Jobs table
model ExportJob {
  id         String      @id @default(cuid())
  reportId   String
  format     ExportFormat
  status     JobStatus   @default(PENDING)
  filePath   String?
  fileSize   Int?
  options    Json?
  createdBy  String
  createdAt  DateTime    @default(now())
  completedAt DateTime?
  
  // Relations
  report     Report      @relation(fields: [reportId], references: [id], onDelete: Cascade)
}
```

### Enums

```sql
enum ReportStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum PermissionType {
  VIEW
  EDIT
  ADMIN
}

enum ExportFormat {
  PDF
  EXCEL
  CSV
}

enum JobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

## 🛠️ Service Layer

### ReportService

Core service for report operations:

```tsx
import { ReportService } from "@/lib/services/report-service";

// Get paginated reports with filters
const reports = await ReportService.getReports(userId, {
  search: "sales",
  status: "PUBLISHED",
  templateId: "template-123"
}, 1, 10);

// Create new report
const newReport = await ReportService.createReport(userId, {
  title: "Monthly Sales Report",
  description: "Sales performance analysis",
  templateId: "sales-template",
  config: reportConfig,
  isPublic: false
});

// Update existing report
await ReportService.updateReport(reportId, userId, {
  title: "Updated Report Title",
  status: "PUBLISHED"
});

// Get report statistics
const stats = await ReportService.getReportStats(userId);
```

### ExportService

Handle report exports and file generation:

```tsx
import { ExportService } from "@/lib/services/export-service";

// Create export job
const exportJob = await ExportService.createExportJob({
  reportId: "report-123",
  format: "PDF",
  userId: "user-456",
  options: {
    includeCharts: true,
    pageSize: "A4",
    orientation: "portrait"
  }
});

// Process export (background job)
await ExportService.processExport(exportJob.id);

// Get export status
const status = await ExportService.getExportStatus(exportJob.id);

// Download completed export
const fileBuffer = await ExportService.downloadExport(exportJob.id);
```

### TemplateService

Manage report templates:

```tsx
import { TemplateService } from "@/lib/services/template-service";

// Get available templates
const templates = await TemplateService.getTemplates({
  categoryId: "business-reports",
  isPublic: true
});

// Create custom template
const template = await TemplateService.createTemplate({
  name: "Custom Sales Template",
  description: "Template for sales reports",
  config: templateConfig,
  categoryId: "sales",
  isPublic: false
});
```

## 📋 Usage Patterns

### 1. Basic Report Dashboard

```tsx
function ReportsPage() {
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-gray-600">Manage and view your reports</p>
      </div>
      
      <ReportsDashboard 
        userId={user.id}
        showStats={true}
        showCreateButton={true}
        defaultView="grid"
        pageSize={12}
      />
    </div>
  );
}
```

### 2. Report Viewer with Custom Actions

```tsx
function ReportViewerPage({ reportId }: { reportId: string }) {
  const router = useRouter();
  
  const handleExport = async (format: ExportFormat) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report.${format.toLowerCase()}`;
        a.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  
  return (
    <ReportViewer
      reportId={reportId}
      showFilters={true}
      showExportOptions={true}
      allowEdit={true}
      onExport={handleExport}
      onEdit={(id) => router.push(`/reports/${id}/edit`)}
    />
  );
}
```

### 3. Custom Report Builder Integration

```tsx
function CreateReportPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  
  useEffect(() => {
    // Load available templates
    fetch('/api/templates')
      .then(res => res.json())
      .then(setTemplates);
  }, []);
  
  const handleSave = async (reportData: CreateReportRequest) => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });
      
      if (response.ok) {
        const report = await response.json();
        router.push(`/reports/${report.id}`);
      }
    } catch (error) {
      console.error('Failed to save report:', error);
    }
  };
  
  return (
    <ReportBuilder
      templates={templates}
      onSave={handleSave}
      onCancel={() => router.back()}
    />
  );
}
```

### 4. Permission Management

```tsx
function ReportPermissionsPage({ reportId }: { reportId: string }) {
  const {
    permissions,
    addPermission,
    updatePermission,
    removePermission,
    hasPermission
  } = useReportPermissions(reportId);
  
  const handleAddUser = async (email: string, role: PermissionType) => {
    // Find user by email (implement user search)
    const user = await searchUserByEmail(email);
    
    if (user) {
      await addPermission({
        userId: user.id,
        reportId,
        permissionType: role
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Report Permissions</h2>
      
      {/* Add new permission */}
      <AddPermissionForm onAdd={handleAddUser} />
      
      {/* Existing permissions */}
      <div className="space-y-2">
        {permissions.map(permission => (
          <div key={permission.id} className="flex items-center justify-between p-3 border rounded">
            <div>
              <span className="font-medium">{permission.user.name}</span>
              <Badge className="ml-2">{permission.permissionType}</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => removePermission(permission.id)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🔗 API Endpoints

### Reports API

```typescript
// GET /api/reports - List reports with pagination and filters
GET /api/reports?page=1&limit=10&search=sales&status=PUBLISHED

// POST /api/reports - Create new report
POST /api/reports
{
  "title": "Monthly Sales Report",
  "description": "Sales analysis for current month",
  "templateId": "template-123",
  "config": { /* report configuration */ },
  "isPublic": false
}

// GET /api/reports/[id] - Get specific report
GET /api/reports/report-123

// PATCH /api/reports/[id] - Update report
PATCH /api/reports/report-123
{
  "title": "Updated Title",
  "status": "PUBLISHED"
}

// DELETE /api/reports/[id] - Delete report
DELETE /api/reports/report-123

// POST /api/reports/[id]/export - Export report
POST /api/reports/report-123/export
{
  "format": "PDF",
  "options": {
    "includeCharts": true,
    "pageSize": "A4"
  }
}
```

### Templates API

```typescript
// GET /api/templates - List available templates
GET /api/templates?categoryId=business&isPublic=true

// POST /api/templates - Create custom template
POST /api/templates
{
  "name": "Custom Template",
  "description": "My custom report template",
  "config": { /* template configuration */ },
  "categoryId": "custom",
  "isPublic": false
}
```

### Permissions API

```typescript
// GET /api/reports/permissions - Get user's report permissions
GET /api/reports/permissions?reportId=report-123

// POST /api/reports/permissions - Add permission
POST /api/reports/permissions
{
  "userId": "user-456",
  "reportId": "report-123",
  "permissionType": "VIEW"
}

// DELETE /api/reports/permissions/[id] - Remove permission
DELETE /api/reports/permissions/permission-789
```

## 🎨 Styling and Theming

### CSS Classes

The Reports System uses Tailwind CSS with custom component classes:

```css
/* Report Dashboard */
.reports-dashboard {
  @apply container mx-auto py-6 space-y-6;
}

.reports-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6;
}

.report-card {
  @apply bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow;
}

/* Report Viewer */
.report-viewer {
  @apply min-h-screen bg-gray-50;
}

.report-content {
  @apply bg-white rounded-lg shadow-sm p-6;
}

.report-filters {
  @apply bg-white rounded-lg shadow-sm p-4 space-y-4;
}

/* Report Builder */
.report-builder {
  @apply h-screen flex;
}

.component-palette {
  @apply w-64 bg-white border-r p-4 space-y-2;
}

.report-canvas {
  @apply flex-1 bg-gray-100 p-4;
}

.properties-panel {
  @apply w-80 bg-white border-l p-4 space-y-4;
}
```

### Custom Theme Variables

```css
:root {
  --report-primary: #3B82F6;
  --report-secondary: #6B7280;
  --report-success: #10B981;
  --report-warning: #F59E0B;
  --report-error: #EF4444;
  --report-background: #F9FAFB;
  --report-card: #FFFFFF;
  --report-border: #E5E7EB;
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Export Jobs Failing

**Problem**: PDF or Excel exports are not completing successfully.

**Solution**:
```typescript
// Check export service configuration
const exportService = new ExportService();

// Verify file permissions
await exportService.checkFilePermissions();

// Monitor export queue
const queueStatus = await exportService.getQueueStatus();
console.log('Queue status:', queueStatus);
```

#### 2. Permission Denied Errors

**Problem**: Users cannot access reports they should have permission to view.

**Solution**:
```typescript
// Debug permission checking
const { hasPermission, report } = await checkReportPermission(
  reportId, 
  userId, 
  'VIEW'
);

console.log('Permission check result:', { hasPermission, report });

// Refresh permissions cache
await ReportService.refreshPermissionsCache(userId);
```

#### 3. Report Builder Not Loading

**Problem**: The drag-and-drop report builder interface is not initializing.

**Solution**:
```typescript
// Check @dnd-kit dependencies
import { DndContext } from '@dnd-kit/core';

// Verify component registration
const components = useReportBuilder();
console.log('Available components:', components);

// Clear builder cache
localStorage.removeItem('report-builder-state');
```

#### 4. Template Loading Issues

**Problem**: Report templates are not loading or displaying incorrectly.

**Solution**:
```typescript
// Validate template configuration
const template = await TemplateService.getTemplate(templateId);
const isValid = TemplateService.validateConfig(template.config);

if (!isValid) {
  console.error('Invalid template configuration:', template.config);
}

// Reset template cache
await TemplateService.clearCache();
```

### Performance Optimization

#### 1. Large Report Handling

```typescript
// Implement pagination for large datasets
const paginatedData = useMemo(() => {
  return data.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
}, [data, currentPage, pageSize]);

// Use virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';
```

#### 2. Export Optimization

```typescript
// Process exports in background
const exportJob = await ExportService.createExportJob({
  reportId,
  format: 'PDF',
  options: { 
    async: true,  // Process in background
    compress: true // Reduce file size
  }
});

// Monitor progress
const progress = await ExportService.getExportProgress(exportJob.id);
```

### Debug Mode

Enable debug mode for detailed logging:

```typescript
// Set environment variable
process.env.REPORTS_DEBUG = 'true';

// Or use debug flag
const reportViewer = (
  <ReportViewer 
    reportId={reportId}
    debug={true}
    onDebugInfo={(info) => console.log('Debug:', info)}
  />
);
```

## 🔗 Related Documentation

- [Database Schema](../guides/database.md) - Database setup and migrations
- [Authentication](../guides/authentication.md) - User authentication and authorization
- [File Upload](../guides/file-upload.md) - File handling and storage
- [API Documentation](../api/README.md) - Complete API reference
- [Deployment Guide](../guides/deployment.md) - Production deployment instructions

## 📚 Additional Resources

- [Report Templates Gallery](../examples/report-templates.md)
- [Custom Component Development](../guides/custom-components.md)
- [Performance Best Practices](../guides/performance.md)
- [Security Guidelines](../guides/security.md)