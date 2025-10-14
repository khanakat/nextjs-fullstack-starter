import { z } from "zod";

/**
 * Common validation schemas for API endpoints
 */

// User schemas
export const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must not exceed 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
  bio: z.string().max(500, "Bio must not exceed 500 characters").optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must not exceed 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
  bio: z.string().max(500, "Bio must not exceed 500 characters").optional(),
  image: z.string().url("Invalid image URL").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Post schemas
export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must not exceed 200 characters"),
  content: z.string().min(1, "Content is required"),
  published: z.boolean().optional().default(false),
  featured: z.boolean().optional().default(false),
  imageUrl: z.string().url("Invalid image URL").optional(),
  categoryIds: z.array(z.string()).optional(),
  tagNames: z.array(z.string()).optional(),
});

export const updatePostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must not exceed 200 characters").optional(),
  content: z.string().min(1, "Content is required").optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  imageUrl: z.string().url("Invalid image URL").optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  tagNames: z.array(z.string()).optional(),
});

// Comment schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required").max(1000, "Comment must not exceed 1000 characters"),
  postId: z.string().min(1, "Post ID is required"),
  parentId: z.string().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required").max(1000, "Comment must not exceed 1000 characters"),
});

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name must not exceed 50 characters"),
  slug: z.string()
    .min(1, "Slug is required")
    .max(50, "Slug must not exceed 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(200, "Description must not exceed 200 characters").optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format").optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name must not exceed 50 characters").optional(),
  slug: z.string()
    .min(1, "Slug is required")
    .max(50, "Slug must not exceed 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().max(200, "Description must not exceed 200 characters").optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format").optional(),
});

// Tag schemas
export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(30, "Tag name must not exceed 30 characters"),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1)).optional().default("1").transform(Number),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional().default("10").transform(Number),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "title", "name"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const postQuerySchema = paginationSchema.extend({
  published: z.string().transform(val => val === "true").optional(),
  featured: z.string().transform(val => val === "true").optional(),
  categoryId: z.string().optional(),
  tagId: z.string().optional(),
  authorId: z.string().optional(),
});

// Settings schemas
export const updateSettingsSchema = z.object({
  key: z.string().min(1, "Setting key is required"),
  value: z.string().min(1, "Setting value is required"),
  description: z.string().optional(),
});

// File upload schemas
export const fileUploadSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  contentType: z.string().min(1, "Content type is required"),
  size: z.number().max(10 * 1024 * 1024, "File size must not exceed 10MB"), // 10MB limit
});

// Notification schemas
export const createNotificationSchema = z.object({
  type: z.enum(["LIKE", "COMMENT", "FOLLOW", "MENTION", "SYSTEM"]),
  title: z.string().min(1, "Title is required").max(100, "Title must not exceed 100 characters"),
  message: z.string().max(500, "Message must not exceed 500 characters").optional(),
  userId: z.string().min(1, "User ID is required"),
  entityId: z.string().optional(),
  entityType: z.string().optional(),
});

// ID parameter schema
export const idSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

// Export type inference helpers
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type PostQueryInput = z.infer<typeof postQuerySchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type IdInput = z.infer<typeof idSchema>;