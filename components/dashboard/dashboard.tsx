import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Users,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface DashboardProps {
  className?: string;
}

export function Dashboard({ className }: DashboardProps) {
  const stats = [
    {
      title: "Total Users",
      value: "2,543",
      change: "+12.5%",
      trend: "up" as const,
      icon: Users,
    },
    {
      title: "Revenue",
      value: "$45,231",
      change: "+8.2%",
      trend: "up" as const,
      icon: TrendingUp,
    },
    {
      title: "Active Sessions",
      value: "1,234",
      change: "-2.1%",
      trend: "down" as const,
      icon: Activity,
    },
    {
      title: "Conversion Rate",
      value: "3.24%",
      change: "+0.5%",
      trend: "up" as const,
      icon: BarChart3,
    },
  ];

  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span
                  className={
                    stat.trend === "up" ? "text-green-500" : "text-red-500"
                  }
                >
                  {stat.change}
                </span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Chart placeholder - integrate with your preferred charting library
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: "User registered",
                  time: "2 minutes ago",
                  status: "success",
                },
                {
                  action: "Payment processed",
                  time: "5 minutes ago",
                  status: "success",
                },
                {
                  action: "Error in API",
                  time: "10 minutes ago",
                  status: "error",
                },
                {
                  action: "New feature deployed",
                  time: "1 hour ago",
                  status: "info",
                },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        activity.status === "success"
                          ? "default"
                          : activity.status === "error"
                            ? "destructive"
                            : "secondary"
                      }
                      className="w-2 h-2 p-0"
                    />
                    <span className="text-sm">{activity.action}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
