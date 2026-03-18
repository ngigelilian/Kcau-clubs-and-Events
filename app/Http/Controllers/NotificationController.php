<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    /**
     * Get unread notifications for the authenticated user.
     */
    public function unread(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->whereNull('read_at')
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (DatabaseNotification $n) => [
                'id' => $n->id,
                'type' => $n->data['type'] ?? 'general',
                'title' => $n->data['title'] ?? 'Notification',
                'message' => $n->data['message'] ?? '',
                'data' => $n->data,
                'created_at' => $n->created_at->toIso8601String(),
            ]);

        return response()->json([
            'unread_count' => $request->user()->unreadNotifications()->count(),
            'notifications' => $notifications,
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request, string $notificationId): JsonResponse
    {
        $notification = DatabaseNotification::findOrFail($notificationId);

        if ($notification->notifiable_id !== $request->user()->id) {
            abort(403);
        }

        $notification->markAsRead();

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    /**
     * Delete a notification.
     */
    public function delete(Request $request, string $notificationId): JsonResponse
    {
        $notification = DatabaseNotification::findOrFail($notificationId);

        if ($notification->notifiable_id !== $request->user()->id) {
            abort(403);
        }

        $notification->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Clear all notifications.
     */
    public function clearAll(Request $request): JsonResponse
    {
        $request->user()->notifications()->delete();

        return response()->json(['success' => true]);
    }
}
