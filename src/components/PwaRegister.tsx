"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function PwaRegister() {
    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

        const register = async () => {
            try {
                const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
                reg.addEventListener("updatefound", () => {
                    const newWorker = reg.installing;
                    if (!newWorker) return;
                    newWorker.addEventListener("statechange", () => {
                        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                            toast.info("Hay una nueva versión disponible. Recarga la página.", {
                                action: {
                                    label: "Actualizar",
                                    onClick: () => window.location.reload(),
                                },
                            });
                        }
                    });
                });
            } catch {
                // SW no disponible (ej. en dev sin build)
            }
        };

        if (process.env.NODE_ENV === "production") {
            register();
        } else {
            // En dev, intentar registrar si existe (tras build previo)
            fetch("/sw.js")
                .then((r) => {
                    if (r.ok) register();
                })
                .catch(() => {});
        }
    }, []);

    return null;
}
