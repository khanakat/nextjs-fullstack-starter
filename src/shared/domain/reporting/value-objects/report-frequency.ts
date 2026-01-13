/**
 * Report Frequency Type
 * 
 * This is a type alias for ScheduleFrequency to unify the two naming conventions
 * used in the project. The ScheduleFrequency enum is the canonical type.
 */

import { ScheduleFrequency } from '../entities/scheduled-report';

// Export ReportFrequency as an alias for ScheduleFrequency
// This allows backward compatibility while using the canonical type
export type ReportFrequency = ScheduleFrequency;
