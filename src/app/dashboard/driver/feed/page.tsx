"use client";

import { useEffect, useState, useMemo } from "react";
import { toast, fetchWithToast, mutateWithToast } from "@/lib/toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Package, DollarSign, Clock } from "lucide-react";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { NotificationPromptBanner } from "@/components/NotificationPromptBanner";
import { RoutePreviewMap } from "@/components/RoutePreviewMap";
import { getDistanceMeters } from "@/lib/geo";

type Order = {
    _id: string;
    city: string;
    price: number;
    status: string;
    details: string;
    paymentMethod?: "PREPAID" | "COD";
    productValue?: number;
    pickupInfo: { address: string; coordinates?: { coordinates?: [number, number] } };
    dropoffInfo: { address: string; coordinates?: { coordinates?: [number, number] } };
    createdAt: string;
};

const DEFAULT_COORDS: [number, number] = [-74.006, 40.7128];

function getCoords(order: Order, type: "pickup" | "dropoff"): [number, number] {
    const info = type === "pickup" ? order.pickupInfo : order.dropoffInfo;
    const coords = (info as any)?.coordinates?.coordinates;
    if (Array.isArray(coords) && coords.length >= 2) return [coords[0], coords[1]];
    return DEFAULT_COORDS;
}

export default function DriverFeedPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [actingOn, setActingOn] = useState<string | null>(null);
    const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

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

    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => {},
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
    }, []);

    const sortedOrders = useMemo(() => {
        if (!driverLocation || orders.length === 0) return orders;
        return [...orders].sort((a, b) => {
            const pickupA = getCoords(a, "pickup");
            const pickupB = getCoords(b, "pickup");
            const distA = getDistanceMeters(driverLocation.lat, driverLocation.lng, pickupA[1], pickupA[0]);
            const distB = getDistanceMeters(driverLocation.lat, driverLocation.lng, pickupB[1], pickupB[0]);
            return distA - distB;
        });
    }, [orders, driverLocation]);

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
        <div className="max-w-4xl mx-auto space-y-6 px-1">
            <NotificationPromptBanner />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Feed de Entregas en Vivo</h2>
                    <p className="text-gray-500 text-sm sm:text-base">Pedidos disponibles en tu ciudad esperando un domiciliario.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <PushNotificationToggle />
                    <Button variant="outline" onClick={fetchFeed} disabled={loading} className="hover:text-orange-600 border-orange-200 min-h-[44px] shrink-0">
                        {loading ? "Actualizando..." : "Actualizar Feed"}
                    </Button>
                </div>
            </div>

            {driverLocation && (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    Ordenado por distancia a ti (más cercanos primero)
                </p>
            )}

            <div className="grid gap-6">
                {sortedOrders.length === 0 && !loading && (
                    <div className="text-center py-20 bg-orange-50/50 border rounded-2xl border-dashed border-orange-200">
                        <Package className="h-12 w-12 text-orange-200 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No hay solicitudes activas en este momento.</h3>
                        <p className="text-gray-500 mb-4">Espera un poco, nuevos pedidos aparecerán aquí automáticamente.</p>
                    </div>
                )}

                {sortedOrders.map((order) => {
                    const pickupCoords = getCoords(order, "pickup");
                    const dropoffCoords = getCoords(order, "dropoff");
                    const distanceKm = driverLocation
                        ? (getDistanceMeters(driverLocation.lat, driverLocation.lng, pickupCoords[1], pickupCoords[0]) / 1000).toFixed(1)
                        : null;
                    return (
                    <Card key={order._id} className="shadow-lg border-2 border-transparent hover:border-orange-100 transition-all">
                        <CardHeader className="bg-gray-50/50 pb-4">
                            <div className="flex justify-between items-start flex-wrap gap-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full uppercase">
                                            Nuevo Pedido
                                        </span>
                                        {distanceKm != null && (
                                            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> ~{distanceKm} km
                                            </span>
                                        )}
                                    </div>
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
                            {order.paymentMethod === "COD" && order.productValue != null && (
                                <div className="bg-amber-50 p-3 rounded-md text-sm text-amber-800 border border-amber-200">
                                    <span className="font-semibold">Recaudo contraentrega:</span> Cobra ${order.productValue.toLocaleString()} al cliente.
                                </div>
                            )}
                            {(order.pickupInfo as any)?.coordinates?.coordinates && (order.dropoffInfo as any)?.coordinates?.coordinates && (
                                <div className="mt-2">
                                    <RoutePreviewMap pickupCoords={pickupCoords} dropoffCoords={dropoffCoords} height={140} />
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="pt-4 border-t">
                            <Button
                                onClick={() => handleAccept(order._id)}
                                disabled={actingOn === order._id}
                                className="w-full min-h-[48px] h-12 text-base sm:text-lg bg-orange-600 hover:bg-orange-700 shadow-md transition-transform hover:-translate-y-0.5 touch-manipulation"
                            >
                                {actingOn === order._id ? "Aceptando..." : "Aceptar Entrega"}
                            </Button>
                        </CardFooter>
                    </Card>
                );})}
            </div>
        </div>
    );
}
