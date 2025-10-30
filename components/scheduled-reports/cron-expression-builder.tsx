"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Calendar, Info } from "lucide-react";

interface CronExpressionBuilderProps {
  value?: string;
  onChange: (cronExpression: string) => void;
  className?: string;
}

interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

const PRESET_SCHEDULES = [
  { label: "Every minute", value: "* * * * *", description: "Runs every minute" },
  { label: "Every 5 minutes", value: "*/5 * * * *", description: "Runs every 5 minutes" },
  { label: "Every 15 minutes", value: "*/15 * * * *", description: "Runs every 15 minutes" },
  { label: "Every 30 minutes", value: "*/30 * * * *", description: "Runs every 30 minutes" },
  { label: "Every hour", value: "0 * * * *", description: "Runs at the start of every hour" },
  { label: "Every 6 hours", value: "0 */6 * * *", description: "Runs every 6 hours" },
  { label: "Every 12 hours", value: "0 */12 * * *", description: "Runs every 12 hours" },
  { label: "Daily at 9 AM", value: "0 9 * * *", description: "Runs daily at 9:00 AM" },
  { label: "Daily at 6 PM", value: "0 18 * * *", description: "Runs daily at 6:00 PM" },
  { label: "Weekly on Monday at 9 AM", value: "0 9 * * 1", description: "Runs every Monday at 9:00 AM" },
  { label: "Weekly on Friday at 5 PM", value: "0 17 * * 5", description: "Runs every Friday at 5:00 PM" },
  { label: "Monthly on 1st at 9 AM", value: "0 9 1 * *", description: "Runs on the 1st of every month at 9:00 AM" },
  { label: "Monthly on 15th at 2 PM", value: "0 14 15 * *", description: "Runs on the 15th of every month at 2:00 PM" },
];

const WEEKDAYS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export function CronExpressionBuilder({ value = "0 9 * * *", onChange, className }: CronExpressionBuilderProps) {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [cronParts, setCronParts] = useState<CronParts>({
    minute: "0",
    hour: "9",
    dayOfMonth: "*",
    month: "*",
    dayOfWeek: "*",
  });
  const [customExpression, setCustomExpression] = useState(value);

  useEffect(() => {
    parseCronExpression(value);
  }, [value]);

  const parseCronExpression = (expression: string) => {
    const parts = expression.split(" ");
    if (parts.length === 5) {
      setCronParts({
        minute: parts[0],
        hour: parts[1],
        dayOfMonth: parts[2],
        month: parts[3],
        dayOfWeek: parts[4],
      });
      setCustomExpression(expression);
    }
  };

  const buildCronExpression = (parts: CronParts): string => {
    return `${parts.minute} ${parts.hour} ${parts.dayOfMonth} ${parts.month} ${parts.dayOfWeek}`;
  };

  const updateCronPart = (field: keyof CronParts, value: string) => {
    const newParts = { ...cronParts, [field]: value };
    setCronParts(newParts);
    const newExpression = buildCronExpression(newParts);
    setCustomExpression(newExpression);
    onChange(newExpression);
  };

  const handlePresetSelect = (preset: string) => {
    setCustomExpression(preset);
    parseCronExpression(preset);
    onChange(preset);
  };

  const handleCustomExpressionChange = (expression: string) => {
    setCustomExpression(expression);
    parseCronExpression(expression);
    onChange(expression);
  };

  const getNextExecutionTimes = (cronExpression: string): string[] => {
    // This is a simplified version - in a real implementation, you'd use a cron parser library
    try {
      const parts = cronExpression.split(" ");
      if (parts.length !== 5) return ["Invalid cron expression"];
      
      // For demo purposes, return some example times
      const now = new Date();
      const times = [];
      for (let i = 0; i < 3; i++) {
        const nextTime = new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
        times.push(nextTime.toLocaleString());
      }
      return times;
    } catch {
      return ["Invalid cron expression"];
    }
  };

  const nextExecutions = getNextExecutionTimes(customExpression);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Cron Expression Builder
        </CardTitle>
        <CardDescription>
          Configure when your scheduled report should run using cron expressions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode Selection */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "preset" ? "default" : "outline"}
            onClick={() => setMode("preset")}
            size="sm"
          >
            Presets
          </Button>
          <Button
            type="button"
            variant={mode === "custom" ? "default" : "outline"}
            onClick={() => setMode("custom")}
            size="sm"
          >
            Custom
          </Button>
        </div>

        {mode === "preset" && (
          <div className="space-y-3">
            <Label>Choose a preset schedule:</Label>
            <div className="grid gap-2">
              {PRESET_SCHEDULES.map((preset) => (
                <div
                  key={preset.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                    customExpression === preset.value ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => handlePresetSelect(preset.value)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{preset.label}</p>
                      <p className="text-sm text-muted-foreground">{preset.description}</p>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {preset.value}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === "custom" && (
          <div className="space-y-4">
            {/* Direct Expression Input */}
            <div className="space-y-2">
              <Label>Cron Expression</Label>
              <Input
                value={customExpression}
                onChange={(e) => handleCustomExpressionChange(e.target.value)}
                placeholder="0 9 * * *"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Format: minute hour day-of-month month day-of-week
              </p>
            </div>

            <Separator />

            {/* Visual Builder */}
            <div className="space-y-4">
              <Label>Visual Builder</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Minute (0-59)</Label>
                  <Input
                    value={cronParts.minute}
                    onChange={(e) => updateCronPart("minute", e.target.value)}
                    placeholder="0 or */5 or 0,15,30,45"
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Hour (0-23)</Label>
                  <Input
                    value={cronParts.hour}
                    onChange={(e) => updateCronPart("hour", e.target.value)}
                    placeholder="9 or */6 or 9,17"
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Day of Month (1-31)</Label>
                  <Input
                    value={cronParts.dayOfMonth}
                    onChange={(e) => updateCronPart("dayOfMonth", e.target.value)}
                    placeholder="* or 1 or 1,15"
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Month (1-12)</Label>
                  <Select
                    value={cronParts.month}
                    onValueChange={(value) => updateCronPart("month", value)}
                  >
                    <SelectTrigger className="font-mono text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*">Every month (*)</SelectItem>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label} ({month.value})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="text-sm">Day of Week (0-6, 0=Sunday)</Label>
                  <Select
                    value={cronParts.dayOfWeek}
                    onValueChange={(value) => updateCronPart("dayOfWeek", value)}
                  >
                    <SelectTrigger className="font-mono text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*">Every day (*)</SelectItem>
                      {WEEKDAYS.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label} ({day.value})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Current Expression & Next Executions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Current Expression</Label>
          </div>
          <Badge variant="outline" className="font-mono">
            {customExpression}
          </Badge>
          
          <div className="space-y-2">
            <Label className="text-sm">Next 3 executions (approximate):</Label>
            <div className="space-y-1">
              {nextExecutions.map((time, index) => (
                <p key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {time}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Cron Expression Format:</strong> minute hour day-of-month month day-of-week
            <br />
            <strong>Special characters:</strong> * (any), ? (any), - (range), , (list), / (step), L (last), W (weekday)
            <br />
            <strong>Examples:</strong> "0 9 * * *" (daily at 9 AM), "0 9 * * 1" (Mondays at 9 AM), "*/15 * * * *" (every 15 minutes)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}