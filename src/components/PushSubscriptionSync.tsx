"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

function toBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Sincroniza la suscripción push con el servidor al cargar la app.
 * Evita "suscripciones fantasma" cuando el navegador rota las llaves.
 * Patrón Refresh & Sync recomendado para PWAs (2026).
 */
export function PushSubscriptionSync() {
    const { status } = useSession();
    const syncedRef = useRef(false);

    useEffect(() => {
        if (status !== "authenticated" || syncedRef.current) return;
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

        let cancelled = false;

        (async () => {
            try {
                const reg = await navigator.serviceWorker.ready;
                const sub = await reg.pushManager.getSubscription();
                if (!sub || cancelled) return;

                const p256dh = toBase64Url(sub.getKey("p256dh")!);
                const auth = toBase64Url(sub.getKey("auth")!);
                const payload = {
                    endpoint: sub.endpoint,
                    keys: { p256dh, auth },
                };

                const res = await fetch("/api/push/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (res.ok) syncedRef.current = true;
            } catch {
                // Silencioso: no molestar al usuario
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [status]);

    return null;
}
