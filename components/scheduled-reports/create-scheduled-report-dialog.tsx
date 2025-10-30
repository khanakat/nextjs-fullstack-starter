"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CronExpressionBuilder } from "./cron-expression-builder";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X } from "lucide-react";

const createScheduledReportSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  reportId: z.string().min(1, "Report is required"),
  schedule: z.object({
    frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    timezone: z.string().min(1, "Timezone is required"),
  }),
  recipients: z.array(z.string().email("Invalid email address")).min(1, "At least one recipient is required"),
  format: z.enum(["pdf", "xlsx", "csv"]),
});

type CreateScheduledReportForm = z.infer<typeof createScheduledReportSchema>;

interface Report {
  id: string;
  name: string;
  description?: string;
}

interface CreateScheduledReportDialogProps {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportCreated: () => void;
}

export function CreateScheduledReportDialog({
  organizationId,
  open,
  onOpenChange,
  onReportCreated,
}: CreateScheduledReportDialogProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const { toast } = useToast();

  const form = useForm<CreateScheduledReportForm>({
    resolver: zodResolver(createScheduledReportSchema),
    defaultValues: {
      name: "",
      description: "",
      reportId: "",
      schedule: {
        frequency: "daily",
        time: "09:00",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      recipients: [],
      format: "pdf",
    },
  });

  useEffect(() => {
    if (open) {
      fetchReports();
    }
  }, [open, organizationId]);

  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      const response = await fetch(`/api/reports?organizationId=${organizationId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
      toast({
        title: "Error",
        message: "Failed to load reports",
        type: "error",
      });
    } finally {
      setReportsLoading(false);
    }
  };

  const onSubmit = async (data: CreateScheduledReportForm) => {
    try {
      setLoading(true);

      const response = await fetch("/api/scheduled-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create scheduled report");
      }

      onReportCreated();
      form.reset();
    } catch (err) {
      console.error("Error creating scheduled report:", err);
      toast({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to create scheduled report",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const addRecipient = () => {
    if (!newRecipient.trim()) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newRecipient)) {
      toast({
        title: "Invalid Email",
        message: "Please enter a valid email address",
        type: "error",
      });
      return;
    }

    const currentRecipients = form.getValues("recipients");
    if (currentRecipients.includes(newRecipient)) {
      toast({
        title: "Duplicate Email",
        message: "This email is already in the recipients list",
        type: "error",
      });
      return;
    }

    form.setValue("recipients", [...currentRecipients, newRecipient]);
    setNewRecipient("");
  };

  const removeRecipient = (email: string) => {
    const currentRecipients = form.getValues("recipients");
    form.setValue("recipients", currentRecipients.filter(r => r !== email));
  };

  const frequency = form.watch("schedule.frequency");
  const recipients = form.watch("recipients");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Scheduled Report</DialogTitle>
          <DialogDescription>
            Set up automated report delivery with custom scheduling and recipients
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Weekly Sales Report" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Automated weekly sales report for stakeholders"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reportId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={reportsLoading ? "Loading reports..." : "Select a report"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reports.map((report) => (
                          <SelectItem key={report.id} value={report.id}>
                            <div>
                              <p className="font-medium">{report.name}</p>
                              {report.description && (
                                <p className="text-xs text-muted-foreground">{report.description}</p>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Schedule Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Schedule Configuration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="schedule.frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="schedule.time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {frequency === "weekly" && (
                <FormField
                  control={form.control}
                  name="schedule.dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Week</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Sunday</SelectItem>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {frequency === "monthly" && (
                <FormField
                  control={form.control}
                  name="schedule.dayOfMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Month</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="31" 
                          placeholder="1-31"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="schedule.timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="America/New_York" />
                    </FormControl>
                    <FormDescription>
                      Current timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Recipients */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Recipients</h3>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRecipient())}
                />
                <Button type="button" onClick={addRecipient} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {recipients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {recipients.map((email) => (
                    <Badge key={email} variant="secondary" className="flex items-center gap-1">
                      {email}
                      <button
                        type="button"
                        onClick={() => removeRecipient(email)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <FormField
                control={form.control}
                name="recipients"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Output Format */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Output Format</h3>
              
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File Format</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Scheduled Report
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}