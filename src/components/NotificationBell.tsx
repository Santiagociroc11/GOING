"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchWithToast, mutateWithToast } from "@/lib/toast";

type Notification = {
    _id: string;
    title: string;
    body?: string;
    url?: string;
    read: boolean;
    createdAt: string;
};

export function NotificationBell() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    const fetchNotifications = async () => {
        const { data } = await fetchWithToast<{ notifications: Notification[]; unreadCount: number }>("/api/notifications");
        if (data) {
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markRead = async (id: string, url?: string) => {
        await mutateWithToast(`/api/notifications/${id}/read`, { method: "POST" });
        setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
        setUnreadCount((c) => Math.max(0, c - 1));
        setOpen(false);
        if (url) router.push(url);
    };

    const markAllRead = async () => {
        await mutateWithToast("/api/notifications/read-all", { method: "POST" });
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold bg-orange-500 text-white rounded-full">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
                <div className="px-3 py-2 border-b flex justify-between items-center">
                    <span className="font-semibold">Notificaciones</span>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs">
                            Marcar todas leídas
                        </Button>
                    )}
                </div>
                {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">No hay notificaciones</div>
                ) : (
                    notifications.map((n) => (
                        <DropdownMenuItem
                            key={n._id}
                            onClick={() => markRead(n._id, n.url)}
                            className={`cursor-pointer py-3 ${!n.read ? "bg-orange-50/50" : ""}`}
                        >
                            <div className="flex flex-col gap-0.5 w-full">
                                <span className={`font-medium ${!n.read ? "text-gray-900" : "text-gray-700"}`}>{n.title}</span>
                                {n.body && <span className="text-xs text-gray-500 line-clamp-2">{n.body}</span>}
                                <span className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
                            </div>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
