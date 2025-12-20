
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  CalendarClock, 
  GraduationCap, 
  MailWarning, 
  MessageSquare, 
  Users, 
  AlertCircle,
  CheckCircle,
  Trash2,
  MoreHorizontal,
  Loader2
} from "lucide-react";
import { useNotifications, Notification } from "@/hooks/use-notifications";
import { auth } from "@/lib/firebase/client-simple";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getNotificationIcon = (type: Notification['type'], priority: Notification['priority']) => {
  const iconClass = `h-5 w-5 ${
    priority === 'high' ? 'text-red-500' : 
    priority === 'medium' ? 'text-blue-500' : 
    'text-gray-500'
  }`;

  switch (type) {
    case 'assignment':
      return <GraduationCap className={iconClass} />;
    case 'exam':
      return <CalendarClock className={iconClass} />;
    case 'message':
      return <MessageSquare className={iconClass} />;
    case 'reminder':
      return <Bell className={iconClass} />;
    case 'study_group':
      return <Users className={iconClass} />;
    case 'system':
      return <AlertCircle className={iconClass} />;
    default:
      return <Bell className={iconClass} />;
  }
};

export default function Notifications() {
  const [user, setUser] = useState(auth.currentUser);
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications(user);
  
  // Limit displayed notifications to 5 most recent
  const MAX_VISIBLE_NOTIFICATIONS = 5;
  const visibleNotifications = notifications.slice(0, MAX_VISIBLE_NOTIFICATIONS);
  const remainingCount = Math.max(0, notifications.length - MAX_VISIBLE_NOTIFICATIONS);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
    toast.success("Notification marked as read", {
      description: "The notification has been marked as read.",
    });
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    toast.success("All notifications marked as read", {
      description: "All notifications have been marked as read.",
    });
  };

  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotification(notificationId);
    toast.success("Notification deleted", {
      description: "The notification has been deleted.",
    });
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
    toast.success("All notifications cleared", {
      description: "All notifications have been cleared.",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell /> Notifications
            <Badge variant="secondary" className="ml-auto">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Loading...
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark All Read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </>
            )}
          </div>
        </div>
        <CardDescription>Stay on top of your academic life.</CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
            <p className="text-sm">You'll see important updates here</p>
          </div>
        ) : (
          <>
            <div className="relative" style={{ minHeight: `${visibleNotifications.length * 80}px` }}>
              {visibleNotifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`absolute left-0 right-0 transition-all duration-300 overflow-hidden ${
                    !notification.isRead 
                      ? 'bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800' 
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  } rounded-lg shadow-md hover:shadow-lg`}
                  style={{
                    top: `${index * 60}px`,
                    zIndex: MAX_VISIBLE_NOTIFICATIONS - index,
                    transform: `scale(${1 - index * 0.05})`,
                    transformOrigin: 'top center',
                  }}
                >
                  {index === 0 ? (
                    <div className="flex items-start gap-4 p-4">
                      <div className="mt-1 h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full bg-muted">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-grow">
                            <p className={`font-semibold text-sm ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {notification.createdAt ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!notification.isRead && (
                                <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Read
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDeleteNotification(notification.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 flex items-center px-4 gap-3">
                      <div className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-full bg-muted">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-xs text-muted-foreground truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground/60 truncate mt-0.5">
                          {notification.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {remainingCount > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <Link href="/dashboard/notifications">
                  <Button variant="ghost" className="w-full justify-center text-sm text-muted-foreground hover:text-foreground">
                    <Bell className="h-4 w-4 mr-2" />
                    +{remainingCount} more notification{remainingCount !== 1 ? 's' : ''}
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
