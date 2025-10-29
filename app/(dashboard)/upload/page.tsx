import { Metadata } from "next";
import { currentProfile } from "@/lib/current-profile";
import { Container } from "@/components/ui/container";
import UploadDemo from "@/components/upload-demo";

export const metadata: Metadata = {
  title: "File Upload | Fullstack Template",
  description:
    "Secure file uploads with UploadThing integration and drag & drop support.",
};

export default async function UploadPage() {
  const profile = await currentProfile();

  return (
    <Container className="py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            File Upload System
          </h1>
          <p className="text-muted-foreground mt-2">
            Secure file uploads with UploadThing integration and drag & drop
            support.
          </p>
          {profile && (
            <p className="text-sm text-muted-foreground mt-1">
              Logged in as {profile.name}
            </p>
          )}
        </div>

        <UploadDemo />
      </div>
    </Container>
  );
}
