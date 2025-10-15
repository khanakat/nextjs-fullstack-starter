import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { TemplateGallery } from '@/components/reports/template-gallery';
import { TemplateGallerySkeleton } from '@/components/reports/template-gallery-skeleton';

export const metadata = {
  title: 'Template Gallery',
  description: 'Browse and manage report templates'
};

interface TemplateGalleryPageProps {
  searchParams: {
    category?: string;
    search?: string;
    sort?: string;
  };
}

export default async function TemplateGalleryPage({ searchParams }: TemplateGalleryPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Template Gallery</h1>
        <p className="text-muted-foreground mt-2">
          Browse, create, and manage report templates to streamline your reporting workflow
        </p>
      </div>

      <Suspense fallback={<TemplateGallerySkeleton />}>
        <TemplateGallery 
          userId={userId}
          initialCategory={searchParams.category}
          initialSearch={searchParams.search}
          initialSort={searchParams.sort}
        />
      </Suspense>
    </div>
  );
}