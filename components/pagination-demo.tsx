"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePagination } from "@/hooks/use-pagination";
import { Eye, Edit, Trash2, Plus } from "lucide-react";

// Mock data
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

const generateMockUsers = (count: number): User[] => {
  const roles = ['Admin', 'User', 'Moderator', 'Editor'];
  const statuses: ('active' | 'inactive')[] = ['active', 'inactive'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: roles[Math.floor(Math.random() * roles.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  }));
};

const mockUsers = generateMockUsers(156); // Generate 156 users for pagination demo

export function PaginationDemo() {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  // Client-side pagination example
  const clientPagination = usePagination({
    initialPage: 1,
    initialPageSize: 10,
    total: mockUsers.length,
  });

  // Server-side pagination example (using URL params)
  const serverPagination = usePagination({
    initialPage: 1,
    initialPageSize: 15,
    total: mockUsers.length,
    serverSide: true,
  });

  // Define table columns
  const userColumns: DataTableColumn<User>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, record) => (
        <div className="font-medium">{value}</div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      label: 'Role',
      render: (value) => (
        <Badge variant="outline">{value}</Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: 'active' | 'inactive') => (
        <Badge variant={value === 'active' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      sortable: true,
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Get paginated data for client-side pagination
  const getClientPaginatedUsers = () => {
    const start = clientPagination.startIndex;
    const end = start + clientPagination.pageSize;
    return mockUsers.slice(start, end);
  };

  // Get paginated data for server-side pagination
  const getServerPaginatedUsers = () => {
    const start = serverPagination.startIndex;
    const end = start + serverPagination.pageSize;
    return mockUsers.slice(start, end);
  };

  return (
    <div className="space-y-8">
      {/* Standalone Pagination Component */}
      <Card>
        <CardHeader>
          <CardTitle>Standalone Pagination Component</CardTitle>
          <p className="text-sm text-muted-foreground">
            Basic pagination component that can be used anywhere
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Example pagination with 156 total items, 10 items per page
            </div>
            <Pagination
              currentPage={clientPagination.currentPage}
              totalPages={clientPagination.totalPages}
              pageSize={clientPagination.pageSize}
              totalItems={clientPagination.total}
              onPageChange={clientPagination.setPage}
              onPageSizeChange={clientPagination.setPageSize}
              showPageSizeSelector={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Client-side Paginated Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Client-side Paginated DataTable</CardTitle>
          <p className="text-sm text-muted-foreground">
            DataTable with built-in client-side pagination, sorting, and search
          </p>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={userColumns}
            data={getClientPaginatedUsers()}
            currentPage={clientPagination.currentPage}
            pageSize={clientPagination.pageSize}
            totalItems={clientPagination.total}
            onPageChange={clientPagination.setPage}
            onPageSizeChange={clientPagination.setPageSize}
            searchKey="name"
            searchPlaceholder="Search users by name..."
            onCreate={() => alert("Create new user")}
            createLabel="Add User"
            onExport={() => alert("Export users")}
            emptyTitle="No users found"
            emptySubtitle="Try adjusting your search or create a new user"
          />
        </CardContent>
      </Card>

      {/* Server-side Paginated Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Server-side Paginated DataTable</CardTitle>
          <p className="text-sm text-muted-foreground">
            DataTable with URL-based pagination state (check URL parameters)
          </p>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={userColumns}
            data={getServerPaginatedUsers()}
            currentPage={serverPagination.currentPage}
            pageSize={serverPagination.pageSize}
            totalItems={serverPagination.total}
            onPageChange={serverPagination.setPage}
            onPageSizeChange={serverPagination.setPageSize}
            searchKey="email"
            searchPlaceholder="Search users by email..."
            onCreate={() => alert("Create new user")}
            createLabel="Add User"
            emptyTitle="No users found"
            emptySubtitle="Try adjusting your search criteria"
          />
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <p className="text-sm text-muted-foreground">
            Code examples for implementing pagination in your components
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Standalone Pagination</h4>
              <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`import { Pagination } from "@/components/ui/pagination";

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  pageSize={pageSize}
  totalItems={totalItems}
  onPageChange={setPage}
  showPageSizeSelector={true}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. DataTable with Pagination</h4>
              <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`import { DataTable } from "@/components/ui/data-table";

<DataTable
  columns={columns}
  data={data}
  currentPage={currentPage}
  totalItems={totalItems}
  onPageChange={handlePageChange}
  searchKey="name"
  onCreate={handleCreate}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. usePagination Hook</h4>
              <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`import { usePagination } from "@/hooks/use-pagination";

const pagination = usePagination({
  initialPage: 1,
  initialPageSize: 10,
  total: data.length,
  serverSide: true // For URL-based state
});`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}