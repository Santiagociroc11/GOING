"use client";

import { useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushNotificationToggle() {
    const { state, loading, subscribe, checkState } = usePushNotifications();

    useEffect(() => {
        checkState();
    }, [checkState]);

    if (state === "unsupported") return null;

    if (state === "denied") {
        return (
            <p className="text-sm text-amber-600">
                Notificaciones bloqueadas. Actívalas en la configuración del navegador.
            </p>
        );
    }

    if (state === "subscribed") {
        return (
            <span className="inline-flex items-center gap-2 text-sm text-green-600">
                <Bell className="h-4 w-4" />
                Notificaciones activas
            </span>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={subscribe}
            disabled={loading}
            className="gap-2"
        >
            <Bell className="h-4 w-4" />
            {loading ? "Activando..." : "Activar notificaciones"}
        </Button>
    );
}
