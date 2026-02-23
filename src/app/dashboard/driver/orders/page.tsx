"use client";

import { useEffect, useState } from "react";
import { toast, fetchWithToast, mutateWithToast } from "@/lib/toast";
import { useDriverLocationSender } from "@/hooks/useDriverLocationSender";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, PackageCheck, PackageOpen, Truck } from "lucide-react";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { NotificationPromptBanner } from "@/components/NotificationPromptBanner";
import { ProofUploadModal } from "@/components/ProofUploadModal";
import { RateOrderButton } from "@/components/RateOrderButton";
import { getDistanceMeters, PICKUP_DELIVERY_RADIUS_METERS } from "@/lib/geo";

type Order = {
    _id: string;
    city: string;
    price: number;
    status: string;
    details: string;
    hasRated?: boolean;
    paymentMethod?: "PREPAID" | "COD";
    productValue?: number;
    pickupProofUrl?: string;
    deliveryProofUrl?: string;
    pickupInfo: {
        address: string;
        contactName: string;
        contactPhone: string;
        coordinates?: { coordinates?: [number, number] };
    };
    dropoffInfo: {
        address: string;
        contactName: string;
        contactPhone: string;
        coordinates?: { coordinates?: [number, number] };
    };
    businessId?: { name: string; businessDetails?: { companyName?: string } } | null;
    createdAt: string;
};

export default function DriverOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [pagination, setPagination] = useState<{ total: number; hasMore: boolean; page: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState<number | null>(null);

    const fetchOrders = async (page = 1) => {
        setLoading(true);
        const { data, error } = await fetchWithToast<{ orders: Order[]; pagination: { total: number; hasMore: boolean; page: number } }>(`/api/orders?page=${page}&limit=20`);
        if (!error && data) {
            setOrders(data.orders);
            setPagination(data.pagination);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders(1);
    }, []);

    useEffect(() => {
        fetchWithToast<{ balance: number }>("/api/wallet/balance").then(({ data }) => {
            if (data) setBalance(data.balance);
        });
    }, []);

    const [proofModal, setProofModal] = useState<{
        orderId: string;
        type: "pickup" | "delivery";
        driverLocation?: { lat: number; lng: number };
    } | null>(null);

    const getTargetCoords = (order: Order, type: "pickup" | "delivery"): [number, number] | null => {
        const info = type === "pickup" ? order.pickupInfo : order.dropoffInfo;
        const coords = (info as any)?.coordinates?.coordinates;
        if (Array.isArray(coords) && coords.length >= 2) return [coords[1], coords[0]]; // [lat, lng]
        return null;
    };

    const handleProofButtonClick = (order: Order, type: "pickup" | "delivery") => {
        const targetCoords = getTargetCoords(order, type);
        if (!targetCoords) {
            toast.warning("Esta entrega no tiene coordenadas. Se permitirá marcar sin verificación de ubicación.");
            setProofModal({ orderId: order._id, type });
            return;
        }
        if (!navigator.geolocation) {
            toast.error("Tu dispositivo no soporta geolocalización.");
            return;
        }
        toast.loading("Verificando ubicación...", { id: "geo-check" });
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                toast.dismiss("geo-check");
                const [targetLat, targetLng] = targetCoords;
                const dist = getDistanceMeters(pos.coords.latitude, pos.coords.longitude, targetLat, targetLng);
                if (dist > PICKUP_DELIVERY_RADIUS_METERS) {
                    toast.error(`Debes estar a menos de ${PICKUP_DELIVERY_RADIUS_METERS}m. Estás a ~${Math.round(dist)}m.`);
                    return;
                }
                setProofModal({
                    orderId: order._id,
                    type,
                    driverLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                });
            },
            (err) => {
                toast.dismiss("geo-check");
                toast.error(err.code === 1 ? "Permiso de ubicación denegado" : "No se pudo obtener tu ubicación");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleProofConfirm = async (proofUrl: string, driverLat?: number, driverLng?: number) => {
        if (!proofModal) return;
        const status = proofModal.type === "pickup" ? "PICKED_UP" : "DELIVERED";
        const body: Record<string, unknown> = {
            status,
            ...(proofModal.type === "pickup" ? { pickupProofUrl: proofUrl } : { deliveryProofUrl: proofUrl }),
        };
        if (driverLat != null && driverLng != null) {
            body.driverLat = driverLat;
            body.driverLng = driverLng;
        }
        const { ok } = await mutateWithToast(`/api/orders/${proofModal.orderId}/status`, { method: "PUT", body });
        if (!ok) throw new Error("No se pudo actualizar");
        toast.success(proofModal.type === "pickup" ? "Pedido marcado como recogido" : "Pedido marcado como entregado");
        fetchOrders();
        setProofModal(null);
    };

    const activeOrders = orders.filter(o => ["ACCEPTED", "PICKED_UP"].includes(o.status));
    const pastOrders = orders.filter(o => ["DELIVERED", "CANCELLED"].includes(o.status));

    useDriverLocationSender(activeOrders.map((o) => o._id));

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <NotificationPromptBanner />
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight">Mis Entregas</h2>
                    <p className="text-gray-500">Gestiona tus rutas activas y mira tu historial.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <PushNotificationToggle />
                    {balance !== null && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                            <span className="text-sm text-emerald-600">Saldo acumulado:</span>
                            <span className="font-bold text-emerald-700">${balance.toLocaleString()}</span>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold mb-4 text-orange-900 border-b pb-2">Ruta Activa</h3>
                {activeOrders.length === 0 ? (
                    <div className="text-center py-10 bg-white border rounded-xl border-dashed">
                        <p className="text-gray-500">No tienes entregas activas.</p>
                        <Button variant="link" onClick={() => window.location.href = "/dashboard/driver/feed"} className="text-orange-600">Buscar entregas en el Feed</Button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {activeOrders.map(order => (
                            <Card key={order._id} className="shadow-lg border-2 border-orange-500 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4">
                                    <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
                                        {order.status === 'ACCEPTED' ? 'ACEPTADO' : order.status === 'PICKED_UP' ? 'RECOGIDO' : order.status}
                                    </span>
                                </div>
                                <CardHeader className="bg-orange-50/50 pb-4">
                                    <CardTitle className="text-xl font-bold">Entrega #{order._id.slice(-6).toUpperCase()}</CardTitle>
                                    <p className="text-lg font-bold text-orange-600">${order.price.toFixed(2)}</p>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-gray-100 p-2 rounded-full mt-1">
                                            <PackageOpen className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Información de Recogida</p>
                                            <p className="font-semibold text-gray-900 text-lg">{order.pickupInfo.address}</p>
                                            <p className="text-sm text-gray-600">{order.pickupInfo.contactName} • {order.pickupInfo.contactPhone}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="bg-orange-100 p-2 rounded-full mt-1">
                                            <MapPin className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-orange-400 font-semibold uppercase tracking-wider mb-1">Información de Entrega</p>
                                            <p className="font-semibold text-gray-900 text-lg">{order.dropoffInfo.address}</p>
                                            <p className="text-sm text-gray-600">{order.dropoffInfo.contactName} • {order.dropoffInfo.contactPhone}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-xl border text-sm text-gray-700">
                                        <span className="font-bold flex items-center gap-2 mb-1"><PackageCheck className="h-4 w-4" /> Detalles del Paquete</span>
                                        {order.details}
                                    </div>
                                    {order.paymentMethod === "COD" && order.productValue != null && (
                                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800">
                                            <span className="font-bold">Recaudo contraentrega:</span> Cobra <span className="font-bold">${order.productValue.toLocaleString()}</span> al cliente al entregar.
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="bg-gray-50 border-t p-4 flex gap-4">
                                    {order.status === "ACCEPTED" && (
                                        <Button
                                            className="w-full h-14 text-lg bg-orange-500 hover:bg-orange-600 shadow-md"
                                            onClick={() => handleProofButtonClick(order, "pickup")}
                                        >
                                            <Truck className="mr-2 h-5 w-5" /> He recogido el paquete (sube prueba)
                                        </Button>
                                    )}
                                    {order.status === "PICKED_UP" && (
                                        <Button
                                            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 shadow-md"
                                            onClick={() => handleProofButtonClick(order, "delivery")}
                                        >
                                            <PackageCheck className="mr-2 h-5 w-5" /> Marcar como Entregado (sube prueba)
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <ProofUploadModal
                open={!!proofModal}
                onOpenChange={(v) => !v && setProofModal(null)}
                title={proofModal?.type === "pickup" ? "Prueba de recogida" : "Prueba de entrega"}
                description={proofModal?.type === "pickup"
                    ? "Sube una foto que demuestre que recogiste el paquete en el punto de recogida."
                    : "Sube una foto que demuestre la entrega al destinatario."}
                onConfirm={handleProofConfirm}
                driverLocation={proofModal?.driverLocation ?? null}
            />

            <div className="mt-12">
                <h3 className="text-xl font-bold mb-4 text-gray-900 border-b pb-2">Entregas Pasadas</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                    {pastOrders.length === 0 && (
                        <p className="text-gray-500">No se encontraron entregas pasadas.</p>
                    )}
                    {pastOrders.map(order => (
                        <Card key={order._id} className="opacity-75 hover:opacity-100 transition-opacity">
                            <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div>
                                    <p className="font-semibold text-gray-900">${order.price.toFixed(2)} - {new Date(order.createdAt).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-500 truncate max-w-[200px]">{order.dropoffInfo.address}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {order.status === "DELIVERED" && order.businessId && (
                                        <RateOrderButton
                                            orderId={order._id}
                                            targetName={order.businessId.businessDetails?.companyName || order.businessId.name || "Negocio"}
                                            rated={order.hasRated}
                                            onRated={() => fetchOrders(1)}
                                        />
                                    )}
                                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {order.status === 'DELIVERED' ? 'ENTREGADO' : 'CANCELADO'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
