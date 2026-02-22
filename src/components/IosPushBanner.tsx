"use client";

import { useEffect, useState } from "react";
import { Share2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IosPushBanner() {
    const [show, setShow] = useState(false);
    const [canShare, setCanShare] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        const isStandalone = (navigator as any).standalone === true || window.matchMedia("(display-mode: standalone)").matches;
        if (isIos && !isStandalone) {
            setShow(true);
            setCanShare(typeof navigator.share === "function");
        }
    }, []);

    const handleShare = async () => {
        try {
            await navigator.share({
                title: "Going - B2B Delivery",
                url: window.location.href,
                text: "Abre Going desde la pantalla de inicio para recibir notificaciones.",
            });
        } catch {
            // Usuario canceló o share no disponible
        }
    };

    if (!show) return null;

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                    <Smartphone className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-amber-900">iPhone / iPad: Notificaciones</p>
                    <p className="text-sm text-amber-800 mt-1">
                        Para recibir notificaciones, debes <strong>agregar Going a la pantalla de inicio</strong> y abrir la app desde el icono (no desde Safari).
                    </p>
                    <p className="text-xs text-amber-700 mt-2">
                        Comparte la página → &quot;Añadir a la pantalla de inicio&quot; → Abre la app desde el icono.
                    </p>
                    {canShare && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleShare}
                            className="mt-3 border-amber-300 text-amber-800 hover:bg-amber-100"
                        >
                            <Share2 className="h-4 w-4 mr-2" />
                            Compartir (añadir a inicio)
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
