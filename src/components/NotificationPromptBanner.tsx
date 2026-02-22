"use client";

import { useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function NotificationPromptBanner() {
    const { state, loading, subscribe, checkState } = usePushNotifications();

    useEffect(() => {
        checkState();
    }, [checkState]);

    if (state !== "prompt") return null;

    return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg shrink-0">
                    <Bell className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                    <p className="font-semibold text-orange-900">Activa las notificaciones</p>
                    <p className="text-sm text-orange-700">
                        Recibe avisos de nuevos pedidos y actualizaciones en tiempo real.
                    </p>
                </div>
            </div>
            <Button
                onClick={subscribe}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 shrink-0"
            >
                {loading ? "Activando..." : "Activar notificaciones"}
            </Button>
        </div>
    );
}
