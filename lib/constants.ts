// App Configuration Constants
export const APP_CONFIG = {
  name: "Next.js Fullstack Starter",
  description: "Production-ready Next.js 14 fullstack template",
  version: "1.0.0",
  author: "khanakat",
  repository: "https://github.com/khanakat/nextjs-fullstack-starter",
  homepage: "https://nextjs-fullstack-starter.vercel.app",
} as const;

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  timeout: 10000,
  retries: 3,
} as const;

// Pagination Constants
export const PAGINATION = {
  defaultPageSize: 10,
  maxPageSize: 100,
  defaultPage: 1,
} as const;

// Database Limits
export const DB_LIMITS = {
  maxPostTitle: 255,
  maxPostContent: 10000,
  maxTagName: 50,
  maxUserName: 100,
} as const;

// File Upload Limits
export const FILE_LIMITS = {
  maxImageSize: 5 * 1024 * 1024, // 5MB
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  allowedFileTypes: ["application/pdf", "text/plain", "application/json"],
} as const;

// UI Constants
export const UI_CONFIG = {
  themes: ["light", "dark", "system"] as const,
  defaultTheme: "system" as const,
  sidebarWidth: 280,
  headerHeight: 64,
  footerHeight: 80,
} as const;

// Routes
export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  posts: "/dashboard/posts",
  profile: "/profile",
  auth: {
    signIn: "/sign-in",
    signUp: "/sign-up",
    signOut: "/sign-out",
  },
  api: {
    posts: "/api/posts",
    users: "/api/users",
    auth: "/api/auth",
  },
} as const;

// Status Constants
export const POST_STATUS = {
  draft: "draft",
  published: "published",
  archived: "archived",
} as const;

export const USER_ROLES = {
  admin: "admin",
  user: "user",
  moderator: "moderator",
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  generic: "Something went wrong. Please try again.",
  unauthorized: "You are not authorized to perform this action.",
  notFound: "The requested resource was not found.",
  validationFailed: "Please check your input and try again.",
  serverError: "Server error. Please try again later.",
  networkError: "Network error. Please check your connection.",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  postCreated: "Post created successfully!",
  postUpdated: "Post updated successfully!",
  postDeleted: "Post deleted successfully!",
  profileUpdated: "Profile updated successfully!",
  settingsSaved: "Settings saved successfully!",
} as const;

// Feature Flags
export const FEATURES = {
  analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
  realtime: process.env.NEXT_PUBLIC_ENABLE_REALTIME === "true",
  fileUpload: process.env.NEXT_PUBLIC_ENABLE_FILE_UPLOAD === "true",
  notifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === "true",
} as const;

// Social Media Links
export const SOCIAL_LINKS = {
  github: "https://github.com/khanakat",
  twitter: "https://twitter.com/khanakat",
  linkedin: "https://linkedin.com/in/khanakat",
  website: "https://khanakat.dev",
} as const;

// SEO Constants
export const SEO = {
  defaultTitle: APP_CONFIG.name,
  defaultDescription: APP_CONFIG.description,
  defaultKeywords: [
    "nextjs",
    "typescript",
    "postgresql",
    "prisma",
    "clerk",
    "shadcn/ui",
    "tailwindcss",
    "fullstack",
    "starter",
    "template",
  ],
  defaultImage: "/og-image.png",
  twitterHandle: "@khanakat",
} as const;

// Environment helpers
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const IS_TEST = process.env.NODE_ENV === "test";
