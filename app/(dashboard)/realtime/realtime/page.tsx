import RealtimeDemo from "@/components/realtime-demo";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Real-time Features | Fullstack Template",
  description: "Demonstration of real-time features including notifications, SSE streaming, and live data synchronization."
};

export default function RealtimePage() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Real-time Features</h1>
          <p className="text-muted-foreground mt-2">
            Experience live notifications, Server-Sent Events, and real-time data synchronization.
          </p>
        </div>
        
        <RealtimeDemo />
      </div>
    </div>
  );
}