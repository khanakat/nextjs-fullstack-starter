'use client';

import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ErrorTestPage() {
  // This will cause a runtime error
  const throwError = () => {
    throw new Error("This is a test error to validate error boundaries");
  };

  // This simulates a server error
  const serverError = () => {
    try {
      // @ts-ignore - Intentionally accessing undefined property
      const result = undefined.someProperty;
      return result;
    } catch (error) {
      console.error('Server error test:', error);
      throw error;
    }
  };

  return (
    <Container className="py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Error Handling Test Page</h1>
          <p className="text-muted-foreground mt-2">
            Test the global error boundaries and loading states
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Runtime Error Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will trigger the global error boundary
              </p>
              <Button onClick={throwError} variant="destructive">
                Throw Runtime Error
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Server Error Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will cause a server-side error
              </p>
              <Button onClick={serverError} variant="destructive">
                Trigger Server Error
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Error Pages Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Test the custom error pages
            </p>
            <div className="flex gap-4">
              <Button asChild variant="outline">
                <a href="/non-existent-page" target="_blank">
                  Test 404 Page
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}