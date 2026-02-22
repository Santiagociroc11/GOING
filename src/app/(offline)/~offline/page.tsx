"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
            <WifiOff className="h-16 w-16 text-gray-400 mb-4" />
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Sin conexión</h1>
            <p className="text-gray-500 text-center mb-6">
                No hay conexión a internet. Revisa tu red e intenta de nuevo.
            </p>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
    );
}
