"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { FileUploadZoneProps, UploadFile } from "@/src/types/drag-drop";
import {
  Upload,
  X,
  File,
  Image,
  Video,
  FileText,
  Archive,
  RefreshCw,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function FileUploadZone({
  onFilesAdded,
  onFileRemove,
  config = {},
  disabled = false,
  className = "",
  persistenceKey,
  autoSave = true,
  onStateChange,
}: FileUploadZoneProps) {
  const {
    acceptedFileTypes = [],
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    maxFiles = 10,
    multiple = true,
    showPreview = true,
  } = config;

  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef<{ [key: string]: number }>({});

  const { setNodeRef, isOver } = useDroppable({
    id: "file-upload-zone",
    disabled,
  });

  const loadPersistedState = useCallback(async () => {
    if (!persistenceKey) return;

    try {
      setIsLoading(true);
      const savedState = localStorage.getItem(`fileUpload_${persistenceKey}`);

      if (savedState) {
        const { files, timestamp } = JSON.parse(savedState);

        // Only restore if saved within last 24 hours
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (timestamp > dayAgo) {
          setUploadedFiles(files);
          setLastSaved(new Date(timestamp));
          setHasUnsavedChanges(false);
        } else {
          // Clear old state
          localStorage.removeItem(`fileUpload_${persistenceKey}`);
        }
      }
    } catch (error) {
      console.error("Error loading persisted state:", error);
      setError("Error al cargar el estado guardado");
    } finally {
      setIsLoading(false);
    }
  }, [persistenceKey]);

  const saveState = useCallback(async () => {
    if (!persistenceKey) return;

    try {
      const stateToSave = {
        files: uploadedFiles.map((file) => ({
          ...file,
          // Don't persist the actual File object, just metadata
          file: {
            name: file.file.name,
            size: file.file.size,
            type: file.file.type,
            lastModified: file.file.lastModified,
          },
        })),
        timestamp: Date.now(),
      };

      localStorage.setItem(
        `fileUpload_${persistenceKey}`,
        JSON.stringify(stateToSave),
      );
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving state:", error);
      setError("Error saving state");
    }
  }, [persistenceKey, uploadedFiles]);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxFileSize) {
        return `File "${file.name}" exceeds maximum size of ${formatFileSize(maxFileSize)}`;
      }

      // Check file type
      if (acceptedFileTypes.length > 0) {
        const isAccepted = acceptedFileTypes.some((type) => {
          if (type.startsWith(".")) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          return file.type.match(type);
        });

        if (!isAccepted) {
          return `El tipo de archivo "${file.type}" no está permitido`;
        }
      }

      return null;
    },
    [maxFileSize, acceptedFileTypes],
  );

  const simulateUpload = useCallback(
    async (uploadFile: UploadFile): Promise<void> => {
      const fileId = uploadFile.id;
      const retryCount = retryCountRef.current[fileId] || 0;

      try {
        // Update status to uploading
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: "uploading", progress: 0 } : f,
          ),
        );

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));

          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, progress } : f)),
          );
        }

        // Simulate potential failure (10% chance)
        if (Math.random() < 0.1 && retryCount < 3) {
          throw new Error("Upload failed");
        }

        // Mark as completed
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: "completed", progress: 100 } : f,
          ),
        );

        // Reset retry count on success
        delete retryCountRef.current[fileId];
        setHasUnsavedChanges(true);
      } catch (error) {
        console.error("Upload error:", error);

        // Increment retry count
        retryCountRef.current[fileId] = retryCount + 1;

        // Mark as error
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "error",
                  error: `Error en la subida (intento ${retryCount + 1}/3)`,
                }
              : f,
          ),
        );
      }
    },
    [],
  );

  const retryUpload = useCallback(
    (fileId: string) => {
      const file = uploadedFiles.find((f) => f.id === fileId);
      if (file && retryCountRef.current[fileId] < 3) {
        simulateUpload(file);
      }
    },
    [uploadedFiles, simulateUpload],
  );

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validFiles: UploadFile[] = [];
      let errorMessage = "";

      // Check if adding these files would exceed maxFiles limit
      if (uploadedFiles.length + fileArray.length > maxFiles) {
        setError(`No puedes subir más de ${maxFiles} archivos`);
        setTimeout(() => setError(null), 5000);
        return;
      }

      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          errorMessage = validationError;
          break;
        }

        const uploadFile: UploadFile = {
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          status: "pending",
          progress: 0,
        };

        validFiles.push(uploadFile);
      }

      if (errorMessage) {
        setError(errorMessage);
        setTimeout(() => setError(null), 5000);
        return;
      }

      if (validFiles.length > 0) {
        const processedFiles = validFiles.map((uploadFile) => uploadFile.file);
        onFilesAdded(processedFiles);
        setUploadedFiles((prev) => [...prev, ...validFiles]);
        setHasUnsavedChanges(true);
        setError(null);

        // Start upload simulation for each file
        validFiles.forEach((file) => {
          setTimeout(() => simulateUpload(file), Math.random() * 1000);
        });
      }
    },
    [
      onFilesAdded,
      validateFile,
      uploadedFiles.length,
      maxFiles,
      simulateUpload,
    ],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFiles(files);
      }
    },
    [disabled, processFiles],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setDragActive(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
      // Reset input value to allow selecting the same file again
      e.target.value = "";
    },
    [processFiles],
  );

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    setHasUnsavedChanges(true);
    delete retryCountRef.current[fileId];

    if (onFileRemove) {
      onFileRemove(fileId);
    }
  };

  const clearAllFiles = useCallback(() => {
    setUploadedFiles([]);
    setHasUnsavedChanges(true);
    retryCountRef.current = {};
  }, []);

  // Load persisted state on mount
  useEffect(() => {
    if (persistenceKey && typeof window !== "undefined") {
      loadPersistedState();
    }
  }, [persistenceKey, loadPersistedState]);

  // Auto-save when files change
  useEffect(() => {
    if (autoSave && persistenceKey && hasUnsavedChanges) {
      // Debounce auto-save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveState();
      }, 1000); // Auto-save after 1 second of inactivity
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [uploadedFiles, autoSave, persistenceKey, hasUnsavedChanges, saveState]);

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        files: uploadedFiles,
        hasUnsavedChanges,
        lastSaved,
        error,
      });
    }
  }, [uploadedFiles, hasUnsavedChanges, lastSaved, error, onStateChange]);

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/"))
      return <Image size={20} aria-label="Archivo de imagen" />;
    if (type.startsWith("video/"))
      return <Video size={20} aria-label="Archivo de video" />;
    if (type.includes("pdf") || type.includes("document"))
      return <FileText size={20} aria-label="Archivo de documento" />;
    if (type.includes("zip") || type.includes("rar"))
      return <Archive size={20} aria-label="Archivo comprimido" />;
    return <File size={20} aria-label="Archivo" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "uploading":
        return "text-blue-600";
      case "completed":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const dropZoneClasses = cn(
    "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
    {
      "border-blue-400 bg-blue-50": dragActive || isOver,
      "border-gray-300 hover:border-gray-400":
        !dragActive && !isOver && !disabled,
      "border-gray-200 bg-gray-50 cursor-not-allowed": disabled,
      "border-red-400 bg-red-50": error,
    },
    className,
  );

  if (isLoading) {
    return (
      <div className="w-full p-8 text-center">
        <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
        <p className="text-gray-600">Cargando estado guardado...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Persistence Status */}
      {persistenceKey && (
        <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 p-2 rounded">
          <div className="flex items-center space-x-2">
            <Save size={14} />
            <span>
              {hasUnsavedChanges
                ? "Unsaved changes"
                : lastSaved
                  ? `Saved: ${lastSaved.toLocaleTimeString()}`
                  : "Not saved"}
            </span>
          </div>
          {!autoSave && (
            <button
              onClick={saveState}
              disabled={!hasUnsavedChanges}
              className="px-2 py-1 bg-blue-600 text-white rounded text-xs disabled:bg-gray-400"
            >
              Save
            </button>
          )}
        </div>
      )}

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={dropZoneClasses}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          multiple={multiple}
          accept={acceptedFileTypes.join(",")}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center space-y-4">
          <div
            className={cn(
              "p-4 rounded-full",
              dragActive || isOver ? "bg-blue-100" : "bg-gray-100",
            )}
          >
            <Upload
              size={32}
              className={cn(
                dragActive || isOver ? "text-blue-600" : "text-gray-500",
              )}
            />
          </div>

          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">
              {dragActive || isOver
                ? "Suelta los archivos aquí"
                : "Arrastra archivos aquí o haz clic para seleccionar"}
            </p>

            <div className="text-sm text-gray-500 space-y-1">
              {acceptedFileTypes.length > 0 && (
                <p>Tipos permitidos: {acceptedFileTypes.join(", ")}</p>
              )}
              <p>Tamaño máximo: {formatFileSize(maxFileSize)}</p>
              <p>
                Máximo {maxFiles} archivo{maxFiles !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* File Preview */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-700">
              Archivos subidos ({uploadedFiles.length})
            </h4>
            {uploadedFiles.length > 1 && (
              <button
                onClick={clearAllFiles}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Limpiar todo
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={getStatusColor(file.status)}>
                    {getFileIcon(file.file.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{formatFileSize(file.file.size)}</span>
                      <span>•</span>
                      <span className={getStatusColor(file.status)}>
                        {file.status === "pending" && "Pendiente"}
                        {file.status === "uploading" && "Subiendo..."}
                        {file.status === "completed" && "Completado"}
                        {file.status === "error" && (file.error || "Error")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {file.status === "uploading" && (
                  <div className="w-20 mx-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-1">
                  {file.status === "error" &&
                    retryCountRef.current[file.id] < 3 && (
                      <button
                        onClick={() => retryUpload(file.id)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        title="Reintentar subida"
                      >
                        <RefreshCw size={16} />
                      </button>
                    )}

                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                    disabled={file.status === "uploading"}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
