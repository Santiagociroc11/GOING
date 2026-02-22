"use client";

import { useEffect, useState } from "react";
import { toast, fetchWithToast, mutateWithToast } from "@/lib/toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Package, DollarSign, Clock } from "lucide-react";

type Order = {
    _id: string;
    city: string;
    price: number;
    status: string;
    details: string;
    pickupInfo: { address: string };
    dropoffInfo: { address: string };
    createdAt: string;
};

export default function DriverFeedPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [actingOn, setActingOn] = useState<string | null>(null);

    const fetchFeed = async () => {
        setLoading(true);
        const { data, error } = await fetchWithToast<Order[]>("/api/feed");
        if (!error && data) setOrders(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchFeed();
        const interval = setInterval(fetchFeed, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleAccept = async (orderId: string) => {
        setActingOn(orderId);
        const { ok } = await mutateWithToast(`/api/orders/${orderId}/status`, {
            method: "PUT",
            body: { status: "ACCEPTED" },
        });
        setActingOn(null);
        if (ok) {
            toast.success("¡Entrega Aceptada! Redirigiendo a tu entrega...");
            setOrders((prev) => prev.filter((o) => o._id !== orderId));
            window.location.href = "/dashboard/driver/orders";
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight">Feed de Entregas en Vivo</h2>
                    <p className="text-gray-500">Pedidos disponibles en tu ciudad esperando un domiciliario.</p>
                </div>
                <Button variant="outline" onClick={fetchFeed} disabled={loading} className="hover:text-orange-600 border-orange-200">
                    {loading ? "Actualizando..." : "Actualizar Feed"}
                </Button>
            </div>

            <div className="grid gap-6">
                {orders.length === 0 && !loading && (
                    <div className="text-center py-20 bg-orange-50/50 border rounded-2xl border-dashed border-orange-200">
                        <Package className="h-12 w-12 text-orange-200 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No hay solicitudes activas en este momento.</h3>
                        <p className="text-gray-500 mb-4">Espera un poco, nuevos pedidos aparecerán aquí automáticamente.</p>
                    </div>
                )}

                {orders.map((order) => (
                    <Card key={order._id} className="shadow-lg border-2 border-transparent hover:border-orange-100 transition-all">
                        <CardHeader className="bg-gray-50/50 pb-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full uppercase">
                                        Nuevo Pedido
                                    </span>
                                    <CardTitle className="mt-2 text-xl font-bold flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-green-600" />
                                        {order.price.toFixed(2)}
                                    </CardTitle>
                                </div>
                                <div className="text-right text-sm text-gray-500 flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase">Recogida</p>
                                    <p className="font-medium text-gray-900">{order.pickupInfo.address}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Navigation className="h-5 w-5 text-orange-500 mt-0.5" />
                                <div>
                                    <p className="text-xs text-orange-500 font-semibold uppercase">Entrega</p>
                                    <p className="font-medium text-gray-900">{order.dropoffInfo.address}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600 mt-2">
                                <span className="font-semibold text-gray-900">Detalles: </span>{order.details}
                            </div>
                        </CardContent>
                        <CardFooter className="pt-4 border-t">
                            <Button
                                onClick={() => handleAccept(order._id)}
                                disabled={actingOn === order._id}
                                className="w-full h-12 text-lg bg-orange-600 hover:bg-orange-700 shadow-md transition-transform hover:-translate-y-0.5"
                            >
                                {actingOn === order._id ? "Aceptando..." : "Aceptar Entrega"}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
