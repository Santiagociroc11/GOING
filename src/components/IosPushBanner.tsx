"use client";

import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";

export function IosPushBanner() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        const isStandalone = (navigator as any).standalone === true || window.matchMedia("(display-mode: standalone)").matches;
        if (isIos && !isStandalone) {
            setShow(true);
        }
    }, []);

    if (!show) return null;

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                    <Smartphone className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                    <p className="font-semibold text-amber-900">iPhone / iPad: Notificaciones</p>
                    <p className="text-sm text-amber-800 mt-1">
                        Para recibir notificaciones en tu iPhone o iPad, debes <strong>agregar Going a la pantalla de inicio</strong> y abrir la app desde el icono (no desde Safari).
                    </p>
                    <p className="text-xs text-amber-700 mt-2">
                        Comparte la página → &quot;Añadir a la pantalla de inicio&quot; → Abre la app desde el icono.
                    </p>
                </div>
            </div>
        </div>
    );
}
