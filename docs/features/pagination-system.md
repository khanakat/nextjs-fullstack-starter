# Pagination System - Complete Guide

## 🎯 Overview

A comprehensive pagination system with reusable components, hooks, and patterns for both client-side and server-side pagination in your Next.js application.

## 📦 Components Included

### 1. **Pagination Component** (`components/ui/pagination.tsx`)
Standalone pagination navigation component with full features:
- First, previous, next, last page buttons
- Page number indicators with ellipsis for large page counts
- Page size selector
- Item count information
- Fully customizable styling

### 2. **DataTable Component** (`components/ui/data-table.tsx`)  
Complete data table with integrated pagination:
- Built-in sorting, searching, and filtering
- Client-side or server-side pagination
- Empty states with custom actions
- Export and create buttons
- Loading states
- Responsive design

### 3. **usePagination Hook** (`hooks/use-pagination.ts`)
React hook for managing pagination state:
- Client-side pagination logic
- URL-based server-side pagination
- Page and page size management
- Computed values (hasNext, startIndex, etc.)
- Reset functionality

## 🚀 Quick Start

### Basic Pagination Component

```tsx
import { Pagination } from "@/components/ui/pagination";
import { usePagination } from "@/hooks/use-pagination";

function MyComponent() {
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 10,
    total: 100, // Total number of items
  });

  return (
    <Pagination
      currentPage={pagination.currentPage}
      totalPages={pagination.totalPages}
      pageSize={pagination.pageSize}
      totalItems={pagination.total}
      onPageChange={pagination.setPage}
      onPageSizeChange={pagination.setPageSize}
      showPageSizeSelector={true}
    />
  );
}
```

### DataTable with Pagination

```tsx
import { DataTable, DataTableColumn } from "@/components/ui/data-table";

interface User {
  id: number;
  name: string;
  email: string;
  status: string;
}

const columns: DataTableColumn<User>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
  },
  {
    key: 'status',
    label: 'Status',
    render: (value) => <Badge>{value}</Badge>,
  },
];

function UserTable({ users }: { users: User[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  return (
    <DataTable
      columns={columns}
      data={users}
      currentPage={currentPage}
      pageSize={pageSize}
      totalItems={users.length}
      onPageChange={setCurrentPage}
      searchKey="name"
      onCreate={() => console.log("Create user")}
    />
  );
}
```

## 🔧 API Reference

### Pagination Component Props

```tsx
interface PaginationProps {
  currentPage: number;               // Current active page
  totalPages: number;                // Total number of pages
  pageSize: number;                  // Items per page
  totalItems: number;                // Total number of items
  onPageChange: (page: number) => void;
  className?: string;
  showInfo?: boolean;                // Show "Showing X to Y of Z results"
  showPageSizeSelector?: boolean;    // Show page size dropdown
  pageSizeOptions?: number[];        // Available page sizes [10, 20, 50, 100]
  onPageSizeChange?: (pageSize: number) => void;
}
```

### DataTable Component Props

```tsx
interface DataTableProps<TData> {
  columns: DataTableColumn<TData>[];
  data: TData[];
  
  // Pagination
  pageSize?: number;
  currentPage?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  
  // Search and filter
  searchKey?: keyof TData;
  searchPlaceholder?: string;
  onSearch?: (searchTerm: string) => void;
  
  // Empty state
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyAction?: React.ReactNode;
  
  // Actions
  onCreate?: () => void;
  createLabel?: string;
  onExport?: () => void;
  
  // Customization
  className?: string;
  showPagination?: boolean;
  showSearch?: boolean;
  showActions?: boolean;
  loading?: boolean;
}
```

### DataTableColumn Interface

```tsx
interface DataTableColumn<T> {
  key: keyof T;                      // Property key from data object
  label: string;                     // Column header label
  sortable?: boolean;                // Enable sorting for this column
  render?: (value: any, record: T, index: number) => React.ReactNode;
  className?: string;                // Custom CSS classes
}
```

## 📋 Usage Patterns

### 1. Client-side Pagination

Perfect for smaller datasets that can be loaded entirely:

```tsx
function ClientPaginatedList() {
  const [allData, setAllData] = useState<Item[]>([]);
  
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 20,
    total: allData.length,
  });

  // Get current page data
  const paginatedData = allData.slice(
    pagination.startIndex,
    pagination.startIndex + pagination.pageSize
  );

  return (
    <div>
      <ItemList items={paginatedData} />
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        totalItems={pagination.total}
        onPageChange={pagination.setPage}
      />
    </div>
  );
}
```

### 2. Server-side Pagination

For larger datasets with API calls:

```tsx
function ServerPaginatedList() {
  const [data, setData] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 20,
    total,
    serverSide: true, // Enables URL state management
  });

  // Fetch data when page changes
  useEffect(() => {
    fetchData(pagination.currentPage, pagination.pageSize);
  }, [pagination.currentPage, pagination.pageSize]);

  const fetchData = async (page: number, pageSize: number) => {
    setLoading(true);
    try {
      const response = await api.getItems({ page, pageSize });
      setData(response.items);
      setTotal(response.total);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      currentPage={pagination.currentPage}
      pageSize={pagination.pageSize}
      totalItems={total}
      onPageChange={pagination.setPage}
      onPageSizeChange={pagination.setPageSize}
    />
  );
}
```

### 3. URL-based State Management

Automatically sync pagination state with URL parameters:

```tsx
function URLPaginatedComponent() {
  const pagination = usePagination({
    serverSide: true, // This enables URL state management
    initialPage: 1,
    initialPageSize: 10,
    total: 100,
  });

  // URL will automatically update with ?page=2&pageSize=20
  // Page refreshes will maintain pagination state
  
  return (
    <Pagination
      currentPage={pagination.currentPage}
      totalPages={pagination.totalPages}
      pageSize={pagination.pageSize}
      totalItems={pagination.total}
      onPageChange={pagination.setPage}
      onPageSizeChange={pagination.setPageSize}
    />
  );
}
```

## 🎨 Styling & Customization

### Custom Pagination Appearance

```tsx
<Pagination
  // ... props
  className="my-custom-pagination"
  showInfo={false}              // Hide info text
  showPageSizeSelector={true}   // Show page size dropdown
  pageSizeOptions={[5, 10, 25, 50]}  // Custom page sizes
/>
```

### Custom DataTable Columns

```tsx
const columns: DataTableColumn<User>[] = [
  {
    key: 'avatar',
    label: '',
    render: (_, user) => (
      <Avatar>
        <AvatarImage src={user.avatarUrl} />
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </Avatar>
    ),
    className: 'w-12',
  },
  {
    key: 'name',
    label: 'User',
    sortable: true,
    render: (name, user) => (
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-sm text-muted-foreground">{user.email}</div>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (status) => (
      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
        {status}
      </Badge>
    ),
  },
  {
    key: 'id',
    label: 'Actions',
    render: (_, user) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
```

## ⚡ Performance Tips

### 1. Memoize Column Definitions
```tsx
const columns = useMemo(() => [
  // column definitions
], []);
```

### 2. Debounce Search Input
```tsx
const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (onSearch) {
    onSearch(debouncedSearch);
  }
}, [debouncedSearch, onSearch]);
```

### 3. Virtual Scrolling for Large Lists
For very large datasets, consider implementing virtual scrolling:
```tsx
import { FixedSizeList as List } from 'react-window';
```

## 🔗 Integration Examples

### With React Query
```tsx
function DataWithQuery() {
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => fetchUsers({ page, pageSize: 20 }),
  });

  return (
    <DataTable
      data={data?.items || []}
      loading={isLoading}
      currentPage={page}
      totalItems={data?.total || 0}
      onPageChange={setPage}
    />
  );
}
```

### With Form Filters
```tsx
function FilteredDataTable() {
  const [filters, setFilters] = useState({
    status: '',
    role: '',
    search: '',
  });
  
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 20,
    serverSide: true,
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    pagination.setPage(1);
  }, [filters]);

  return (
    <div>
      <FilterForm onFiltersChange={setFilters} />
      <DataTable
        // ... props
        currentPage={pagination.currentPage}
        onPageChange={pagination.setPage}
      />
    </div>
  );
}
```

## 🛠 Best Practices

### 1. **Consistent Page Sizes**
Use standard page sizes across your app (10, 20, 50, 100)

### 2. **Loading States**
Always show loading indicators during data fetching

### 3. **Error Handling**
Implement proper error boundaries for failed pagination requests

### 4. **Accessibility**
- Use semantic HTML
- Provide keyboard navigation
- Include proper ARIA labels

### 5. **Mobile Responsive**
- Stack pagination controls on mobile
- Use appropriate touch targets
- Consider infinite scroll for mobile

## 📱 Mobile Considerations

### Responsive Pagination
```tsx
<Pagination
  className="flex-col sm:flex-row gap-4 sm:gap-0"
  // Mobile-optimized props
/>
```

### Alternative Mobile Pattern - Infinite Scroll
```tsx
function InfiniteScrollList() {
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = () => {
    // Load next page and append to items
  };

  return (
    <InfiniteScroll
      dataLength={items.length}
      next={loadMore}
      hasMore={hasMore}
      loader={<LoadingSpinner />}
    >
      {items.map(item => <ItemCard key={item.id} item={item} />)}
    </InfiniteScroll>
  );
}
```

This pagination system provides everything you need for scalable, user-friendly data navigation in your Next.js application! 🚀