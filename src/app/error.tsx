"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="p-4 bg-red-50 rounded-full w-fit mx-auto">
                    <AlertTriangle className="h-12 w-12 text-red-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Algo salió mal</h2>
                    <p className="text-gray-500 mt-2">Ha ocurrido un error inesperado. Intenta de nuevo.</p>
                </div>
                <Button onClick={reset} className="bg-orange-600 hover:bg-orange-700">
                    Intentar de nuevo
                </Button>
            </div>
        </div>
    );
}
