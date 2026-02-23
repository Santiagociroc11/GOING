"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, User, Phone, Truck, Package, XCircle, Clock } from "lucide-react";
import { RateOrderButton } from "@/components/RateOrderButton";
import { OrderTimers } from "@/components/OrderTimers";

type OrderDetail = {
    _id: string;
    city: string;
    price: number;
    status: string;
    details: string;
    paymentMethod?: "PREPAID" | "COD";
    productValue?: number;
    codCollectedAt?: string;
    hasRated?: boolean;
    pickupInfo: { address: string; contactName?: string; contactPhone?: string; coordinates?: { coordinates?: [number, number] } };
    dropoffInfo: { address: string; contactName?: string; contactPhone?: string; coordinates?: { coordinates?: [number, number] } };
    driverId?: { name: string; driverDetails?: { vehicleType?: string } } | null;
    pickupProofUrl?: string;
    deliveryProofUrl?: string;
    createdAt: string;
    updatedAt?: string;
    acceptedAt?: string;
    pickedUpAt?: string;
    deliveredAt?: string;
    lastDriverLocation?: { lat: number; lng: number } | null;
};

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Esperando Domiciliario",
    ACCEPTED: "Aceptado",
    PICKED_UP: "En Camino",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
};

const STATUS_STEPS = ["PENDING", "ACCEPTED", "PICKED_UP", "DELIVERED"];

type Props = {
    order: OrderDetail | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCancel?: (orderId: string) => Promise<void>;
    onConfirmCod?: (orderId: string) => Promise<void>;
    onRated?: () => void;
};

export function OrderDetailModal({
    order,
    open,
    onOpenChange,
    onCancel,
    onConfirmCod,
    onRated,
}: Props) {
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    if (!order) return null;

    const shortId = order._id.toString().slice(-6).toUpperCase();
    const canCancel = ["PENDING", "ACCEPTED"].includes(order.status);
    const canConfirmCod =
        order.status === "DELIVERED" &&
        order.paymentMethod === "COD" &&
        !order.codCollectedAt;
    const canRate =
        order.status === "DELIVERED" && order.driverId && !order.hasRated;

    const currentStepIndex =
        order.status === "CANCELLED" ? -1 : STATUS_STEPS.indexOf(order.status);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Pedido #{shortId}
                        <Badge
                            variant={
                                order.status === "CANCELLED" ? "destructive" : "outline"
                            }
                            className={
                                order.status === "PENDING"
                                    ? "bg-yellow-50 text-yellow-700"
                                    : order.status === "ACCEPTED"
                                      ? "bg-orange-50 text-orange-700"
                                      : order.status === "PICKED_UP"
                                        ? "bg-purple-50 text-purple-700"
                                        : order.status === "DELIVERED"
                                          ? "bg-green-50 text-green-700"
                                          : ""
                            }
                        >
                            {STATUS_LABELS[order.status] ?? order.status}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                {/* Temporizadores */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <OrderTimers order={order} />
                </div>

                {/* Timeline / Historial */}
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Historial
                    </h4>
                    <div className="space-y-2">
                        {STATUS_STEPS.map((step, i) => {
                            const isActive = i <= currentStepIndex;
                            return (
                                <div key={step} className="flex items-center gap-3">
                                    <div
                                        className={`w-3 h-3 rounded-full shrink-0 ${
                                            isActive ? "bg-orange-500" : "bg-gray-200"
                                        }`}
                                    />
                                    <span className={`text-sm ${isActive ? "text-gray-700" : "text-gray-400"}`}>
                                        {STATUS_LABELS[step]}
                                    </span>
                                    {i === 0 && (
                                        <span className="text-xs text-gray-500 ml-auto">
                                            {new Date(order.createdAt).toLocaleString()}
                                        </span>
                                    )}
                                    {i === currentStepIndex && i > 0 && order.updatedAt && (
                                        <span className="text-xs text-gray-500 ml-auto">
                                            {new Date(order.updatedAt).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                        {order.status === "CANCELLED" && (
                            <div className="flex items-center gap-3 pt-1">
                                <div className="w-3 h-3 rounded-full shrink-0 bg-red-500" />
                                <span className="text-sm text-red-600">Cancelado</span>
                                {order.updatedAt && (
                                    <span className="text-xs text-gray-500 ml-auto">
                                        {new Date(order.updatedAt).toLocaleString()}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recogida */}
                <div className="space-y-2 border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Package className="h-4 w-4 text-orange-500" /> Recogida
                    </h4>
                    <p className="text-sm flex items-start gap-2">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
                        {order.pickupInfo.address}
                    </p>
                    {(order.pickupInfo.contactName || order.pickupInfo.contactPhone) && (
                        <p className="text-sm flex items-center gap-2 text-gray-600">
                            <User className="h-4 w-4 shrink-0" />
                            {order.pickupInfo.contactName}
                            {order.pickupInfo.contactPhone && (
                                <>
                                    <Phone className="h-4 w-4 shrink-0" />
                                    <a
                                        href={`tel:${order.pickupInfo.contactPhone}`}
                                        className="text-orange-600 hover:underline"
                                    >
                                        {order.pickupInfo.contactPhone}
                                    </a>
                                </>
                            )}
                        </p>
                    )}
                    {order.pickupProofUrl && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setImagePreviewUrl(order.pickupProofUrl!)}
                                className="shrink-0 rounded-lg overflow-hidden border border-gray-200 hover:border-orange-400 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <img
                                    src={order.pickupProofUrl}
                                    alt="Prueba de recogida"
                                    className="w-16 h-16 object-cover"
                                />
                            </button>
                            <span className="text-xs text-gray-500">Prueba de recogida</span>
                        </div>
                    )}
                </div>

                {/* Entrega */}
                <div className="space-y-2 border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-500" /> Entrega
                    </h4>
                    <p className="text-sm flex items-start gap-2">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
                        {order.dropoffInfo.address}
                    </p>
                    {(order.dropoffInfo.contactName || order.dropoffInfo.contactPhone) && (
                        <p className="text-sm flex items-center gap-2 text-gray-600">
                            <User className="h-4 w-4 shrink-0" />
                            {order.dropoffInfo.contactName}
                            {order.dropoffInfo.contactPhone && (
                                <>
                                    <Phone className="h-4 w-4 shrink-0" />
                                    <a
                                        href={`tel:${order.dropoffInfo.contactPhone}`}
                                        className="text-orange-600 hover:underline"
                                    >
                                        {order.dropoffInfo.contactPhone}
                                    </a>
                                </>
                            )}
                        </p>
                    )}
                    {order.deliveryProofUrl && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setImagePreviewUrl(order.deliveryProofUrl!)}
                                className="shrink-0 rounded-lg overflow-hidden border border-gray-200 hover:border-green-400 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <img
                                    src={order.deliveryProofUrl}
                                    alt="Prueba de entrega"
                                    className="w-16 h-16 object-cover"
                                />
                            </button>
                            <span className="text-xs text-gray-500">Prueba de entrega</span>
                        </div>
                    )}
                </div>

                {/* Domiciliario */}
                {order.driverId && (
                    <div className="space-y-1 border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Truck className="h-4 w-4" /> Domiciliario
                        </h4>
                        <p className="text-sm">
                            {order.driverId.name}
                            {order.driverId.driverDetails?.vehicleType && (
                                <span className="text-gray-500">
                                    {" "}
                                    ({order.driverId.driverDetails.vehicleType})
                                </span>
                            )}
                        </p>
                    </div>
                )}

                {/* Detalles y pago */}
                <div className="space-y-2 border-t pt-4">
                    <p className="text-sm text-gray-600">{order.details}</p>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                            {order.paymentMethod === "COD"
                                ? `Contraentrega ($${order.productValue?.toFixed(2) ?? 0})`
                                : "Prepago"}
                        </span>
                        <span className="font-bold text-lg text-orange-600">
                            ${order.price.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap gap-2 border-t pt-4">
                    {canCancel && onCancel && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => onCancel(order._id)}
                        >
                            <XCircle className="h-4 w-4 mr-1" /> Cancelar pedido
                        </Button>
                    )}
                    {canConfirmCod && onConfirmCod && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-700 border-amber-200 hover:bg-amber-50"
                            onClick={() => onConfirmCod(order._id)}
                        >
                            Confirmar recaudo
                        </Button>
                    )}
                    {canRate && order.driverId && (
                        <RateOrderButton
                            orderId={order._id}
                            targetName={order.driverId.name}
                            rated={order.hasRated ?? false}
                            onRated={onRated ?? (() => {})}
                        />
                    )}
                </div>
            </DialogContent>
            <Dialog open={!!imagePreviewUrl} onOpenChange={(v) => !v && setImagePreviewUrl(null)}>
                <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 bg-black/90 border-0" showCloseButton={false}>
                    {imagePreviewUrl && (
                        <img
                            src={imagePreviewUrl}
                            alt="Prueba"
                            className="max-w-full max-h-[90vh] w-auto h-auto object-contain mx-auto"
                        />
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 text-white hover:bg-white/20"
                        onClick={() => setImagePreviewUrl(null)}
                    >
                        Cerrar
                    </Button>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
