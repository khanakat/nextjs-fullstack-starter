"use client";

import { useState } from "react";
import { Bell, Check, Trash2, Settings, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  useNotifications,
  useRealtimeNotifications,
} from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import type { Notification } from "@/lib/notifications";

const typeColors = {
  info: "bg-blue-100 text-blue-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
  system: "bg-gray-100 text-gray-800",
};

const priorityIcons = {
  low: "text-gray-500",
  medium: "text-blue-500",
  high: "text-orange-500",
  urgent: "text-red-500 animate-pulse",
};

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: NotificationItemProps) {
  return (
    <div
      className={`p-3 border-l-2 ${notification.read ? "border-gray-200 opacity-75" : "border-blue-500"} hover:bg-gray-50 transition-colors`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4
              className={`text-sm font-medium ${notification.read ? "text-gray-600" : "text-gray-900"}`}
            >
              {notification.title}
            </h4>
            <Badge className={`text-xs ${typeColors[notification.type]}`}>
              {notification.type}
            </Badge>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
          <p
            className={`text-sm ${notification.read ? "text-gray-500" : "text-gray-700"} mb-2`}
          >
            {notification.message}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </span>
            <span
              className={`priority-${notification.priority} ${priorityIcons[notification.priority]}`}
            >
              {notification.priority} priority
            </span>
          </div>
          {notification.actionUrl && (
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto mt-2 text-blue-600"
              onClick={() => (window.location.href = notification.actionUrl!)}
            >
              {notification.actionLabel || "View"}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!notification.read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkRead(notification.id)}
              title="Mark as read"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(notification.id)}
            title="Delete"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const { connected } = useRealtimeNotifications();

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] text-xs bg-red-500 text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          {/* Connection status indicator */}
          <div className="absolute -bottom-1 -right-1">
            {connected ? (
              <Wifi className="h-3 w-3 text-green-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-500" />
            )}
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {connected ? "Live" : "Offline"}
                </Badge>
                <Button variant="ghost" size="sm" title="Settings">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {unreadCount} unread notification
                  {unreadCount !== 1 ? "s" : ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Mark all as read
                </Button>
              </div>
            )}
          </CardHeader>

          <Separator />

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  You'll see notifications here when they arrive
                </p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={handleMarkAsRead}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>

          {notifications.length > 0 && (
            <>
              <Separator />
              <div className="p-3 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Button>
              </div>
            </>
          )}
        </Card>
      </PopoverContent>
    </Popover>
  );
}
