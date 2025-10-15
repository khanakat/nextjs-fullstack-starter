'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Users, 
  Shield, 
  Download, 
  Database, 
  Bell,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Key,
  Globe,
  Lock,
  Mail,
  Smartphone,
  Calendar,
  Clock,
  FileText,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
  permissions: string[];
}

interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'cloud';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  config: Record<string, any>;
}

interface ExportConfig {
  id: string;
  format: 'pdf' | 'excel' | 'csv' | 'png';
  enabled: boolean;
  maxFileSize: number;
  retentionDays: number;
  watermark: boolean;
  password: boolean;
}

interface NotificationSetting {
  id: string;
  type: 'email' | 'sms' | 'push';
  event: 'export_complete' | 'export_failed' | 'report_shared' | 'system_alert';
  enabled: boolean;
  recipients: string[];
}

interface ReportSettingsProps {
  userId: string;
}

const ROLE_CONFIG = {
  admin: { 
    label: 'Administrator', 
    color: 'bg-red-100 text-red-800',
    permissions: ['create', 'read', 'update', 'delete', 'share', 'export', 'manage_users']
  },
  editor: { 
    label: 'Editor', 
    color: 'bg-blue-100 text-blue-800',
    permissions: ['create', 'read', 'update', 'share', 'export']
  },
  viewer: { 
    label: 'Viewer', 
    color: 'bg-green-100 text-green-800',
    permissions: ['read', 'export']
  }
};

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
};

const DATA_SOURCE_CONFIG = {
  database: { label: 'Database', icon: Database, color: 'text-blue-600' },
  api: { label: 'API', icon: Server, color: 'text-green-600' },
  file: { label: 'File', icon: FileText, color: 'text-orange-600' },
  cloud: { label: 'Cloud', icon: Globe, color: 'text-purple-600' }
};

function UserManagementTab({ users, onAddUser, onEditUser, onDeleteUser }: {
  users: User[];
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                <SelectItem key={role} value={role}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onAddUser}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredUsers.map(user => {
          const roleConfig = ROLE_CONFIG[user.role];
          const statusConfig = STATUS_CONFIG[user.status];
          const StatusIcon = statusConfig.icon;

          return (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={roleConfig.color}>
                          {roleConfig.label}
                        </Badge>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm text-muted-foreground">
                      <div>Last active:</div>
                      <div>{new Date(user.lastActive).toLocaleDateString()}</div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditUser(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDeleteUser(user)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Permissions:</div>
                  <div className="flex flex-wrap gap-1">
                    {roleConfig.permissions.map(permission => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function DataSourcesTab({ dataSources, onAddDataSource, onEditDataSource, onDeleteDataSource }: {
  dataSources: DataSource[];
  onAddDataSource: () => void;
  onEditDataSource: (dataSource: DataSource) => void;
  onDeleteDataSource: (dataSource: DataSource) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Data Sources</h3>
          <p className="text-sm text-muted-foreground">
            Manage connections to external data sources
          </p>
        </div>
        <Button onClick={onAddDataSource}>
          <Plus className="h-4 w-4 mr-2" />
          Add Data Source
        </Button>
      </div>

      <div className="grid gap-4">
        {dataSources.map(dataSource => {
          const typeConfig = DATA_SOURCE_CONFIG[dataSource.type];
          const TypeIcon = typeConfig.icon;
          const isConnected = dataSource.status === 'connected';

          return (
            <Card key={dataSource.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-lg", typeConfig.color.replace('text-', 'bg-').replace('-600', '-50'))}>
                      <TypeIcon className={cn("h-5 w-5", typeConfig.color)} />
                    </div>
                    <div>
                      <div className="font-semibold">{dataSource.name}</div>
                      <div className="text-sm text-muted-foreground">{typeConfig.label}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          isConnected ? "bg-green-500" : "bg-red-500"
                        )} />
                        <span className="text-sm">
                          {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • Last sync: {new Date(dataSource.lastSync).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditDataSource(dataSource)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Connection
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Key className="h-4 w-4 mr-2" />
                        Test Connection
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDeleteDataSource(dataSource)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ExportConfigTab({ exportConfigs, onUpdateConfig }: {
  exportConfigs: ExportConfig[];
  onUpdateConfig: (config: ExportConfig) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Export Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure export formats, file size limits, and security settings
        </p>
      </div>

      <div className="grid gap-6">
        {exportConfigs.map(config => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {config.format.toUpperCase()} Export
                </CardTitle>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(enabled) => 
                    onUpdateConfig({ ...config, enabled })
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`maxFileSize-${config.id}`}>
                    Max File Size (MB)
                  </Label>
                  <Input
                    id={`maxFileSize-${config.id}`}
                    type="number"
                    value={config.maxFileSize}
                    onChange={(e) => 
                      onUpdateConfig({ 
                        ...config, 
                        maxFileSize: parseInt(e.target.value) 
                      })
                    }
                    disabled={!config.enabled}
                  />
                </div>
                <div>
                  <Label htmlFor={`retentionDays-${config.id}`}>
                    Retention (Days)
                  </Label>
                  <Input
                    id={`retentionDays-${config.id}`}
                    type="number"
                    value={config.retentionDays}
                    onChange={(e) => 
                      onUpdateConfig({ 
                        ...config, 
                        retentionDays: parseInt(e.target.value) 
                      })
                    }
                    disabled={!config.enabled}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`watermark-${config.id}`}
                    checked={config.watermark}
                    onCheckedChange={(watermark) => 
                      onUpdateConfig({ ...config, watermark })
                    }
                    disabled={!config.enabled}
                  />
                  <Label htmlFor={`watermark-${config.id}`}>
                    Add watermark
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id={`password-${config.id}`}
                    checked={config.password}
                    onCheckedChange={(password) => 
                      onUpdateConfig({ ...config, password })
                    }
                    disabled={!config.enabled}
                  />
                  <Label htmlFor={`password-${config.id}`}>
                    Password protection
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NotificationsTab({ notifications, onUpdateNotification }: {
  notifications: NotificationSetting[];
  onUpdateNotification: (notification: NotificationSetting) => void;
}) {
  const groupedNotifications = notifications.reduce((acc, notification) => {
    if (!acc[notification.event]) {
      acc[notification.event] = [];
    }
    acc[notification.event].push(notification);
    return acc;
  }, {} as Record<string, NotificationSetting[]>);

  const eventLabels = {
    export_complete: 'Export Complete',
    export_failed: 'Export Failed',
    report_shared: 'Report Shared',
    system_alert: 'System Alert'
  };

  const typeIcons = {
    email: Mail,
    sms: Smartphone,
    push: Bell
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Notification Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure how and when you receive notifications
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedNotifications).map(([event, eventNotifications]) => (
          <Card key={event}>
            <CardHeader>
              <CardTitle className="text-base">
                {eventLabels[event as keyof typeof eventLabels]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventNotifications.map(notification => {
                  const TypeIcon = typeIcons[notification.type];
                  
                  return (
                    <div key={notification.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium capitalize">
                            {notification.type}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {notification.recipients.length} recipient(s)
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={notification.enabled}
                        onCheckedChange={(enabled) => 
                          onUpdateNotification({ ...notification, enabled })
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ReportSettings({ userId }: ReportSettingsProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [exportConfigs, setExportConfigs] = useState<ExportConfig[]>([]);
  const [notifications, setNotifications] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data initialization
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        status: 'active',
        lastActive: '2024-01-21T10:30:00Z',
        permissions: ROLE_CONFIG.admin.permissions
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'editor',
        status: 'active',
        lastActive: '2024-01-20T15:45:00Z',
        permissions: ROLE_CONFIG.editor.permissions
      },
      {
        id: '3',
        name: 'Bob Wilson',
        email: 'bob@example.com',
        role: 'viewer',
        status: 'pending',
        lastActive: '2024-01-19T09:15:00Z',
        permissions: ROLE_CONFIG.viewer.permissions
      }
    ];

    const mockDataSources: DataSource[] = [
      {
        id: '1',
        name: 'Main Database',
        type: 'database',
        status: 'connected',
        lastSync: '2024-01-21T11:00:00Z',
        config: { host: 'localhost', port: 5432 }
      },
      {
        id: '2',
        name: 'Sales API',
        type: 'api',
        status: 'connected',
        lastSync: '2024-01-21T10:45:00Z',
        config: { endpoint: 'https://api.sales.com' }
      },
      {
        id: '3',
        name: 'Analytics Cloud',
        type: 'cloud',
        status: 'error',
        lastSync: '2024-01-20T16:30:00Z',
        config: { provider: 'aws', region: 'us-east-1' }
      }
    ];

    const mockExportConfigs: ExportConfig[] = [
      {
        id: '1',
        format: 'pdf',
        enabled: true,
        maxFileSize: 50,
        retentionDays: 30,
        watermark: true,
        password: false
      },
      {
        id: '2',
        format: 'excel',
        enabled: true,
        maxFileSize: 25,
        retentionDays: 14,
        watermark: false,
        password: true
      },
      {
        id: '3',
        format: 'csv',
        enabled: true,
        maxFileSize: 10,
        retentionDays: 7,
        watermark: false,
        password: false
      },
      {
        id: '4',
        format: 'png',
        enabled: false,
        maxFileSize: 5,
        retentionDays: 3,
        watermark: true,
        password: false
      }
    ];

    const mockNotifications: NotificationSetting[] = [
      {
        id: '1',
        type: 'email',
        event: 'export_complete',
        enabled: true,
        recipients: ['user@example.com']
      },
      {
        id: '2',
        type: 'push',
        event: 'export_complete',
        enabled: false,
        recipients: []
      },
      {
        id: '3',
        type: 'email',
        event: 'export_failed',
        enabled: true,
        recipients: ['admin@example.com']
      },
      {
        id: '4',
        type: 'sms',
        event: 'system_alert',
        enabled: true,
        recipients: ['+1234567890']
      }
    ];

    setUsers(mockUsers);
    setDataSources(mockDataSources);
    setExportConfigs(mockExportConfigs);
    setNotifications(mockNotifications);
    setLoading(false);
  }, []);

  // Event handlers
  const handleAddUser = () => {
    toast.info('Add user dialog would open here');
  };

  const handleEditUser = (user: User) => {
    toast.info(`Edit user: ${user.name}`);
  };

  const handleDeleteUser = (user: User) => {
    setUsers(prev => prev.filter(u => u.id !== user.id));
    toast.success(`User ${user.name} deleted`);
  };

  const handleAddDataSource = () => {
    toast.info('Add data source dialog would open here');
  };

  const handleEditDataSource = (dataSource: DataSource) => {
    toast.info(`Edit data source: ${dataSource.name}`);
  };

  const handleDeleteDataSource = (dataSource: DataSource) => {
    setDataSources(prev => prev.filter(ds => ds.id !== dataSource.id));
    toast.success(`Data source ${dataSource.name} deleted`);
  };

  const handleUpdateExportConfig = (updatedConfig: ExportConfig) => {
    setExportConfigs(prev => prev.map(config => 
      config.id === updatedConfig.id ? updatedConfig : config
    ));
    toast.success(`${updatedConfig.format.toUpperCase()} export settings updated`);
  };

  const handleUpdateNotification = (updatedNotification: NotificationSetting) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === updatedNotification.id ? updatedNotification : notification
    ));
    toast.success('Notification settings updated');
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Users &amp; Roles
        </TabsTrigger>
        <TabsTrigger value="datasources" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Data Sources
        </TabsTrigger>
        <TabsTrigger value="exports" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Config
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="mt-6">
        <UserManagementTab
          users={users}
          onAddUser={handleAddUser}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
        />
      </TabsContent>

      <TabsContent value="datasources" className="mt-6">
        <DataSourcesTab
          dataSources={dataSources}
          onAddDataSource={handleAddDataSource}
          onEditDataSource={handleEditDataSource}
          onDeleteDataSource={handleDeleteDataSource}
        />
      </TabsContent>

      <TabsContent value="exports" className="mt-6">
        <ExportConfigTab
          exportConfigs={exportConfigs}
          onUpdateConfig={handleUpdateExportConfig}
        />
      </TabsContent>

      <TabsContent value="notifications" className="mt-6">
        <NotificationsTab
          notifications={notifications}
          onUpdateNotification={handleUpdateNotification}
        />
      </TabsContent>
    </Tabs>
  );
}