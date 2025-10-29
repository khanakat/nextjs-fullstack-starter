import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { currentProfile } from "@/lib/current-profile";
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  LineChart,
} from "lucide-react";
// import { LazyLoad } from "@/components/ui/lazy-loading";
// import { Suspense } from "react";
// import { Skeleton } from "@/components/ui/skeleton";

// Lazy load heavy components
// import dynamic from "next/dynamic";

// const LazyAnalyticsDashboard = dynamic(
//   () => import("@/components/analytics/analytics-dashboard").then(mod => ({ default: mod.AnalyticsDashboard })),
//   {
//     loading: () => (
//       <div className="space-y-6">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {Array.from({ length: 4 }).map((_, i) => (
//             <Card key={i}>
//               <CardContent className="p-6">
//                 <Skeleton className="h-4 w-20 mb-2" />
//                 <Skeleton className="h-8 w-16 mb-4" />
//                 <Skeleton className="h-2 w-full" />
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//         <Skeleton className="h-64 w-full" />
//       </div>
//     ),
//     ssr: false,
//   }
// );

export const metadata: Metadata = {
  title: "Analytics | Fullstack Template",
  description: "Analytics dashboard with charts and metrics visualization.",
};

// Mock analytics data
const analyticsData = {
  totalUsers: 12543,
  activeUsers: 8932,
  totalRevenue: 45678,
  conversionRate: 3.2,
  pageViews: 98432,
  bounceRate: 32.4,
};

const chartData = [
  { name: "Jan", users: 4000, revenue: 2400 },
  { name: "Feb", users: 3000, revenue: 1398 },
  { name: "Mar", users: 2000, revenue: 9800 },
  { name: "Apr", users: 2780, revenue: 3908 },
  { name: "May", users: 1890, revenue: 4800 },
  { name: "Jun", users: 2390, revenue: 3800 },
];

export default async function AnalyticsPage() {
  const profile = await currentProfile();

  return (
    <Container className="py-6">
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor your application metrics and user engagement.
          </p>
          {profile && (
            <Badge variant="outline" className="mt-2">
              {profile.name}'s Analytics
            </Badge>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+20.1%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.activeUsers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+15.3%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${analyticsData.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+25.2%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversion Rate
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.conversionRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">-2.1%</span> from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chartData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(item.users / 4000) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {item.users.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chartData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(item.revenue / 9800) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ${item.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Page Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {analyticsData.pageViews.toLocaleString()}
              </div>
              <Badge variant="outline">+12.5% this week</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bounce Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {analyticsData.bounceRate}%
              </div>
              <Badge variant="outline">-3.2% this week</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Session Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">4m 32s</div>
              <Badge variant="outline">+1.2m this week</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Charts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Advanced Analytics Charts
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Detailed charts and visualizations will appear here
            </p>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="No detailed charts available"
              subtitle="Connect your analytics provider to see detailed charts and visualizations"
              icon={<LineChart className="h-12 w-12" />}
            />
          </CardContent>
        </Card>

        {/* Implementation Note */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Note</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This is a demo analytics dashboard showing mock data. In a
              production environment, you would integrate with analytics
              services like Google Analytics, Mixpanel, or build custom tracking
              with your database.
            </p>
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-sm">
                Recommended Analytics Tools:
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Google Analytics 4 for web analytics</li>
                <li>• Mixpanel or Amplitude for product analytics</li>
                <li>• PostHog for open-source analytics</li>
                <li>• Custom database queries for application metrics</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
