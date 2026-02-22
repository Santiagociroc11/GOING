"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

export type PushState = "unsupported" | "prompt" | "subscribed" | "denied" | "error";

export function usePushNotifications() {
    const [state, setState] = useState<PushState>("unsupported");
    const [loading, setLoading] = useState(false);

    const subscribe = useCallback(async () => {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
            setState("unsupported");
            return;
        }

        setLoading(true);
        try {
            const perm = await Notification.requestPermission();
            if (perm === "denied") {
                setState("denied");
                toast.error("Notificaciones bloqueadas");
                return;
            }
            if (perm !== "granted") return;

            const { publicKey } = await fetch("/api/push/vapid-public").then((r) => r.json());
            if (!publicKey) {
                setState("error");
                toast.error("Push no configurado");
                return;
            }

            const reg = await navigator.serviceWorker.ready;
            const keyBytes = urlBase64ToUint8Array(publicKey);
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: new Uint8Array(keyBytes) as BufferSource,
            });

            const payload = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!))),
                    auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")!))),
                },
            };

            const res = await fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                setState("error");
                toast.error("Error al activar notificaciones");
                return;
            }

            setState("subscribed");
            toast.success("Notificaciones activadas");
        } catch (e) {
            setState("error");
            toast.error("Error al activar notificaciones");
        } finally {
            setLoading(false);
        }
    }, []);

    const unsubscribe = useCallback(async () => {
        setLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                await fetch("/api/push/unsubscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ endpoint: sub.endpoint }),
                });
                await sub.unsubscribe();
            }
            setState("prompt");
            toast.success("Notificaciones desactivadas");
        } catch {
            toast.error("Error al desactivar");
        } finally {
            setLoading(false);
        }
    }, []);

    const checkState = useCallback(async () => {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
            setState("unsupported");
            return;
        }
        if (!Notification.permission) {
            setState("prompt");
            return;
        }
        if (Notification.permission === "denied") {
            setState("denied");
            return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setState(sub ? "subscribed" : "prompt");
    }, []);

    return { state, loading, subscribe, unsubscribe, checkState };
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(b64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
}
