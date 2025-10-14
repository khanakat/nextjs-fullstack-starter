"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export default function UploadDemo() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string>("");

  const handleSave = () => {
    if (imageUrl || fileUrl) {
      toast.success("Files uploaded successfully!");
      console.log("Image URL:", imageUrl);
      console.log("File URL:", fileUrl);
    } else {
      toast.error("Please upload at least one file");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🚀 File Upload System</CardTitle>
          <p className="text-sm text-muted-foreground">
            Test the new UploadThing integration for images and files
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload */}
          <div>
            <h3 className="text-lg font-medium mb-3">Image Upload</h3>
            <ImageUpload 
              value={imageUrl} 
              onChange={setImageUrl} 
            />
          </div>

          {/* File Upload */}
          <div>
            <h3 className="text-lg font-medium mb-3">File Upload (Images, PDFs, Text)</h3>
            <FileUpload 
              endpoint="fileUploader"
              value={fileUrl} 
              onChange={(url) => setFileUrl(url || "")} 
            />
          </div>

          {/* Display uploaded files */}
          {(imageUrl || fileUrl) ? (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Uploaded Files:</h4>
              {imageUrl && (
                <p className="text-sm text-muted-foreground">
                  Image: <span className="font-mono text-xs">{imageUrl}</span>
                </p>
              )}
              {fileUrl && (
                <p className="text-sm text-muted-foreground">
                  File: <span className="font-mono text-xs">{fileUrl}</span>
                </p>
              )}
            </div>
          ) : (
            <EmptyState
              title="No files uploaded yet"
              subtitle="Upload images or files to see them here"
              icon={<Upload className="h-12 w-12" />}
            />
          )}

          <Button onClick={handleSave} className="w-full">
            Save Files
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}