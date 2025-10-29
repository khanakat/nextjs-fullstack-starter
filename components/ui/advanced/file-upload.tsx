"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Upload,
  X,
  File,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import NextImage from "next/image";

// Types
export interface FileUploadItem {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  url?: string;
  preview?: string;
}

export interface FileUploadProps {
  onFilesChange: (files: FileUploadItem[]) => void;
  onUpload?: (
    files: File[],
  ) => Promise<{ success: boolean; url?: string; error?: string }[]>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  dropzoneText?: string;
  showPreview?: boolean;
  allowedTypes?: string[];
  children?: React.ReactNode;
}

export interface FilePreviewProps {
  file: FileUploadItem;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return Image;
  if (type.startsWith("video/")) return Video;
  if (type.startsWith("audio/")) return Music;
  if (type.includes("text") || type.includes("document")) return FileText;
  if (type.includes("zip") || type.includes("rar") || type.includes("tar"))
    return Archive;
  return File;
};

const createFilePreview = (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    } else {
      resolve(null);
    }
  });
};

const validateFile = (
  file: File,
  maxSize?: number,
  allowedTypes?: string[],
): { valid: boolean; error?: string } => {
  if (maxSize && file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(maxSize)}`,
    };
  }

  if (allowedTypes && !allowedTypes.some((type) => file.type.includes(type))) {
    return { valid: false, error: "File type not allowed" };
  }

  return { valid: true };
};

// File Preview Component
export function FilePreview({
  file,
  onRemove,
  onRetry,
  showActions = true,
  compact = false,
}: FilePreviewProps) {
  const IconComponent = getFileIcon(file.file.type);

  return (
    <Card
      className={cn(
        "relative group",
        file.status === "error" && "border-destructive",
        file.status === "success" && "border-green-500",
        compact && "p-2",
      )}
    >
      <CardContent className={cn("p-4", compact && "p-2")}>
        <div className="flex items-start space-x-3">
          {/* File Icon/Preview */}
          <div className="flex-shrink-0">
            {file.preview ? (
              <div className="relative">
                <NextImage
                  src={file.preview}
                  alt={file.file.name}
                  width={compact ? 40 : 48}
                  height={compact ? 40 : 48}
                  className={cn(
                    "rounded object-cover",
                    compact ? "w-10 h-10" : "w-12 h-12",
                  )}
                />
                {file.status === "uploading" && (
                  <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <div
                className={cn(
                  "rounded bg-muted flex items-center justify-center",
                  compact ? "w-10 h-10" : "w-12 h-12",
                )}
              >
                <IconComponent
                  className={cn(
                    "text-muted-foreground",
                    compact ? "w-4 h-4" : "w-5 h-5",
                  )}
                />
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p
                className={cn(
                  "font-medium truncate",
                  compact ? "text-sm" : "text-base",
                )}
              >
                {file.file.name}
              </p>

              {/* Status Badge */}
              {file.status === "success" && (
                <Badge variant="secondary" className="text-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Success
                </Badge>
              )}
              {file.status === "error" && (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Error
                </Badge>
              )}
              {file.status === "uploading" && (
                <Badge variant="secondary">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Uploading
                </Badge>
              )}
            </div>

            <p
              className={cn(
                "text-muted-foreground",
                compact ? "text-xs" : "text-sm",
              )}
            >
              {formatFileSize(file.file.size)}
            </p>

            {/* Progress Bar */}
            {file.status === "uploading" && (
              <Progress value={file.progress} className="mt-2 h-1" />
            )}

            {/* Error Message */}
            {file.status === "error" && file.error && (
              <p className="text-destructive text-xs mt-1">{file.error}</p>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-1">
              {file.url && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(file.url, "_blank")}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View file</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {file.status === "error" && onRetry && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRetry(file.id)}
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Retry upload</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove file</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Main File Upload Component
export function FileUpload({
  onFilesChange,
  onUpload,
  accept,
  multiple = true,
  maxSize,
  maxFiles,
  disabled = false,
  className,
  dropzoneText = "Drop files here or click to browse",
  showPreview = true,
  allowedTypes,
  children,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate unique ID for files
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Create file upload item
  const createFileItem = useCallback(
    async (file: File): Promise<FileUploadItem> => {
      const preview = await createFilePreview(file);
      return {
        id: generateId(),
        file,
        status: "pending",
        progress: 0,
        preview: preview || undefined,
      };
    },
    [],
  );

  // Upload files
  const uploadFiles = useCallback(
    async (filesToUpload: FileUploadItem[]) => {
      if (!onUpload) return;

      // Update status to uploading
      setFiles((prev) =>
        prev.map((file) =>
          filesToUpload.find((f) => f.id === file.id)
            ? { ...file, status: "uploading" as const, progress: 0 }
            : file,
        ),
      );

      const fileObjects = filesToUpload.map((item) => item.file);

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setFiles((prev) =>
            prev.map((file) => {
              const uploadingFile = filesToUpload.find((f) => f.id === file.id);
              if (uploadingFile && file.status === "uploading") {
                return { ...file, progress: Math.min(file.progress + 10, 90) };
              }
              return file;
            }),
          );
        }, 200);

        const results = await onUpload(fileObjects);
        clearInterval(progressInterval);

        // Update files with results
        setFiles((prev) =>
          prev.map((file) => {
            const uploadIndex = filesToUpload.findIndex(
              (f) => f.id === file.id,
            );
            if (uploadIndex !== -1) {
              const result = results[uploadIndex];
              return {
                ...file,
                status: result.success
                  ? ("success" as const)
                  : ("error" as const),
                progress: 100,
                error: result.error,
                url: result.url,
              };
            }
            return file;
          }),
        );
      } catch (error) {
        // Handle upload error
        setFiles((prev) =>
          prev.map((file) =>
            filesToUpload.find((f) => f.id === file.id)
              ? {
                  ...file,
                  status: "error" as const,
                  progress: 0,
                  error: "Upload failed",
                }
              : file,
          ),
        );
      }
    },
    [onUpload],
  );

  // Handle file selection
  const handleFiles = useCallback(
    async (selectedFiles: File[]) => {
      if (disabled) return;

      let validFiles = selectedFiles;

      // Limit number of files
      if (maxFiles) {
        const remainingSlots = maxFiles - files.length;
        validFiles = selectedFiles.slice(0, remainingSlots);
      }

      // Validate and create file items
      const newFileItems: FileUploadItem[] = [];

      for (const file of validFiles) {
        const validation = validateFile(file, maxSize, allowedTypes);
        const fileItem = await createFileItem(file);

        if (!validation.valid) {
          fileItem.status = "error";
          fileItem.error = validation.error;
        }

        newFileItems.push(fileItem);
      }

      const updatedFiles = [...files, ...newFileItems];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);

      // Auto-upload valid files if onUpload is provided
      if (onUpload) {
        const validNewFiles = newFileItems.filter(
          (item) => item.status === "pending",
        );
        if (validNewFiles.length > 0) {
          uploadFiles(validNewFiles);
        }
      }
    },
    [
      files,
      maxFiles,
      maxSize,
      allowedTypes,
      disabled,
      onFilesChange,
      onUpload,
      uploadFiles,
      createFileItem,
    ],
  );

  // Handle drag events
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    },
    [disabled, handleFiles],
  );

  // Handle file input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      handleFiles(selectedFiles);

      // Reset input value
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFiles],
  );

  // Remove file
  const removeFile = useCallback(
    (id: string) => {
      const updatedFiles = files.filter((file) => file.id !== id);
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    },
    [files, onFilesChange],
  );

  // Retry upload
  const retryUpload = useCallback(
    (id: string) => {
      const fileToRetry = files.find((file) => file.id === id);
      if (fileToRetry && onUpload) {
        uploadFiles([fileToRetry]);
      }
    },
    [files, onUpload, uploadFiles],
  );

  // Open file dialog
  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Update parent when files change
  useEffect(() => {
    onFilesChange(files);
  }, [files, onFilesChange]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Drop zone */}
      {children || (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            "hover:border-primary hover:bg-primary/5",
            isDragOver && "border-primary bg-primary/10",
            disabled &&
              "cursor-not-allowed opacity-50 hover:border-border hover:bg-transparent",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          )}
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-label="Upload files"
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">{dropzoneText}</p>
          <p className="text-sm text-muted-foreground">
            {accept && `Accepted formats: ${accept}`}
            {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
            {maxFiles && ` • Max files: ${maxFiles}`}
          </p>
        </div>
      )}

      {/* File previews */}
      {showPreview && files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Files ({files.length})</h4>
          <div className="space-y-2">
            {files.map((file) => (
              <FilePreview
                key={file.id}
                file={file}
                onRemove={removeFile}
                onRetry={retryUpload}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upload actions */}
      {files.length > 0 && onUpload && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {files.filter((f) => f.status === "success").length} of{" "}
            {files.length} uploaded
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFiles([]);
                onFilesChange([]);
              }}
            >
              Clear All
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const failedFiles = files.filter((f) => f.status === "error");
                if (failedFiles.length > 0) {
                  uploadFiles(failedFiles);
                }
              }}
              disabled={!files.some((f) => f.status === "error")}
            >
              Retry Failed
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact File Upload Component
export function CompactFileUpload(props: Omit<FileUploadProps, "showPreview">) {
  return (
    <FileUpload
      {...props}
      showPreview={false}
      className={cn("space-y-2", props.className)}
    >
      <Button
        variant="outline"
        className="w-full"
        disabled={props.disabled}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = props.accept || "";
          input.multiple = props.multiple || false;
          input.onchange = (e) => {
            Array.from((e.target as HTMLInputElement).files || []);
            // This would need to be connected to the parent component's file handling
          };
          input.click();
        }}
      >
        <Upload className="w-4 h-4 mr-2" />
        Choose Files
      </Button>
    </FileUpload>
  );
}

// Image Upload Component (specialized for images)
export function ImageUpload(
  props: Omit<FileUploadProps, "accept" | "allowedTypes">,
) {
  return (
    <FileUpload
      {...props}
      accept="image/*"
      allowedTypes={["image"]}
      dropzoneText="Drop images here or click to browse"
    />
  );
}

// Document Upload Component (specialized for documents)
export function DocumentUpload(
  props: Omit<FileUploadProps, "accept" | "allowedTypes">,
) {
  return (
    <FileUpload
      {...props}
      accept=".pdf,.doc,.docx,.txt,.rtf"
      allowedTypes={["pdf", "document", "text"]}
      dropzoneText="Drop documents here or click to browse"
    />
  );
}
