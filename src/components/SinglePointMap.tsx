"use client";

import { useEffect, useRef, useState } from "react";

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
            const pickupHtml = '<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:#f97316;border-radius:8px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/></svg></div>';
            const dropoffHtml = '<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:#22c55e;border-radius:8px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>';
            const icon = L.divIcon({
                className: "custom-marker",
                html: isPickup ? pickupHtml : dropoffHtml,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
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
