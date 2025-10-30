# Component Development Guide

This guide establishes best practices for developing React components in the NextJS Fullstack Starter project.

## Component Structure

### Directory Organization

```
components/
├── ui/                    # Base components (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   └── advanced/         # Advanced UI components
├── forms/                # Form components
├── layout/               # Layout components
├── features/             # Feature-specific components
├── shared/               # Shared components
└── providers/            # Context providers
```

### Naming Conventions

- **Files**: PascalCase (`UserProfile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Props**: camelCase with Props suffix (`UserProfileProps`)
- **Hooks**: camelCase with use prefix (`useUserProfile`)

## Implementation Patterns

### 1. Componente Funcional Básico

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
}

/**
 * Componente Button reutilizable con variantes y estados
 *
 * @param variant - Estilo visual del botón
 * @param size - Tamaño del botón
 * @param loading - Estado de carga
 * @param className - Clases CSS adicionales
 * @param children - Contenido del botón
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
            'border border-input bg-background hover:bg-accent': variant === 'outline',
          },
          {
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-md px-3': size === 'sm',
            'h-11 rounded-md px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <LoadingSpinner className="mr-2 h-4 w-4" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### 2. Componente con Estado Local

```typescript
import React, { useState, useCallback } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * Input de búsqueda con debounce automático
 */
export function SearchInput({
  onSearch,
  placeholder = 'Buscar...',
  debounceMs = 300
}: SearchInputProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, debounceMs);

  // Ejecutar búsqueda cuando cambie el valor debounced
  React.useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        className="pl-9 pr-9"
      />
      {query && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
```

### 3. Componente con Context

```typescript
import React, { createContext, useContext, useReducer } from 'react';

// Tipos
interface NotificationState {
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

// Context
const NotificationContext = createContext<{
  state: NotificationState;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
} | null>(null);

// Reducer
function notificationReducer(
  state: NotificationState,
  action: NotificationAction
): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    default:
      return state;
  }
}

// Provider
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [],
  });

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: { ...notification, id },
    });

    // Auto-remove después de la duración especificada
    if (notification.duration !== 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
      }, notification.duration || 5000);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  return (
    <NotificationContext.Provider value={{ state, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook personalizado
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
```

## Mejores Prácticas

### 1. Composición de Componentes

```typescript
// ❌ Componente monolítico
function UserCard({ user, onEdit, onDelete, showActions }) {
  return (
    <div className="card">
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {showActions && (
        <div>
          <button onClick={onEdit}>Edit</button>
          <button onClick={onDelete}>Delete</button>
        </div>
      )}
    </div>
  );
}

// ✅ Componentes composables
function UserCard({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

function UserAvatar({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="avatar" />;
}

function UserInfo({ name, email }: { name: string; email: string }) {
  return (
    <div>
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
}

function UserActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="actions">
      <Button onClick={onEdit}>Edit</Button>
      <Button variant="destructive" onClick={onDelete}>Delete</Button>
    </div>
  );
}

// Uso
function UserProfile({ user }: { user: User }) {
  return (
    <UserCard>
      <UserAvatar src={user.avatar} alt={user.name} />
      <UserInfo name={user.name} email={user.email} />
      <UserActions onEdit={handleEdit} onDelete={handleDelete} />
    </UserCard>
  );
}
```

### 2. Manejo de Estados de Carga

```typescript
interface AsyncComponentProps<T> {
  data?: T;
  loading?: boolean;
  error?: Error | null;
  children: (data: T) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: (error: Error) => React.ReactNode;
}

/**
 * Componente wrapper para manejar estados async
 */
function AsyncComponent<T>({
  data,
  loading,
  error,
  children,
  loadingComponent = <LoadingSpinner />,
  errorComponent = (error) => <ErrorMessage error={error} />,
}: AsyncComponentProps<T>) {
  if (loading) {
    return <>{loadingComponent}</>;
  }

  if (error) {
    return <>{errorComponent(error)}</>;
  }

  if (!data) {
    return <EmptyState message="No data available" />;
  }

  return <>{children(data)}</>;
}

// Uso
function UserList() {
  const { data: users, loading, error } = useUsers();

  return (
    <AsyncComponent
      data={users}
      loading={loading}
      error={error}
      loadingComponent={<UserListSkeleton />}
      errorComponent={(error) => <ErrorBoundary error={error} />}
    >
      {(users) => (
        <div className="grid gap-4">
          {users.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </AsyncComponent>
  );
}
```

### 3. Formularios con Validación

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => Promise<void>;
  loading?: boolean;
}

export function UserForm({ initialData, onSubmit, loading }: UserFormProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      role: initialData?.role || 'USER',
    },
  });

  const handleSubmit = async (data: UserFormData) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      // El error se maneja en el componente padre
      console.error('Form submission error:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MODERATOR">Moderator</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" loading={loading} className="w-full">
          {initialData ? 'Update User' : 'Create User'}
        </Button>
      </form>
    </Form>
  );
}
```

### 4. Optimización de Performance

```typescript
import React, { memo, useMemo, useCallback } from 'react';

interface ExpensiveListProps {
  items: Item[];
  filter: string;
  onItemClick: (item: Item) => void;
}

/**
 * Lista optimizada con memoización
 */
export const ExpensiveList = memo<ExpensiveListProps>(({
  items,
  filter,
  onItemClick
}) => {
  // Memoizar cálculos costosos
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  // Memoizar callbacks para evitar re-renders
  const handleItemClick = useCallback((item: Item) => {
    onItemClick(item);
  }, [onItemClick]);

  return (
    <div className="space-y-2">
      {filteredItems.map(item => (
        <ExpensiveListItem
          key={item.id}
          item={item}
          onClick={handleItemClick}
        />
      ))}
    </div>
  );
});

ExpensiveList.displayName = 'ExpensiveList';

// Componente hijo también memoizado
const ExpensiveListItem = memo<{
  item: Item;
  onClick: (item: Item) => void;
}>(({ item, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(item);
  }, [item, onClick]);

  return (
    <div
      className="p-4 border rounded cursor-pointer hover:bg-gray-50"
      onClick={handleClick}
    >
      <h3>{item.name}</h3>
      <p>{item.description}</p>
    </div>
  );
});

ExpensiveListItem.displayName = 'ExpensiveListItem';
```

## Testing de Componentes

### 1. Tests Unitarios

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserForm } from './UserForm';

describe('UserForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('should render form fields', () => {
    render(<UserForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<UserForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit valid form data', async () => {
    render(<UserForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' }
    });

    const submitButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
      });
    });
  });
});
```

### 2. Tests de Integración

```typescript
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserList } from './UserList';

// Mock del hook
jest.mock('@/hooks/use-users', () => ({
  useUsers: () => ({
    data: [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ],
    loading: false,
    error: null,
  }),
}));

describe('UserList Integration', () => {
  it('should render user list with data', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <UserList />
      </QueryClientProvider>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});
```

## Recursos Adicionales

- [React Best Practices](https://react.dev/learn)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [React Performance](https://react.dev/learn/render-and-commit)
