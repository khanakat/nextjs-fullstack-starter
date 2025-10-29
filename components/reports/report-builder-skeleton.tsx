"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ReportBuilderSkeleton() {
  return (
    <div className="h-full flex">
      {/* Left Sidebar Skeleton */}
      <div className="w-80 border-r bg-gray-50/50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="flex-1 p-4">
          <div className="grid gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-3 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas Skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar Skeleton */}
        <div className="border-b bg-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-16" />
          </div>
        </div>

        {/* Canvas Skeleton */}
        <div className="flex-1 overflow-auto bg-gray-100">
          <div className="min-h-full p-8" style={{ minWidth: "1200px" }}>
            <div className="grid grid-cols-12 gap-4 min-h-[800px] bg-white rounded-lg p-6 shadow-sm">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="col-span-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Skeleton className="h-32 w-full rounded" />
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar Skeleton */}
      <div className="w-80 border-l bg-gray-50/50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <Skeleton className="h-6 w-24" />
        </div>

        <div className="flex-1 p-4 space-y-6">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-9 w-full" />
          </div>

          <div className="space-y-4">
            <div className="flex gap-1">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>

            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-9 w-full" />
            </div>

            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-9 w-full" />
            </div>

            <div>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
