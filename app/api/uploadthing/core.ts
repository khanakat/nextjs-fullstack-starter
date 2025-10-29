import { currentUser } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";

const f = createUploadthing();

const handleAuth = async () => {
  const requestId = generateRequestId();

  try {
    const user = await currentUser();

    if (!user?.id) {
      logger.warn("Unauthorized upload attempt", "uploadthing", { requestId });
      throw new UploadThingError("Unauthorized");
    }

    logger.info("User authenticated for upload", "uploadthing", {
      requestId,
      userId: user.id,
    });

    return { userId: user.id, requestId };
  } catch (error) {
    logger.error("Authentication error in upload handler", "uploadthing", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
};

export const ourFileRouter = {
  // Image uploader for profiles, posts, etc.
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(() => handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      const { userId, requestId } = metadata;

      try {
        logger.info("Image upload completed successfully", "uploadthing", {
          requestId,
          userId,
          fileName: file.name,
          fileSize: file.size,
          fileUrl: file.url,
          fileType: file.type,
        });

        return { uploadedBy: userId };
      } catch (error) {
        logger.error("Error processing completed image upload", "uploadthing", {
          requestId,
          userId,
          fileName: file.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    }),

  // General file uploader for documents, PDFs, etc.
  fileUploader: f(["image", "pdf", "text"])
    .middleware(() => handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      const { userId, requestId } = metadata;

      try {
        logger.info("File upload completed successfully", "uploadthing", {
          requestId,
          userId,
          fileName: file.name,
          fileSize: file.size,
          fileUrl: file.url,
          fileType: file.type,
        });

        return { uploadedBy: userId };
      } catch (error) {
        logger.error("Error processing completed file upload", "uploadthing", {
          requestId,
          userId,
          fileName: file.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    }),

  // Video uploader for content platforms
  videoUploader: f({
    video: {
      maxFileCount: 1,
      maxFileSize: "256MB",
    },
  })
    .middleware(() => handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      const { userId, requestId } = metadata;

      try {
        logger.info("Video upload completed successfully", "uploadthing", {
          requestId,
          userId,
          fileName: file.name,
          fileSize: file.size,
          fileUrl: file.url,
          fileType: file.type,
        });

        return { uploadedBy: userId };
      } catch (error) {
        logger.error("Error processing completed video upload", "uploadthing", {
          requestId,
          userId,
          fileName: file.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
