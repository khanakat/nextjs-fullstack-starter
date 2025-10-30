import * as cron from "node-cron";
import * as cronParser from "cron-parser";
import { logger } from "@/lib/logger";

// ============================================================================
// CRON UTILITIES
// ============================================================================

export interface CronScheduleInfo {
  expression: string;
  description: string;
  nextRun: Date;
  isValid: boolean;
  timezone?: string;
}

export interface CronPreset {
  name: string;
  expression: string;
  description: string;
}

/**
 * Common cron presets for scheduled reports
 */
export const CRON_PRESETS: CronPreset[] = [
  {
    name: "hourly",
    expression: "0 * * * *",
    description: "Every hour at minute 0"
  },
  {
    name: "daily",
    expression: "0 9 * * *",
    description: "Every day at 9:00 AM"
  },
  {
    name: "weekly",
    expression: "0 9 * * 1",
    description: "Every Monday at 9:00 AM"
  },
  {
    name: "monthly",
    expression: "0 9 1 * *",
    description: "First day of every month at 9:00 AM"
  },
  {
    name: "quarterly",
    expression: "0 9 1 1,4,7,10 *",
    description: "First day of every quarter at 9:00 AM"
  },
  {
    name: "yearly",
    expression: "0 9 1 1 *",
    description: "January 1st at 9:00 AM"
  }
];

/**
 * Validate a cron expression
 */
export function validateCronExpression(expression: string): boolean {
  try {
    return cron.validate(expression);
  } catch (error) {
    logger.warn('Invalid cron expression', 'cron-utils', { expression, error });
    return false;
  }
}

/**
 * Calculate the next run time for a cron expression
 */
export function calculateNextRun(
  cronExpression: string, 
  timezone: string = 'UTC'
): Date {
  try {
    const interval = cronParser.parseExpression(cronExpression, {
      tz: timezone,
      currentDate: new Date()
    });
    
    return interval.next().toDate();
  } catch (error) {
    logger.error('Failed to calculate next run time', 'cron-utils', { 
      cronExpression, 
      timezone, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    // Return a default next run time (24 hours from now)
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
}

/**
 * Get detailed information about a cron schedule
 */
export function getCronScheduleInfo(
  expression: string, 
  timezone: string = 'UTC'
): CronScheduleInfo {
  const isValid = validateCronExpression(expression);
  
  return {
    expression,
    description: describeCronExpression(expression),
    nextRun: isValid ? calculateNextRun(expression, timezone) : new Date(),
    isValid,
    timezone
  };
}

/**
 * Convert a cron expression to a human-readable description
 */
export function describeCronExpression(expression: string): string {
  if (!validateCronExpression(expression)) {
    return "Invalid cron expression";
  }

  // Check if it matches any preset
  const preset = CRON_PRESETS.find(p => p.expression === expression);
  if (preset) {
    return preset.description;
  }

  // Parse the cron expression parts
  const parts = expression.split(' ');
  if (parts.length !== 5) {
    return "Custom schedule";
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Build description based on parts
  let description = "Custom: ";
  
  // Minute
  if (minute === '*') {
    description += "every minute";
  } else if (minute.includes('/')) {
    const interval = minute.split('/')[1];
    description += `every ${interval} minutes`;
  } else {
    description += `at minute ${minute}`;
  }

  // Hour
  if (hour !== '*') {
    if (hour.includes('/')) {
      const interval = hour.split('/')[1];
      description += `, every ${interval} hours`;
    } else {
      description += `, at ${hour}:00`;
    }
  }

  // Day of month
  if (dayOfMonth !== '*') {
    description += `, on day ${dayOfMonth}`;
  }

  // Month
  if (month !== '*') {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    if (month.includes(',')) {
      const months = month.split(',').map(m => monthNames[parseInt(m) - 1]).join(', ');
      description += `, in ${months}`;
    } else {
      description += `, in ${monthNames[parseInt(month) - 1]}`;
    }
  }

  // Day of week
  if (dayOfWeek !== '*') {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (dayOfWeek.includes(',')) {
      const days = dayOfWeek.split(',').map(d => dayNames[parseInt(d)]).join(', ');
      description += `, on ${days}`;
    } else {
      description += `, on ${dayNames[parseInt(dayOfWeek)]}`;
    }
  }

  return description;
}

/**
 * Get the next N execution times for a cron expression
 */
export function getNextExecutions(
  cronExpression: string,
  count: number = 5,
  timezone: string = 'UTC'
): Date[] {
  if (!validateCronExpression(cronExpression)) {
    return [];
  }

  const executions: Date[] = [];
  
  try {
    const interval = cronParser.parseExpression(cronExpression, {
      tz: timezone,
      currentDate: new Date()
    });
    
    for (let i = 0; i < count; i++) {
      const nextDate = interval.next();
      executions.push(nextDate.toDate());
    }
  } catch (error) {
    logger.error('Failed to get next executions', 'cron-utils', { 
      cronExpression, 
      count, 
      timezone, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }

  return executions;
}

/**
 * Check if a cron expression will run within a specific time range
 */
export function willRunInRange(
  cronExpression: string,
  startDate: Date,
  endDate: Date,
  timezone: string = 'UTC'
): boolean {
  if (!validateCronExpression(cronExpression)) {
    return false;
  }

  try {
    const interval = cronParser.parseExpression(cronExpression, {
      tz: timezone,
      currentDate: startDate
    });

    const nextDate = interval.next().toDate();
    return nextDate >= startDate && nextDate <= endDate;
  } catch (error) {
    logger.error('Failed to check if cron will run in range', 'cron-utils', { 
      cronExpression, 
      startDate, 
      endDate, 
      timezone, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return false;
  }
}

/**
 * Convert frequency and time to cron expression
 */
export function createCronExpression(options: {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time?: string; // HH:MM format
  dayOfWeek?: number; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
}): string {
  const { frequency, time = '09:00', dayOfWeek = 1, dayOfMonth = 1 } = options;
  
  const [hour, minute] = time.split(':').map(Number);

  switch (frequency) {
    case 'hourly':
      return `${minute} * * * *`;
    case 'daily':
      return `${minute} ${hour} * * *`;
    case 'weekly':
      return `${minute} ${hour} * * ${dayOfWeek}`;
    case 'monthly':
      return `${minute} ${hour} ${dayOfMonth} * *`;
    default:
      throw new Error(`Unsupported frequency: ${frequency}`);
  }
}

/**
 * Parse a cron expression into its components
 */
export function parseCronExpression(expression: string): {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
} | null {
  if (!validateCronExpression(expression)) {
    return null;
  }

  const parts = expression.split(' ');
  if (parts.length !== 5) {
    return null;
  }

  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4]
  };
}