"use client";

import * as React from "react";
import { useState, useMemo } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Download, Plus, ArrowUpDown } from "lucide-react";

export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<TData> {
  columns: DataTableColumn<TData>[];
  data: TData[];

  // Pagination props
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

export function DataTable<TData>({
  columns,
  data,

  // Pagination
  pageSize = 10,
  currentPage = 1,
  totalItems,
  onPageChange,
  onPageSizeChange,

  // Search and filter
  searchKey,
  searchPlaceholder = "Search...",
  onSearch,

  // Empty state
  emptyTitle = "No data found",
  emptySubtitle = "There are no items to display at the moment.",
  emptyAction,

  // Actions
  onCreate,
  createLabel = "Create New",
  onExport,

  // Customization
  className,
  showPagination = true,
  showSearch = true,
  showActions = true,
  loading = false,
}: DataTableProps<TData>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof TData | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm || !searchKey) return data;

    return data.filter((item) => {
      const value = item[searchKey];
      return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm, searchKey]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data (for client-side pagination)
  const paginatedData = useMemo(() => {
    if (onPageChange) {
      // Server-side pagination - return all data
      return sortedData;
    }

    // Client-side pagination
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, onPageChange]);

  // Calculate pagination values
  const totalPages = totalItems
    ? Math.ceil(totalItems / pageSize)
    : Math.ceil(sortedData.length / pageSize);

  const actualTotalItems = totalItems || sortedData.length;

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  // Handle sorting
  const handleSort = (key: keyof TData) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className={className}>
      {/* Header with search and actions */}
      {(showSearch || showActions) && (
        <div className="flex items-center justify-between py-4">
          {/* Search */}
          {showSearch && searchKey && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 max-w-sm"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && (onCreate || onExport) && (
            <div className="flex items-center gap-2">
              {onExport && (
                <Button variant="outline" onClick={onExport} size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
              {onCreate && (
                <Button onClick={onCreate} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  {createLabel}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={`font-medium ${column.className || ""}`}
                >
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleSort(column.key)}
                      className="h-auto p-0 font-medium"
                    >
                      {column.label}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-muted/50">
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.key)}
                      className={column.className}
                    >
                      {column.render
                        ? column.render(row[column.key], row, rowIndex)
                        : String(row[column.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 p-0">
                  <EmptyState
                    title={emptyTitle}
                    subtitle={emptySubtitle}
                    action={emptyAction}
                    icon={<Search className="h-12 w-12" />}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && !loading && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={actualTotalItems}
            onPageChange={onPageChange || (() => {})}
            onPageSizeChange={onPageSizeChange}
            showPageSizeSelector={!!onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
}
