import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, Truck, Shield, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Envíos B2B rápidos y <span className="text-orange-600">confiables</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Conectamos negocios con una red de conductores profesionales para entregas urbanas inmediatas.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/register">
                  <Button className="bg-orange-600 hover:bg-orange-700 h-11 px-8 text-lg">Empezar Ahora</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="h-11 px-8 text-lg border-orange-200 text-orange-700 hover:bg-orange-50">Iniciar Sesión</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-orange-50/50 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 border-orange-100 p-4 rounded-xl">
                <Truck className="h-12 w-12 text-orange-600 mb-2" />
                <h2 className="text-xl font-bold">Entrega Local</h2>
                <p className="text-sm text-gray-500 text-center">Envíos en tu ciudad en tiempo récord.</p>
              </div>
              <div className="flex flex-col items-center space-y-2 border-orange-100 p-4 rounded-xl">
                <Shield className="h-12 w-12 text-orange-600 mb-2" />
                <h2 className="text-xl font-bold">Seguridad Total</h2>
                <p className="text-sm text-gray-500 text-center">Conductores verificados y rastreo en tiempo real.</p>
              </div>
              <div className="flex flex-col items-center space-y-2 border-orange-100 p-4 rounded-xl">
                <Clock className="h-12 w-12 text-orange-600 mb-2" />
                <h2 className="text-xl font-bold">Sin Esperas</h2>
                <p className="text-sm text-gray-500 text-center">Asignación inmediata de conductores cercanos.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500">© 2024 Going Inc. Todos los derechos reservados.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">Términos de Servicio</Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">Privacidad</Link>
        </nav>
      </footer>
    </div>
  );
}
