import { commonMetadata } from "@/lib/seo";
import UploadDemo from "@/components/upload-demo";
import EmailDemo from "@/components/email-demo";
import SubscriptionDemo from "@/components/subscription-demo";
import SEODemo from "@/components/seo-demo";
import RealtimeDemo from "@/components/realtime-demo";
import { initialProfile } from "@/lib/initial-profile";
import { Container } from "@/components/ui/container";
import { 
  Activity,
  Upload, 
  Mail, 
  CreditCard, 
  Search,
  Zap,
  CheckCircle,
  Clock,
  Users,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// Generate dashboard metadata
export const metadata = commonMetadata.dashboard();

export default async function DashboardPage() {
  const profile = await initialProfile();
  
  // initialProfile handles authentication and redirects if needed
  // profile is guaranteed to exist at this point

  const features = [
    {
      title: "File Upload System",
      description: "UploadThing integration with drag & drop support",
      icon: Upload,
      href: "/upload",
      status: "Complete",
      color: "text-green-600"
    },
    {
      title: "Email System", 
      description: "Resend integration with React Email templates",
      icon: Mail,
      href: "/email",
      status: "Complete",
      color: "text-blue-600"
    },
    {
      title: "Payment System",
      description: "Stripe integration with subscriptions & webhooks",
      icon: CreditCard,
      href: "/payments", 
      status: "Complete",
      color: "text-purple-600"
    },
    {
      title: "SEO System",
      description: "Dynamic metadata and structured data",
      icon: Search,
      href: "/seo",
      status: "Complete", 
      color: "text-orange-600"
    },
    {
      title: "Real-time Features",
      description: "Notifications, SSE streaming & live updates",
      icon: Zap,
      href: "/realtime",
      status: "Complete",
      color: "text-yellow-600"
    },
    {
      title: "Pagination System",
      description: "Reusable pagination components & data tables",
      icon: BarChart3,
      href: "/pagination",
      status: "Complete",
      color: "text-indigo-600"
    }
  ];

  const stats = [
    {
      title: "Features Implemented",
      value: "6",
      icon: CheckCircle,
      change: "+100%"
    },
    {
      title: "Active Users",
      value: "1,234",
      icon: Users,
      change: "+12%"
    },
    {
      title: "Response Time",
      value: "45ms", 
      icon: Clock,
      change: "-5ms"
    },
    {
      title: "Uptime",
      value: "99.9%",
      icon: Activity,
      change: "+0.1%"
    }
  ];

  return (
    <Container className="py-8">
      <div className="space-y-8">
        {/* Header with User Info */}
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back{profile && typeof profile === 'object' && 'name' in profile ? `, ${profile.name}` : ''}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Your fullstack template dashboard is ready. All systems are operational.
          </p>
          {profile && typeof profile === 'object' && 'subscription' in profile && profile.subscription && (
            <Badge variant="outline" className="mt-2">
              {profile.subscription.plan} Plan
            </Badge>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">{stat.change}</span> from last month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Feature Systems
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Link key={index} href={feature.href}>
                    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 ${feature.color} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-sm">{feature.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {feature.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Link 
                  href="/upload" 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Upload className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Upload Files</span>
                </Link>
                <Link 
                  href="/email" 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Mail className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Send Email</span>
                </Link>
                <Link 
                  href="/payments" 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Manage Subscription</span>
                </Link>
                <Link 
                  href="/realtime" 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Real-time Demo</span>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Connection</span>
                  <Badge variant="default">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">File Upload Service</span>
                  <Badge variant="default">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email Service</span>
                  <Badge variant="default">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Payment Service</span>
                  <Badge variant="default">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Real-time Service</span>
                  <Badge variant="default">Online</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}