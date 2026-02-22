"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchWithToast, mutateWithToast } from "@/lib/toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    RefreshCcw,
    MapPin,
    Package,
    Truck,
    MoreVertical,
    Clock,
    Building2,
    User,
    Search,
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    List,
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

function shortId(id: string) {
    return `#${id.slice(-8).toUpperCase()}`;
}

const PAGE_SIZE = 50;

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [total, setTotal] = useState(0);
    const [cities, setCities] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCity, setFilterCity] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [search, setSearch] = useState("");
    const [searchDebounced, setSearchDebounced] = useState("");
    const [page, setPage] = useState(0);
    const [viewMode, setViewMode] = useState<"pipeline" | "table">("table");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setSearchDebounced(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filterCity) params.set("city", filterCity);
        if (filterStatus) params.set("status", filterStatus);
        if (searchDebounced) params.set("search", searchDebounced);
        params.set("limit", String(PAGE_SIZE));
        params.set("skip", String(page * PAGE_SIZE));
        const { data, error } = await fetchWithToast<{
            orders: Order[];
            total: number;
            cities?: string[];
        }>(`/api/admin/orders?${params}`);
        if (!error && data) {
            setOrders(data.orders);
            setTotal(data.total);
            if (data.cities) setCities(data.cities);
        }
        setLoading(false);
    }, [filterCity, filterStatus, searchDebounced, page]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        setPage(0);
    }, [filterCity, filterStatus, searchDebounced]);

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
    const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
    const hasFilters = filterCity || filterStatus || searchDebounced;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-3xl font-bold tracking-tight">Flujo de Pedidos</h2>
                        <p className="text-gray-500 text-sm">
                            Monitorea el estado de todas las entregas. Escalable para alto volumen.
                        </p>
                    </div>
                </div>

                {/* Barra de filtros y búsqueda */}
                <div className="flex flex-col gap-3 p-4 rounded-lg border bg-muted/30">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por ID (ej: abc123...)"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={filterCity || "all"} onValueChange={(v) => setFilterCity(v === "all" ? "" : v)}>
                            <SelectTrigger className="w-full sm:w-[140px]">
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
                            <SelectTrigger className="w-full sm:w-[140px]">
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

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                                {total} pedido{total !== 1 ? "s" : ""}
                                {hasFilters && " (filtrados)"}
                            </span>
                            <div className="flex gap-1">
                                <Button
                                    variant={viewMode === "table" ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode("table")}
                                    title="Vista tabla (rápida para muchos pedidos)"
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === "pipeline" ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode("pipeline")}
                                    title="Vista pipeline"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                                    disabled={page === 0 || loading}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-gray-600 min-w-[80px] text-center">
                                    Pág. {page + 1} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1 || loading}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {viewMode === "table" ? (
                /* Vista tabla: compacta, escaneable, ideal para alto volumen */
                <div className="rounded-lg border overflow-hidden bg-white">
                    <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead className="sticky top-0 bg-muted/95 z-10 font-semibold">ID</TableHead>
                                    <TableHead className="sticky top-0 bg-muted/95 z-10">Estado</TableHead>
                                    <TableHead className="sticky top-0 bg-muted/95 z-10">Precio</TableHead>
                                    <TableHead className="sticky top-0 bg-muted/95 z-10 hidden md:table-cell">Negocio</TableHead>
                                    <TableHead className="sticky top-0 bg-muted/95 z-10 hidden lg:table-cell">Domiciliario</TableHead>
                                    <TableHead className="sticky top-0 bg-muted/95 z-10 hidden sm:table-cell">Ciudad</TableHead>
                                    <TableHead className="sticky top-0 bg-muted/95 z-10">Tiempo</TableHead>
                                    <TableHead className="sticky top-0 bg-muted/95 z-10 w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => {
                                    const status = STATUS_OPTIONS.find((s) => s.key === order.status);
                                    const businessName =
                                        (order.businessId as any)?.businessDetails?.companyName ||
                                        (order.businessId as any)?.name ||
                                        "—";
                                    const driverName = (order.driverId as any)?.name || "—";
                                    return (
                                        <TableRow
                                            key={order._id}
                                            className="group cursor-pointer"
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            <TableCell className="font-mono text-xs">
                                                {shortId(order._id)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={status?.color || ""}>
                                                    {status?.label || order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold text-orange-600">
                                                ${order.price.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell max-w-[120px] truncate" title={businessName}>
                                                {businessName}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell max-w-[100px] truncate" title={driverName}>
                                                {driverName}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">{order.city}</TableCell>
                                            <TableCell className="text-gray-500 text-xs">
                                                {formatTime(order.createdAt)}
                                            </TableCell>
                                            <TableCell className="p-1" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {STATUS_CHANGE_OPTIONS
                                                            .filter((s) => s.key !== order.status)
                                                            .map((s) => (
                                                                <DropdownMenuItem
                                                                    key={s.key}
                                                                    onClick={() => updateStatus(order._id, s.key)}
                                                                >
                                                                    Cambiar a {s.label}
                                                                </DropdownMenuItem>
                                                            ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    {orders.length === 0 && !loading && (
                        <div className="py-12 text-center text-gray-500">
                            No hay pedidos con los filtros seleccionados.
                        </div>
                    )}
                </div>
            ) : (
                /* Vista pipeline: columnas por estado */
                <div className="flex overflow-x-auto gap-4 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:overflow-visible sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 snap-x snap-mandatory [scrollbar-width:thin] overscroll-x-contain">
                    {STATUS_FLOW.map((status) => (
                        <div key={status.key} className="flex flex-col min-w-[280px] sm:min-w-0 shrink-0 sm:shrink snap-start">
                            <div className="flex items-center justify-between mb-3">
                                <Badge variant="outline" className={status.color}>
                                    {status.label}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                    {ordersByStatus[status.key]?.length ?? 0}
                                </span>
                            </div>
                            <div className="space-y-3 min-h-[100px] max-h-[60vh] overflow-y-auto overscroll-contain">
                                {(ordersByStatus[status.key] ?? []).map((order) => (
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
                    ))}
                </div>
            )}

            {/* Cancelados (solo si hay en la página actual) */}
            {cancelledOrders.length > 0 && viewMode === "pipeline" && (
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

            <OrderDetailDialog
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onStatusChange={updateStatus}
                statusOptions={STATUS_CHANGE_OPTIONS}
            />

            {orders.length === 0 && !loading && (
                <div className="text-center py-16 border-2 border-dashed rounded-xl bg-white">
                    <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No hay pedidos con los filtros seleccionados.</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Prueba ajustar ciudad, estado o búsqueda por ID.
                    </p>
                </div>
            )}
        </div>
    );
}

function OrderDetailDialog({
    order,
    onClose,
    onStatusChange,
    statusOptions,
}: {
    order: Order | null;
    onClose: () => void;
    onStatusChange: (id: string, status: string) => void;
    statusOptions: { key: string; label: string }[];
}) {
    if (!order) return null;
    const businessName =
        (order.businessId as any)?.businessDetails?.companyName ||
        (order.businessId as any)?.name ||
        "—";
    const driverName = (order.driverId as any)?.name || "Sin asignar";
    const status = STATUS_OPTIONS.find((s) => s.key === order.status);

    return (
        <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {shortId(order._id)}
                        <Badge variant="outline" className={status?.color || ""}>
                            {status?.label || order.status}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Precio</span>
                        <span className="font-bold text-orange-600">${order.price.toFixed(2)}</span>
                    </div>
                    <div>
                        <p className="text-gray-500 mb-1">Negocio</p>
                        <p className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            {businessName}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500 mb-1">Domiciliario</p>
                        <p className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            {driverName}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500 mb-1">Recoger en</p>
                        <p className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                            {order.pickupInfo.address}
                        </p>
                        <p className="text-xs text-gray-500 ml-6">{order.pickupInfo.contactName}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 mb-1">Entregar en</p>
                        <p className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-orange-500 shrink-0" />
                            {order.dropoffInfo.address}
                        </p>
                        <p className="text-xs text-gray-500 ml-6">{order.dropoffInfo.contactName}</p>
                    </div>
                    {order.details && (
                        <div>
                            <p className="text-gray-500 mb-1">Detalles</p>
                            <p className="text-gray-700">{order.details}</p>
                        </div>
                    )}
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(order.createdAt)} · {order.city}
                    </p>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full">
                                Cambiar estado
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-56">
                            {statusOptions
                                .filter((s) => s.key !== order.status)
                                .map((s) => (
                                    <DropdownMenuItem
                                        key={s.key}
                                        onClick={() => {
                                            onStatusChange(order._id, s.key);
                                            onClose();
                                        }}
                                    >
                                        Cambiar a {s.label}
                                    </DropdownMenuItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </DialogContent>
        </Dialog>
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
            <CardHeader className="p-3 sm:p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs text-gray-500">{shortId(order._id)}</p>
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
                <CardContent className="p-3 sm:p-4 pt-0 space-y-2 text-sm">
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
