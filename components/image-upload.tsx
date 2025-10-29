"use client";

import { X, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

import { UploadDropzone } from "@/lib/uploadthing";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export const ImageUpload = ({
  value,
  onChange,
  disabled,
}: ImageUploadProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  if (value) {
    return (
      <div className="relative w-full h-60">
        <Image
          fill
          alt="Upload"
          src={value}
          className="rounded-lg object-cover"
        />
        {!disabled && (
          <button
            onClick={() => onChange("")}
            className="bg-rose-500 text-white p-1 rounded-full absolute top-2 right-2 shadow-sm"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  if (disabled) {
    return (
      <div className="p-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
        <ImageIcon className="h-10 w-10 text-gray-400" />
        <p className="text-gray-500">Upload disabled</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <UploadDropzone
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          onChange(res?.[0]?.url || "");
        }}
        onUploadError={(error: Error) => {
          console.error(`ERROR! ${error.message}`);
        }}
      />
    </div>
  );
};
