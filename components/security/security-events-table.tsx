"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  Shield,
  Ban,
  Eye,
  MoreHorizontal,
  CheckCircle,
} from "lucide-react";
import {
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
} from "@/lib/types/security";
import { formatDistanceToNow } from "date-fns";

interface SecurityEventsTableProps {
  events: SecurityEvent[];
  onResolveEvent?: (eventId: string) => void;
  onViewDetails?: (event: SecurityEvent) => void;
}

const eventTypeIcons = {
  [SecurityEventType.RATE_LIMIT_EXCEEDED]: Ban,
  [SecurityEventType.BRUTE_FORCE_ATTEMPT]: AlertTriangle,
  [SecurityEventType.SUSPICIOUS_REQUEST]: Eye,
  [SecurityEventType.UNAUTHORIZED_ACCESS]: Shield,
  [SecurityEventType.API_KEY_MISUSE]: Shield,
  [SecurityEventType.CORS_VIOLATION]: AlertTriangle,
  [SecurityEventType.INVALID_REQUEST]: AlertTriangle,
  [SecurityEventType.ACCOUNT_LOCKOUT]: Ban,
};

const severityColors = {
  [SecuritySeverity.LOW]: "bg-green-100 text-green-800 border-green-200",
  [SecuritySeverity.MEDIUM]: "bg-yellow-100 text-yellow-800 border-yellow-200",
  [SecuritySeverity.HIGH]: "bg-orange-100 text-orange-800 border-orange-200",
  [SecuritySeverity.CRITICAL]: "bg-red-100 text-red-800 border-red-200",
};

const eventTypeLabels = {
  [SecurityEventType.RATE_LIMIT_EXCEEDED]: "Rate Limit Exceeded",
  [SecurityEventType.BRUTE_FORCE_ATTEMPT]: "Brute Force Attempt",
  [SecurityEventType.SUSPICIOUS_REQUEST]: "Suspicious Request",
  [SecurityEventType.UNAUTHORIZED_ACCESS]: "Unauthorized Access",
  [SecurityEventType.API_KEY_MISUSE]: "API Key Misuse",
  [SecurityEventType.CORS_VIOLATION]: "CORS Violation",
  [SecurityEventType.INVALID_REQUEST]: "Invalid Request",
  [SecurityEventType.ACCOUNT_LOCKOUT]: "Account Lockout",
};

export function SecurityEventsTable({
  events,
  onResolveEvent,
  onViewDetails,
}: SecurityEventsTableProps) {
  const [resolvingEvents, setResolvingEvents] = useState<Set<string>>(
    new Set(),
  );

  const handleResolveEvent = async (eventId: string) => {
    if (!onResolveEvent) return;

    setResolvingEvents((prev) => new Set(prev).add(eventId));
    try {
      await onResolveEvent(eventId);
    } finally {
      setResolvingEvents((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No security events found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Endpoint</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => {
            const IconComponent = eventTypeIcons[event.type];
            const isResolving = resolvingEvents.has(event.id);

            return (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {eventTypeLabels[event.type]}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={severityColors[event.severity]}
                  >
                    {event.severity}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {event.ipAddress}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {event.endpoint}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                </TableCell>
                <TableCell>
                  {event.resolved ? (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800 border-green-200"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Resolved
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-800 border-yellow-200"
                    >
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onViewDetails && (
                        <DropdownMenuItem onClick={() => onViewDetails(event)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      )}
                      {!event.resolved && onResolveEvent && (
                        <DropdownMenuItem
                          onClick={() => handleResolveEvent(event.id)}
                          disabled={isResolving}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isResolving ? "Resolving..." : "Mark Resolved"}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
