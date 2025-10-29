import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

/**
 * Authentication Store
 */
interface User {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  image: string | null;
  bio: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isLoading: true,
        setUser: (user) => set({ user }),
        setLoading: (isLoading) => set({ isLoading }),
        logout: () => set({ user: null }),
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({ user: state.user }),
      },
    ),
    { name: "AuthStore" },
  ),
);

/**
 * UI State Store
 */
interface UIState {
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        sidebarOpen: true,
        theme: "system",
        setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
        toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
        setTheme: (theme) => set({ theme }),
      }),
      {
        name: "ui-storage",
      },
    ),
    { name: "UIStore" },
  ),
);

/**
 * Modal State Store
 */
interface ModalState {
  // Generic modal state
  modals: Record<string, boolean>;
  modalData: Record<string, any>;

  // Common modals
  isCreatePostOpen: boolean;
  isEditPostOpen: boolean;
  isDeletePostOpen: boolean;
  isProfileOpen: boolean;

  // Actions
  openModal: (modalName: string, data?: any) => void;
  closeModal: (modalName: string) => void;
  setModalData: (modalName: string, data: any) => void;

  // Specific modal actions
  openCreatePost: () => void;
  closeCreatePost: () => void;
  openEditPost: (postId: string) => void;
  closeEditPost: () => void;
  openDeletePost: (postId: string) => void;
  closeDeletePost: () => void;
}

export const useModalStore = create<ModalState>()(
  devtools(
    (set, get) => ({
      modals: {},
      modalData: {},
      isCreatePostOpen: false,
      isEditPostOpen: false,
      isDeletePostOpen: false,
      isProfileOpen: false,

      openModal: (modalName, data) =>
        set((state) => ({
          modals: { ...state.modals, [modalName]: true },
          modalData: data
            ? { ...state.modalData, [modalName]: data }
            : state.modalData,
        })),

      closeModal: (modalName) =>
        set((state) => ({
          modals: { ...state.modals, [modalName]: false },
          modalData: { ...state.modalData, [modalName]: undefined },
        })),

      setModalData: (modalName, data) =>
        set((state) => ({
          modalData: { ...state.modalData, [modalName]: data },
        })),

      openCreatePost: () => set({ isCreatePostOpen: true }),
      closeCreatePost: () => set({ isCreatePostOpen: false }),

      openEditPost: (postId) =>
        set({
          isEditPostOpen: true,
          modalData: { ...get().modalData, editPost: { postId } },
        }),
      closeEditPost: () =>
        set({
          isEditPostOpen: false,
          modalData: { ...get().modalData, editPost: undefined },
        }),

      openDeletePost: (postId) =>
        set({
          isDeletePostOpen: true,
          modalData: { ...get().modalData, deletePost: { postId } },
        }),
      closeDeletePost: () =>
        set({
          isDeletePostOpen: false,
          modalData: { ...get().modalData, deletePost: undefined },
        }),
    }),
    { name: "ModalStore" },
  ),
);

/**
 * Search State Store
 */
interface SearchState {
  query: string;
  filters: {
    category: string | null;
    tag: string | null;
    author: string | null;
    published: boolean | null;
    featured: boolean | null;
    dateRange: {
      from: Date | null;
      to: Date | null;
    };
  };
  sortBy: "createdAt" | "updatedAt" | "title";
  sortOrder: "asc" | "desc";

  setQuery: (query: string) => void;
  setFilter: (key: keyof SearchState["filters"], value: any) => void;
  setSortBy: (sortBy: SearchState["sortBy"]) => void;
  setSortOrder: (sortOrder: SearchState["sortOrder"]) => void;
  clearFilters: () => void;
  reset: () => void;
}

const initialFilters = {
  category: null,
  tag: null,
  author: null,
  published: null,
  featured: null,
  dateRange: {
    from: null,
    to: null,
  },
};

export const useSearchStore = create<SearchState>()(
  devtools(
    (set) => ({
      query: "",
      filters: initialFilters,
      sortBy: "createdAt",
      sortOrder: "desc",

      setQuery: (query) => set({ query }),
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (sortOrder) => set({ sortOrder }),
      clearFilters: () => set({ filters: initialFilters }),
      reset: () =>
        set({
          query: "",
          filters: initialFilters,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
    }),
    { name: "SearchStore" },
  ),
);

/**
 * Toast/Notification Store
 */
interface Toast {
  id: string;
  title: string;
  message?: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>()(
  devtools(
    (set, get) => ({
      toasts: [],

      addToast: (toast) => {
        const id = Date.now().toString();
        const newToast = { ...toast, id };

        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // Auto remove toast after duration
        const duration = toast.duration || 5000;
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
      },

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        })),

      clearToasts: () => set({ toasts: [] }),
    }),
    { name: "ToastStore" },
  ),
);

// Convenience hooks for toasts
export const useToast = () => {
  const { addToast } = useToastStore();

  return {
    toast: addToast,
    success: (title: string, message?: string) =>
      addToast({ title, message, type: "success" }),
    error: (title: string, message?: string) =>
      addToast({ title, message, type: "error" }),
    warning: (title: string, message?: string) =>
      addToast({ title, message, type: "warning" }),
    info: (title: string, message?: string) =>
      addToast({ title, message, type: "info" }),
  };
};
