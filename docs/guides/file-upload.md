# 📁 File Upload System

The template includes a comprehensive file upload system powered by **UploadThing**, providing secure, efficient file handling for images, documents, and media files.

## 🌟 Features

- ✅ **Multiple File Types**: Images, PDFs, videos, documents
- ✅ **Type Validation**: Automatic file type checking and restrictions
- ✅ **Size Limits**: Configurable upload limits per file type
- ✅ **User Authentication**: Upload restricted to authenticated users
- ✅ **Progress Tracking**: Real-time upload progress indicators
- ✅ **Error Handling**: Comprehensive error states and validation
- ✅ **Responsive UI**: Mobile-optimized upload components

## 📦 Components

### ImageUpload Component

```tsx
import { ImageUpload } from "@/components/image-upload";

<ImageUpload value={imageUrl} onChange={setImageUrl} disabled={false} />;
```

### FileUpload Component

```tsx
import { FileUpload } from "@/components/file-upload";

<FileUpload
  endpoint="fileUploader" // or "imageUploader", "videoUploader"
  value={fileUrl}
  onChange={setFileUrl}
/>;
```

## 🛠️ Configuration

### Environment Variables

```env
# UploadThing configuration
UPLOADTHING_SECRET="sk_live_your_uploadthing_secret"
UPLOADTHING_APP_ID="your_uploadthing_app_id"
```

### Available Endpoints

- `imageUploader`: Images only (4MB max)
- `fileUploader`: Images, PDFs, text files (4MB max)
- `videoUploader`: Video files (256MB max)

## 🔧 Database Schema

The Post model includes file attachment fields:

```prisma
model Post {
  id             String   @id @default(cuid())
  title          String?
  content        String?  @db.Text
  imageUrl       String?  // Main post image
  attachmentUrl  String?  // Additional file attachment
  attachmentType String?  // File type: "image", "pdf", "video"
  // ... other fields
}
```

The User model includes profile image:

```prisma
model User {
  id     String  @id @default(cuid())
  email  String  @unique
  name   String?
  image  String? // Profile avatar
  // ... other fields
}
```

## 🚀 Usage Examples

### Basic Image Upload

```tsx
"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/image-upload";

export default function ProfilePage() {
  const [avatar, setAvatar] = useState("");

  return (
    <div>
      <h2>Update Profile Picture</h2>
      <ImageUpload value={avatar} onChange={setAvatar} />
    </div>
  );
}
```

### Document Upload with Validation

```tsx
"use client";

import { useState } from "react";
import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";

export default function DocumentUpload() {
  const [documentUrl, setDocumentUrl] = useState("");

  const handleSubmit = async () => {
    if (!documentUrl) return;

    // Save to database
    const response = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: documentUrl }),
    });
  };

  return (
    <div>
      <FileUpload
        endpoint="fileUploader"
        value={documentUrl}
        onChange={(url) => setDocumentUrl(url || "")}
      />
      <Button onClick={handleSubmit} disabled={!documentUrl}>
        Save Document
      </Button>
    </div>
  );
}
```

## 🔐 Security Features

- **Authentication Required**: All uploads require user authentication
- **File Type Validation**: Server-side validation of file types
- **Size Limitations**: Configurable upload size limits
- **Secure URLs**: Generated secure URLs for file access
- **Automatic Cleanup**: Unused files are automatically cleaned up

## 📱 Testing

Visit `/dashboard` to test the upload functionality with the interactive demo components.

## 🛡️ File Type Support

### Images

- **Formats**: JPG, PNG, GIF, WebP
- **Max Size**: 4MB
- **Use Cases**: Profile pictures, post images, thumbnails

### Documents

- **Formats**: PDF, TXT, DOC, DOCX
- **Max Size**: 4MB
- **Use Cases**: Attachments, documentation, reports

### Videos

- **Formats**: MP4, MOV, AVI, WebM
- **Max Size**: 256MB
- **Use Cases**: Content uploads, tutorials, presentations

## 🔧 Customization

### Custom Upload Endpoints

Add new endpoints in `app/api/uploadthing/core.ts`:

```ts
export const ourFileRouter = {
  profileImage: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  })
    .middleware(() => handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      // Custom logic after upload
      return { success: true };
    }),
} satisfies FileRouter;
```

### UI Customization

All components use Tailwind CSS classes and can be customized by modifying the component files in `/components/`.

## 📚 Learn More

- [UploadThing Documentation](https://docs.uploadthing.com/)
- [File Upload Best Practices](https://web.dev/file-upload-best-practices/)
- [Next.js File Upload Guide](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#uploading-files)
