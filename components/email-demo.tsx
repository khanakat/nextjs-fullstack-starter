"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, Send, CheckCircle, AlertCircle } from "lucide-react";

export default function EmailDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [customEmail, setCustomEmail] = useState({
    subject: "Test Email from FullStack Starter",
    html: "<h1>Hello!</h1><p>This is a test email from your FullStack Starter template.</p><p>The email system is working correctly! 🎉</p>",
    text: ""
  });

  const sendTestEmail = async (type: string, data?: any) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, data }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`${type} email sent successfully!`);
      } else {
        toast.error(`Failed to send email: ${result.error}`);
      }
    } catch (error) {
      toast.error('Network error occurred');
      console.error('Email test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const emailTypes = [
    {
      type: 'welcome',
      title: 'Welcome Email',
      description: 'Onboarding email for new users',
      icon: '👋',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      type: 'email-verification',
      title: 'Email Verification',
      description: 'Verify email address for new accounts',
      icon: '✅',
      color: 'bg-green-50 border-green-200'
    },
    {
      type: 'password-reset',
      title: 'Password Reset',
      description: 'Password recovery email',
      icon: '🔐',
      color: 'bg-red-50 border-red-200'
    },
    {
      type: 'notification',
      title: 'Notification',
      description: 'General notification email',
      icon: '🔔',
      color: 'bg-purple-50 border-purple-200'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            📧 Email System Demo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test the Resend email integration with pre-built templates. Emails will be sent to your account email.
          </p>
        </CardHeader>
        <CardContent>
          {process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  <strong>Setup Required:</strong> Add RESEND_API_KEY to your .env.local file to test email functionality.
                </p>
              </div>
            </div>
          )}

          {/* Pre-built Email Templates */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pre-built Email Templates</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {emailTypes.map((email) => (
                <div key={email.type} className={`p-4 border rounded-lg ${email.color}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span>{email.icon}</span>
                        <h4 className="font-medium">{email.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{email.description}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => sendTestEmail(email.type)}
                      disabled={isLoading}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Send
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Email */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-medium">Custom Email</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={customEmail.subject}
                  onChange={(e) => setCustomEmail({ ...customEmail, subject: e.target.value })}
                  placeholder="Email subject..."
                />
              </div>
              <div>
                <Label htmlFor="html">HTML Content</Label>
                <Textarea
                  id="html"
                  value={customEmail.html}
                  onChange={(e) => setCustomEmail({ ...customEmail, html: e.target.value })}
                  placeholder="HTML email content..."
                  rows={6}
                />
              </div>
              <div>
                <Label htmlFor="text">Text Content (Optional)</Label>
                <Textarea
                  id="text"
                  value={customEmail.text}
                  onChange={(e) => setCustomEmail({ ...customEmail, text: e.target.value })}
                  placeholder="Plain text email content..."
                  rows={3}
                />
              </div>
              <Button
                onClick={() => sendTestEmail('custom', customEmail)}
                disabled={isLoading || !customEmail.subject || !customEmail.html}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Custom Email
              </Button>
            </div>
          </div>

          {/* Email Features */}
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Email System Features
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Resend API integration for reliable delivery</li>
              <li>• Pre-built responsive email templates</li>
              <li>• Retry logic with exponential backoff</li>
              <li>• Support for HTML and plain text content</li>
              <li>• Bulk email sending capabilities</li>
              <li>• Error handling and logging</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}