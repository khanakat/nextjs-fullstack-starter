"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface Template {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    description?: string;
  };
  config: {
    title: string;
    description?: string;
    templateId?: string;
    filters: Record<string, any>;
    parameters: Record<string, any>;
    layout: {
      components: any[];
      grid: {
        columns: number;
        rows: number;
        gap: number;
      };
    };
    styling: {
      theme: "light" | "dark";
      primaryColor: string;
      secondaryColor: string;
      fontFamily: string;
      fontSize: number;
    };
  };
  isPublic: boolean;
  tags: string[];
  usageCount: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  reports?: {
    id: string;
    title: string;
    createdAt: string;
  }[];
  isFavorited?: boolean;
}

export interface TemplateFilters {
  search?: string;
  categoryId?: string;
  isPublic?: boolean;
  page?: number;
  limit?: number;
}

export interface TemplatesResponse {
  templates: Template[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useTemplates(filters: TemplateFilters = {}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (filters.search) searchParams.set("search", filters.search);
      if (filters.categoryId)
        searchParams.set("categoryId", filters.categoryId);
      if (filters.isPublic !== undefined)
        searchParams.set("isPublic", filters.isPublic.toString());
      if (filters.page) searchParams.set("page", filters.page.toString());
      if (filters.limit) searchParams.set("limit", filters.limit.toString());

      const response = await fetch(`/api/templates?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data: TemplatesResponse = await response.json();
      setTemplates(data.templates);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.categoryId, filters.isPublic, filters.page, filters.limit]);

  useEffect(() => {
    fetchTemplates();
  }, [
    filters.search,
    filters.categoryId,
    filters.isPublic,
    filters.page,
    filters.limit,
    fetchTemplates,
  ]);

  const createTemplate = async (
    templateData: Omit<
      Template,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "createdBy"
      | "updatedBy"
      | "usageCount"
    >,
  ) => {
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error("Failed to create template");
      }

      const newTemplate: Template = await response.json();
      setTemplates((prev) => [newTemplate, ...prev]);
      toast.success("Template created successfully");
      return newTemplate;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create template";
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<Template>) => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update template");
      }

      const updatedTemplate: Template = await response.json();
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? updatedTemplate : t)),
      );
      toast.success("Template updated successfully");
      return updatedTemplate;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update template";
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("Template deleted successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete template";
      toast.error(errorMessage);
      throw err;
    }
  };

  const duplicateTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/templates/${id}/duplicate`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate template");
      }

      const duplicatedTemplate: Template = await response.json();
      setTemplates((prev) => [duplicatedTemplate, ...prev]);
      toast.success("Template duplicated successfully");
      return duplicatedTemplate;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to duplicate template";
      toast.error(errorMessage);
      throw err;
    }
  };

  const toggleFavorite = async (id: string, isFavorited: boolean) => {
    try {
      const method = isFavorited ? "DELETE" : "POST";
      const response = await fetch(`/api/templates/${id}/favorite`, {
        method,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${isFavorited ? "unfavorite" : "favorite"} template`,
        );
      }

      setTemplates((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, isFavorited: !isFavorited } : t,
        ),
      );

      toast.success(
        `Template ${isFavorited ? "removed from" : "added to"} favorites`,
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update favorite status";
      toast.error(errorMessage);
      throw err;
    }
  };

  const refresh = () => {
    fetchTemplates();
  };

  return {
    templates,
    loading,
    error,
    total,
    totalPages,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    toggleFavorite,
    refresh,
  };
}
