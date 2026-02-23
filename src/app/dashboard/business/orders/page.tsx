"use client";

import { useEffect, useState } from "react";
import { fetchWithToast, mutateWithToast, toast } from "@/lib/toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, Truck, Package, XCircle, Eye } from "lucide-react";
import { RateOrderButton } from "@/components/RateOrderButton";
import { OrderDetailModal } from "@/components/OrderDetailModal";
import { OrderTrackingMap } from "@/components/OrderTrackingMap";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { NotificationPromptBanner } from "@/components/NotificationPromptBanner";

type Order = {
    _id: string;
    city: string;
    price: number;
    status: string;
    details: string;
    paymentMethod?: "PREPAID" | "COD";
    productValue?: number;
    codCollectedAt?: string;
    hasRated?: boolean;
    pickupInfo: {
        address: string;
        contactName?: string;
        contactPhone?: string;
        coordinates?: { coordinates?: [number, number] };
    };
    dropoffInfo: {
        address: string;
        contactName?: string;
        contactPhone?: string;
        coordinates?: { coordinates?: [number, number] };
    };
    driverId?: { name: string; driverDetails?: { vehicleType?: string } } | null;
    lastDriverLocation?: { lat: number; lng: number; updatedAt?: string } | null;
    pickupProofUrl?: string;
    deliveryProofUrl?: string;
    createdAt: string;
    updatedAt?: string;
};

const DEFAULT_COORDS: [number, number] = [-74.006, 40.7128];

function getCoords(order: Order, type: "pickup" | "dropoff"): [number, number] {
    const info = type === "pickup" ? order.pickupInfo : order.dropoffInfo;
    const coords = (info as any)?.coordinates?.coordinates;
    if (Array.isArray(coords) && coords.length >= 2) return [coords[0], coords[1]];
    return DEFAULT_COORDS;
}

export default function BusinessOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [pagination, setPagination] = useState<{ total: number; hasMore: boolean; page: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailOrder, setDetailOrder] = useState<Order | null>(null);

    const fetchOrders = async (page = 1) => {
        setLoading(true);
        const { data, error } = await fetchWithToast<{ orders: Order[]; pagination: { total: number; hasMore: boolean; page: number } }>(`/api/orders?page=${page}&limit=20`);
        if (!error && data) {
            setOrders(data.orders);
            setPagination(data.pagination);
        }
        setLoading(false);
    };

    const [mapExpanded, setMapExpanded] = useState<Order | null>(null);

    useEffect(() => {
        fetchOrders(1);
        const interval = setInterval(() => fetchOrders(1), 20000);
        return () => clearInterval(interval);
    }, []);

    const confirmCod = async (orderId: string) => {
        const { ok } = await mutateWithToast(`/api/orders/${orderId}/confirm-cod`, { method: "POST" });
        if (ok) {
            toast.success("Recaudo confirmado");
            fetchOrders(1);
        }
    };

    const cancelOrder = async (orderId: string) => {
        if (!confirm("¿Cancelar este pedido? Se devolverá el saldo si estaba prepagado.")) return;
        const { ok } = await mutateWithToast(`/api/orders/${orderId}/status`, {
            method: "PUT",
            body: { status: "CANCELLED" },
        });
        if (ok) {
            toast.success("Pedido cancelado");
            fetchOrders(1);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Esperando Domiciliario</Badge>;
            case "ACCEPTED": return <Badge variant="outline" className="bg-orange-50 text-orange-700">Aceptado</Badge>;
            case "PICKED_UP": return <Badge variant="outline" className="bg-purple-50 text-purple-700">En Camino</Badge>;
            case "DELIVERED": return <Badge variant="outline" className="bg-green-50 text-green-700">Entregado</Badge>;
            case "CANCELLED": return <Badge variant="destructive">Cancelado</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const activeOrders = orders.filter((o) => ["PENDING", "ACCEPTED", "PICKED_UP"].includes(o.status));
    const completedOrders = orders.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status));

    const handleCancelFromModal = async (orderId: string) => {
        if (!confirm("¿Cancelar este pedido? Se devolverá el saldo si estaba prepagado.")) return;
        const { ok } = await mutateWithToast(`/api/orders/${orderId}/status`, {
            method: "PUT",
            body: { status: "CANCELLED" },
        });
        if (ok) {
            toast.success("Pedido cancelado");
            setDetailOrder(null);
            fetchOrders(1);
        }
    };

    return (
        <div className="space-y-6">
            <NotificationPromptBanner />
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-3xl font-bold tracking-tight">Mis Pedidos</h2>
                    <p className="text-gray-500">Rastrea tus entregas. Se actualiza cada 20 segundos.</p>
                </div>
                <div className="flex items-center gap-2">
                    <PushNotificationToggle />
                    <Button variant="outline" onClick={() => fetchOrders(1)} disabled={loading} className="hover:text-orange-600 border-orange-200">
                        <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Actualizar
                    </Button>
                </div>
            </div>

            {activeOrders.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Package className="h-5 w-5 text-orange-600" />
                        En curso ({activeOrders.length})
                    </h3>
                    <div className="border rounded-lg bg-white overflow-hidden">
                        <div className="divide-y p-2 sm:p-4">
                            {activeOrders.map((order) => (
                                <div key={order._id} className="p-4 rounded-lg hover:bg-gray-50/50 space-y-3">
                                    <div className="flex justify-between items-start flex-wrap gap-2">
                                        <div>
                                            <span className="font-bold text-orange-600">${order.price.toFixed(2)}</span>
                                            <span className="text-gray-500 text-sm ml-2">#{order._id.slice(-6).toUpperCase()}</span>
                                        </div>
                                        {getStatusBadge(order.status)}
                                    </div>
                                    <p className="text-sm text-gray-600 truncate">{order.pickupInfo.address}</p>
                                    <p className="text-sm text-gray-600 truncate flex items-center gap-1">
                                        <Truck className="h-4 w-4 text-orange-500 shrink-0" />
                                        {order.driverId ? `${order.driverId.name}${order.driverId.driverDetails?.vehicleType ? ` (${order.driverId.driverDetails.vehicleType})` : ""}` : "Esperando..."}
                                    </p>
                                    <OrderTrackingMap
                                        pickupCoords={getCoords(order, "pickup")}
                                        dropoffCoords={getCoords(order, "dropoff")}
                                        driverLocation={order.driverId ? order.lastDriverLocation ?? undefined : undefined}
                                        height={160}
                                        showExpand={!!order.driverId}
                                        onExpand={() => setMapExpanded(order)}
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        <Button size="sm" variant="outline" className="border-orange-200 hover:bg-orange-50" onClick={() => setDetailOrder(order)}>
                                            <Eye className="h-4 w-4 mr-1" /> Ver detalles
                                        </Button>
                                        {["PENDING", "ACCEPTED"].includes(order.status) && (
                                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => cancelOrder(order._id)}>
                                                <XCircle className="h-4 w-4 mr-1" /> Cancelar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {mapExpanded && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setMapExpanded(null)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-semibold">Pedido #{mapExpanded._id.slice(-6).toUpperCase()}</h3>
                            <Button variant="ghost" size="sm" onClick={() => setMapExpanded(null)}>Cerrar</Button>
                        </div>
                        <div className="p-4">
                            <OrderTrackingMap
                                pickupCoords={getCoords(mapExpanded, "pickup")}
                                dropoffCoords={getCoords(mapExpanded, "dropoff")}
                                driverLocation={mapExpanded.driverId ? mapExpanded.lastDriverLocation ?? undefined : undefined}
                                height={400}
                                showExpand={false}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-lg font-semibold mb-3">Historial</h3>
                <div className="border rounded-lg bg-white overflow-hidden">
                    <div className="md:hidden divide-y p-2">
                        {orders.length === 0 && !loading && (
                            <div className="p-8 text-center text-gray-500 text-sm">Aún no has creado ningún pedido.</div>
                        )}
                        {completedOrders.map((order) => (
                            <div key={order._id} className="p-4 rounded-lg hover:bg-gray-50/50 space-y-2">
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-gray-700">${order.price.toFixed(2)}</span>
                                    {getStatusBadge(order.status)}
                                </div>
                                <p className="text-sm text-gray-600 truncate">{order.pickupInfo.address}</p>
                                <p className="text-sm text-gray-500">{order.driverId?.name || "—"}</p>
                                {order.status === "DELIVERED" && order.paymentMethod === "COD" && !order.codCollectedAt && (
                                    <Button size="sm" variant="outline" className="text-amber-700" onClick={() => confirmCod(order._id)}>Confirmar recaudo</Button>
                                )}
                                {order.status === "DELIVERED" && order.driverId && (
                                    <RateOrderButton orderId={order._id} targetName={order.driverId.name} rated={order.hasRated} onRated={() => fetchOrders(1)} />
                                )}
                                <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                                <Button size="sm" variant="outline" className="border-orange-200 hover:bg-orange-50 w-fit" onClick={() => setDetailOrder(order)}>
                                    <Eye className="h-4 w-4 mr-1" /> Ver detalles
                                </Button>
                            </div>
                        ))}
                    </div>
                    <div className="hidden md:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50">
                                <TableHead>Fecha</TableHead>
                                <TableHead>Recogida</TableHead>
                                <TableHead>Entrega</TableHead>
                                <TableHead>Domiciliario</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Precio</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {completedOrders.map((order) => (
                                <TableRow key={order._id}>
                                    <TableCell className="font-medium whitespace-nowrap text-gray-600">
                                        {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </TableCell>
                                    <TableCell className="max-w-[180px] truncate">{order.pickupInfo.address}</TableCell>
                                    <TableCell className="max-w-[180px] truncate">{order.dropoffInfo.address}</TableCell>
                                    <TableCell className="text-gray-500 text-sm">
                                        {order.driverId?.name || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {getStatusBadge(order.status)}
                                            {order.status === "DELIVERED" && order.paymentMethod === "COD" && !order.codCollectedAt && (
                                                <Button size="sm" variant="outline" className="text-amber-700 border-amber-200 hover:bg-amber-50 w-fit" onClick={() => confirmCod(order._id)}>
                                                    Confirmar recaudo
                                                </Button>
                                            )}
                                            {order.codCollectedAt && order.paymentMethod === "COD" && (
                                                <span className="text-xs text-emerald-600">Recaudo confirmado</span>
                                            )}
                                            {order.status === "DELIVERED" && order.driverId && (
                                                <RateOrderButton orderId={order._id} targetName={order.driverId.name} rated={order.hasRated} onRated={() => fetchOrders(1)} />
                                            )}
                                            <Button size="sm" variant="ghost" className="text-orange-600 hover:bg-orange-50 w-fit" onClick={() => setDetailOrder(order)}>
                                                <Eye className="h-4 w-4 mr-1" /> Ver detalles
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-gray-700">${order.price.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>
                </div>
            </div>

            <OrderDetailModal
                order={detailOrder}
                open={!!detailOrder}
                onOpenChange={(open) => !open && setDetailOrder(null)}
                onCancel={handleCancelFromModal}
                onConfirmCod={confirmCod}
                onRated={() => fetchOrders(1)}
            />
        </div>
    );
}
