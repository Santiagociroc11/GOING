import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, Home, LogIn } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
            <div className="text-center space-y-6 max-w-md">
                <div className="flex justify-center">
                    <div className="p-4 bg-orange-100 rounded-full">
                        <Package className="h-16 w-16 text-orange-600" />
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Página no encontrada</h1>
                    <p className="text-gray-500 mt-2">
                        La ruta que buscas no existe o ha sido movida.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/">
                        <Button className="w-full sm:w-auto gap-2 bg-orange-600 hover:bg-orange-700">
                            <Home className="h-4 w-4" />
                            Ir al inicio
                        </Button>
                    </Link>
                    <Link href="/login">
                        <Button variant="outline" className="w-full sm:w-auto gap-2">
                            <LogIn className="h-4 w-4" />
                            Iniciar sesión
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
