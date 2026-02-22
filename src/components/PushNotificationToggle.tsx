"use client";

import { useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushNotificationToggle() {
    const { state, loading, subscribe, unsubscribe, checkState } = usePushNotifications();

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

    return (
        <div className="flex items-center gap-2">
            {state === "subscribed" ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={unsubscribe}
                    disabled={loading}
                    className="gap-2"
                >
                    <BellOff className="h-4 w-4" />
                    Desactivar notificaciones
                </Button>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={subscribe}
                    disabled={loading}
                    className="gap-2"
                >
                    <Bell className="h-4 w-4" />
                    Activar notificaciones
                </Button>
            )}
        </div>
    );
}
