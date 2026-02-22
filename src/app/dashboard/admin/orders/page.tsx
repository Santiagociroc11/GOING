"use client";

import { useEffect, useState } from "react";
import { fetchWithToast, mutateWithToast } from "@/lib/toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    RefreshCcw,
    MapPin,
    Package,
    Truck,
    MoreVertical,
    Clock,
    Building2,
    User,
} from "lucide-react";

type PopulatedUser = { _id: string; name: string; email: string } | null;

type Order = {
    _id: string;
    city: string;
    price: number;
    status: string;
    details: string;
    pickupInfo: { address: string; contactName: string };
    dropoffInfo: { address: string; contactName: string };
    businessId: PopulatedUser & { businessDetails?: { companyName?: string } };
    driverId: PopulatedUser & { driverDetails?: { vehicleType?: string } };
    createdAt: string;
};

const STATUS_FLOW = [
    { key: "PENDING", label: "Pendiente", color: "bg-amber-100 text-amber-800 border-amber-200" },
    { key: "ACCEPTED", label: "Aceptado", color: "bg-orange-100 text-orange-800 border-orange-200" },
    { key: "PICKED_UP", label: "En Camino", color: "bg-blue-100 text-blue-800 border-blue-200" },
    { key: "DELIVERED", label: "Entregado", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
];

const STATUS_OPTIONS = [
    ...STATUS_FLOW,
    { key: "CANCELLED", label: "Cancelado", color: "bg-red-100 text-red-800 border-red-200" },
];

const STATUS_CHANGE_OPTIONS = STATUS_OPTIONS;

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    return d.toLocaleDateString();
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCity, setFilterCity] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string>("");

    const fetchOrders = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filterCity) params.set("city", filterCity);
        if (filterStatus) params.set("status", filterStatus);
        const { data, error } = await fetchWithToast<Order[]>(`/api/admin/orders?${params}`);
        if (!error && data) setOrders(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, [filterCity, filterStatus]);

    const updateStatus = async (orderId: string, newStatus: string) => {
        const { ok } = await mutateWithToast(`/api/orders/${orderId}/status`, {
            method: "PUT",
            body: { status: newStatus },
        });
        if (ok) fetchOrders();
    };

    const ordersByStatus = STATUS_FLOW.reduce(
        (acc, s) => ({ ...acc, [s.key]: orders.filter((o) => o.status === s.key) }),
        {} as Record<string, Order[]>
    );
    const cancelledOrders = orders.filter((o) => o.status === "CANCELLED");
    const cities = [...new Set(orders.map((o) => o.city))].sort();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Flujo de Pedidos</h2>
                    <p className="text-gray-500">Monitorea el estado de todas las entregas en tiempo real.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={filterCity || "all"} onValueChange={(v) => setFilterCity(v === "all" ? "" : v)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Ciudad" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {cities.map((c) => (
                                <SelectItem key={c} value={c}>
                                    {c}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s.key} value={s.key}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchOrders} title="Actualizar">
                        <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Pipeline visual */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {STATUS_FLOW.map((status) => (
                    <div key={status.key} className="flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline" className={status.color}>
                                {status.label}
                            </Badge>
                            <span className="text-sm text-gray-500">
                                {ordersByStatus[status.key]?.length ?? 0}
                            </span>
                        </div>
                        <div className="space-y-3 min-h-[120px]">
                            {(ordersByStatus[status.key] ?? []).map((order) => (
                                <OrderCard
                                    key={order._id}
                                    order={order}
                                    onStatusChange={updateStatus}
                                    statusOptions={STATUS_CHANGE_OPTIONS}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Cancelados */}
            {cancelledOrders.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <span className="text-red-600">Cancelados</span>
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                            {cancelledOrders.length}
                        </Badge>
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {cancelledOrders.map((order) => (
                            <OrderCard
                                key={order._id}
                                order={order}
                                onStatusChange={updateStatus}
                                statusOptions={STATUS_CHANGE_OPTIONS}
                                compact
                            />
                        ))}
                    </div>
                </div>
            )}

            {orders.length === 0 && !loading && (
                <div className="text-center py-16 border-2 border-dashed rounded-xl bg-white">
                    <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No hay pedidos con los filtros seleccionados.</p>
                </div>
            )}
        </div>
    );
}

function OrderCard({
    order,
    onStatusChange,
    statusOptions,
    compact = false,
}: {
    order: Order;
    onStatusChange: (id: string, status: string) => void;
    statusOptions: { key: string; label: string }[];
    compact?: boolean;
}) {
    const businessName =
        (order.businessId as any)?.businessDetails?.companyName ||
        (order.businessId as any)?.name ||
        "—";
    const driverName = (order.driverId as any)?.name || "Sin asignar";

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs text-gray-500">#{order._id.slice(-8).toUpperCase()}</p>
                        <p className="font-bold text-orange-600">${order.price.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(order.createdAt)}
                        </p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {statusOptions
                                .filter((s) => s.key !== order.status)
                                .map((s) => (
                                    <DropdownMenuItem
                                        key={s.key}
                                        onClick={() => onStatusChange(order._id, s.key)}
                                    >
                                        Cambiar a {s.label}
                                    </DropdownMenuItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            {!compact && (
                <CardContent className="p-4 pt-0 space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                        <p className="truncate" title={businessName}>
                            {businessName}
                        </p>
                    </div>
                    <div className="flex items-start gap-2">
                        <User className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                        <p className="truncate" title={driverName}>
                            {driverName}
                        </p>
                    </div>
                    <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                        <p className="truncate text-gray-600" title={order.pickupInfo.address}>
                            {order.pickupInfo.address}
                        </p>
                    </div>
                    <div className="flex items-start gap-2">
                        <Truck className="h-4 w-4 shrink-0 text-orange-500 mt-0.5" />
                        <p className="truncate text-gray-600" title={order.dropoffInfo.address}>
                            {order.dropoffInfo.address}
                        </p>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
