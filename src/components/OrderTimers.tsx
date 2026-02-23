"use client";

import { useState, useEffect } from "react";
import { Clock, Truck, PackageCheck } from "lucide-react";
import { getDistanceMeters } from "@/lib/geo";

const MIN_PER_KM = 4; // ~15 km/h en ciudad

function formatElapsed(ms: number): string {
    if (ms < 0) return "0 min";
    const totalMin = Math.floor(ms / 60000);
    if (totalMin < 60) return `${totalMin} min`;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function formatCountdown(ms: number): string {
    if (ms <= 0) return "Llegando";
    const totalMin = Math.ceil(ms / 60000);
    if (totalMin <= 1) return "~1 min";
    return `~${totalMin} min`;
}

type Order = {
    status: string;
    createdAt: string;
    acceptedAt?: string;
    pickedUpAt?: string;
    deliveredAt?: string;
    lastDriverLocation?: { lat: number; lng: number } | null;
    pickupInfo?: { coordinates?: { coordinates?: [number, number] } };
    dropoffInfo?: { coordinates?: { coordinates?: [number, number] } };
};

export function OrderTimers({ order }: { order: Order }) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    const created = new Date(order.createdAt).getTime();
    const elapsedSinceCreated = now - created;

    const acceptedAt = order.acceptedAt ? new Date(order.acceptedAt).getTime() : null;
    const pickedUpAt = order.pickedUpAt ? new Date(order.pickedUpAt).getTime() : null;
    const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt).getTime() : null;

    const elapsedSincePickedUp = pickedUpAt ? now - pickedUpAt : null;
    const elapsedSinceDelivered = deliveredAt ? now - deliveredAt : null;

    const pickupCoords = (order.pickupInfo as any)?.coordinates?.coordinates;
    const dropoffCoords = (order.dropoffInfo as any)?.coordinates?.coordinates;
    const driverLoc = order.lastDriverLocation;

    let etaPickupMin: number | null = null;
    let etaDeliveryMin: number | null = null;

    if (driverLoc && Array.isArray(pickupCoords) && pickupCoords.length >= 2 && ["PENDING", "ACCEPTED"].includes(order.status)) {
        const distM = getDistanceMeters(driverLoc.lat, driverLoc.lng, pickupCoords[1], pickupCoords[0]);
        etaPickupMin = Math.ceil((distM / 1000) * MIN_PER_KM);
    }
    if (driverLoc && Array.isArray(dropoffCoords) && dropoffCoords.length >= 2 && order.status === "PICKED_UP") {
        const distM = getDistanceMeters(driverLoc.lat, driverLoc.lng, dropoffCoords[1], dropoffCoords[0]);
        etaDeliveryMin = Math.ceil((distM / 1000) * MIN_PER_KM);
    }

    return (
        <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4 text-orange-500 shrink-0" />
                <span>Pedido creado hace <strong>{formatElapsed(elapsedSinceCreated)}</strong></span>
            </div>

            {pickedUpAt && (
                <div className="flex items-center gap-2 text-gray-600">
                    <PackageCheck className="h-4 w-4 text-orange-500 shrink-0" />
                    <span>Recogido hace <strong>{formatElapsed(elapsedSincePickedUp ?? 0)}</strong></span>
                </div>
            )}

            {deliveredAt && (
                <div className="flex items-center gap-2 text-gray-600">
                    <Truck className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Entregado hace <strong>{formatElapsed(elapsedSinceDelivered ?? 0)}</strong></span>
                </div>
            )}

            {etaPickupMin != null && order.status === "ACCEPTED" && (
                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
                    <Truck className="h-4 w-4 shrink-0" />
                    <span>Llegada estimada a recoger: <strong>{etaPickupMin <= 1 ? "~1 min" : `~${etaPickupMin} min`}</strong></span>
                </div>
            )}

            {etaDeliveryMin != null && order.status === "PICKED_UP" && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                    <Truck className="h-4 w-4 shrink-0" />
                    <span>Entrega estimada: <strong>{etaDeliveryMin <= 1 ? "~1 min" : `~${etaDeliveryMin} min`}</strong></span>
                </div>
            )}

            {order.status === "PENDING" && (
                <p className="text-gray-500 text-xs">Esperando que un domiciliario acepte el pedido.</p>
            )}
        </div>
    );
}
