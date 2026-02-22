"use client";

import { useEffect, useState } from "react";
import { fetchWithToast } from "@/lib/toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, Truck, Package } from "lucide-react";

type Order = {
    _id: string;
    city: string;
    price: number;
    status: string;
    details: string;
    pickupInfo: { address: string };
    dropoffInfo: { address: string };
    driverId?: { name: string; driverDetails?: { vehicleType?: string } } | null;
    createdAt: string;
};

export default function BusinessOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        const { data, error } = await fetchWithToast<Order[]>("/api/orders");
        if (!error && data) setOrders(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000); // Auto-refresh cada 30s
        return () => clearInterval(interval);
    }, []);

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Mis Pedidos</h2>
                    <p className="text-gray-500">Rastrea tus entregas. Se actualiza automáticamente cada 30 segundos.</p>
                </div>
                <Button variant="outline" onClick={fetchOrders} disabled={loading} className="hover:text-orange-600 border-orange-200">
                    <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Actualizar
                </Button>
            </div>

            {activeOrders.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Package className="h-5 w-5 text-orange-600" />
                        En curso ({activeOrders.length})
                    </h3>
                    <div className="border rounded-lg bg-white overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-orange-50/50">
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Recogida</TableHead>
                                    <TableHead>Entrega</TableHead>
                                    <TableHead>Domiciliario</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Precio</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeOrders.map((order) => (
                                    <TableRow key={order._id} className="bg-orange-50/20">
                                        <TableCell className="font-medium whitespace-nowrap">
                                            {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </TableCell>
                                        <TableCell className="max-w-[180px] truncate">{order.pickupInfo.address}</TableCell>
                                        <TableCell className="max-w-[180px] truncate">{order.dropoffInfo.address}</TableCell>
                                        <TableCell>
                                            {order.driverId ? (
                                                <span className="flex items-center gap-1 text-sm">
                                                    <Truck className="h-4 w-4 text-orange-500" />
                                                    {order.driverId.name}
                                                    {order.driverId.driverDetails?.vehicleType && (
                                                        <span className="text-gray-500">({order.driverId.driverDetails.vehicleType})</span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-sm">Esperando...</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        <TableCell className="text-right font-bold text-gray-700">${order.price.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-lg font-semibold mb-3">Historial</h3>
                <div className="border rounded-lg bg-white overflow-hidden">
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
                            {orders.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                        Aún no has creado ningún pedido.
                                    </TableCell>
                                </TableRow>
                            )}
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
                                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                                    <TableCell className="text-right font-bold text-gray-700">${order.price.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
