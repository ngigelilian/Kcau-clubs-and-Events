import { useEffect, useState } from 'react';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    data: Record<string, any>;
    created_at: string;
}

interface NotificationBellProps {
    pollInterval?: number; // in milliseconds, default 30000ms
}

export default function NotificationBell({ pollInterval = 30000 }: NotificationBellProps) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications/unread', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.unread_count);
                setNotifications(data.notifications);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    // Fetch notifications on mount and set up polling
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, pollInterval);
        return () => clearInterval(interval);
    }, [pollInterval]);

    const markAsRead = async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                fetchNotifications();
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications/read-all', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                fetchNotifications();
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const deleteNotification = async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                fetchNotifications();
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const clearAll = async () => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                fetchNotifications();
            }
        } catch (error) {
            console.error('Failed to clear notifications:', error);
        }
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-background border border-border rounded-lg shadow-lg z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="font-semibold">Notifications</h3>
                        <div className="flex gap-2">
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={markAllAsRead}
                                    title="Mark all as read"
                                >
                                    <CheckCheck className="h-4 w-4" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <ScrollArea className="h-96">
                        {notifications.length > 0 ? (
                            <div className="divide-y">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className="p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm">{notif.title}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {notif.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(notif.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => markAsRead(notif.id)}
                                                    className="p-1 hover:bg-muted rounded"
                                                    title="Mark as read"
                                                >
                                                    <Check className="h-4 w-4 text-muted-foreground" />
                                                </button>
                                                <button
                                                    onClick={() => deleteNotification(notif.id)}
                                                    className="p-1 hover:bg-muted rounded"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
                                <p>No notifications yet</p>
                            </div>
                        )}
                    </ScrollArea>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t flex justify-between">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAll}
                                className="text-xs"
                            >
                                Clear All
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
