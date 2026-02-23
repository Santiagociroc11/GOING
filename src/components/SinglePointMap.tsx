"use client";

import { useEffect, useRef, useState } from "react";
import { PICKUP_ICON_HTML, DROPOFF_ICON_HTML } from "@/components/map-icons";

type Props = {
    coords: [number, number]; // [lng, lat] GeoJSON
    variant?: "pickup" | "dropoff";
    className?: string;
    height?: number;
};

export function SinglePointMap({
    coords,
    variant = "pickup",
    className = "",
    height = 160,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<{ map: any } | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || !containerRef.current || typeof window === "undefined") return;

        const init = async () => {
            const L = (await import("leaflet")).default;

            if (!containerRef.current) return;
            const el = containerRef.current;
            if (mapRef.current) {
                mapRef.current.map.remove();
                mapRef.current = null;
            }

            const [lng, lat] = coords;
            const latLng: [number, number] = [lat, lng];

            const map = L.map(el, { zoomControl: false, attributionControl: false }).setView(latLng, 16);
            L.control.zoom({ position: "topright" }).addTo(map);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap",
            }).addTo(map);

            const isPickup = variant === "pickup";
            const icon = L.divIcon({
                className: "custom-marker",
                html: isPickup ? PICKUP_ICON_HTML : DROPOFF_ICON_HTML,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
            });
            L.marker(latLng, { icon }).addTo(map);

            mapRef.current = { map };
        };

        init();
        return () => {
            if (mapRef.current) {
                mapRef.current.map.remove();
                mapRef.current = null;
            }
        };
    }, [mounted, coords.join(","), variant]);

    if (!mounted) {
        return (
            <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ height }}>
                <span className="text-sm text-gray-500">Cargando mapa...</span>
            </div>
        );
    }

    return (
        <div className={className}>
            <div ref={containerRef} className="rounded-lg overflow-hidden border border-gray-200" style={{ height }} />
            <p className="text-xs text-gray-500 mt-1">Confirma que el punto en el mapa coincida con la dirección.</p>
        </div>
    );
}
