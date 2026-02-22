import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const role = (session.user as any).role;

    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight">
                Bienvenido de nuevo, <span className="text-orange-600">{session.user?.name}</span>
            </h1>
            <p className="text-lg text-gray-500">
                Esto es lo que está pasando en tu cuenta de {role === "ADMIN" ? "administrador" : role === "BUSINESS" ? "negocio" : "conductor"} hoy.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mt-8">
                {role === "ADMIN" && (
                    <>
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle>Gestión de Usuarios</CardTitle>
                                <CardDescription>Visualiza y crea usuarios (negocios, conductores, admins).</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/dashboard/admin/users">
                                    <Button className="w-full bg-orange-600 hover:bg-orange-700">Gestionar Usuarios</Button>
                                </Link>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle>Gestión de Tarifas</CardTitle>
                                <CardDescription>Configura precios base y límites por km por ciudad.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/dashboard/admin/rates">
                                    <Button variant="outline" className="w-full">Gestionar Tarifas</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </>
                )}

                {role === "BUSINESS" && (
                    <>
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle>Nuevo Envío</CardTitle>
                                <CardDescription>Crea una nueva solicitud de pedido y encuentra un conductor.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/dashboard/business/orders/new">
                                    <Button className="w-full bg-orange-600 hover:bg-orange-700">Crear Pedido</Button>
                                </Link>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle>Historial de Pedidos</CardTitle>
                                <CardDescription>Rastrea entregas activas y pasadas.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/dashboard/business/orders">
                                    <Button variant="outline" className="w-full">Ver Pedidos</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </>
                )}

                {role === "DRIVER" && (
                    <>
                        <Card className="hover:shadow-lg transition-shadow shadow-orange-100 border-orange-200">
                            <CardHeader>
                                <CardTitle>Buscar Entregas</CardTitle>
                                <CardDescription>Mira el feed de pedidos en vivo en tu ciudad.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/dashboard/driver/feed">
                                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">Abrir Feed en Vivo</Button>
                                </Link>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle>Mis Entregas</CardTitle>
                                <CardDescription>Gestiona tus pedidos aceptados y completados.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/dashboard/driver/orders">
                                    <Button variant="outline" className="w-full">Mi Historial</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}
