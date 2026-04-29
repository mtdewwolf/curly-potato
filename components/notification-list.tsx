"use client";

import { markNotificationRead } from "@/lib/actions/user";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string | null;
};

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  if (!notifications.length) {
    return <p className="text-sm text-muted-foreground">No notifications yet.</p>;
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <form
          key={notification.id}
          action={markNotificationRead}
          className={cn(
            "rounded-2xl border bg-card p-4 shadow-sm",
            !notification.read_at && "border-primary/40 bg-primary/5"
          )}
        >
          <input type="hidden" name="notificationId" value={notification.id} />
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold">{notification.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
            </div>
            {!notification.read_at && (
              <button className="rounded-full border px-3 py-1 text-xs font-medium" type="submit">
                Mark read
              </button>
            )}
          </div>
        </form>
      ))}
    </div>
  );
}
