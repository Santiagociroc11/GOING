"use client";

import { useEffect, useRef } from "react";

const INTERVAL_MS = 20_000;

function sendLocation(orderId: string, lat: number, lng: number) {
    fetch(`/api/orders/${orderId}/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lat, lng }),
    }).catch(() => {});
}

export function useDriverLocationSender(orderIds: string[]) {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (orderIds.length === 0) return;
        if (!navigator?.geolocation) return;

        const tick = () => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    orderIds.forEach((id) => sendLocation(id, latitude, longitude));
                },
                () => {},
                { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 }
            );
        };

        tick();
        intervalRef.current = setInterval(tick, INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [orderIds.join(",")]);
}
