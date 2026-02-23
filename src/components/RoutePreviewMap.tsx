"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
    pickupCoords: [number, number]; // [lng, lat] GeoJSON
    dropoffCoords: [number, number]; // [lng, lat] GeoJSON
    className?: string;
    height?: number;
};

export function RoutePreviewMap({
    pickupCoords,
    dropoffCoords,
    className = "",
    height = 200,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<{ map: any; polyline?: any } | null>(null);
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
                if (mapRef.current.polyline) mapRef.current.polyline.remove();
                mapRef.current.map.remove();
                mapRef.current = null;
            }

            const [pickupLng, pickupLat] = pickupCoords;
            const [dropoffLng, dropoffLat] = dropoffCoords;

            const pickupLatLng: [number, number] = [pickupLat, pickupLng];
            const dropoffLatLng: [number, number] = [dropoffLat, dropoffLng];

            const map = L.map(el, { zoomControl: false, attributionControl: false }).setView(pickupLatLng, 13);
            L.control.zoom({ position: "topright" }).addTo(map);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap",
            }).addTo(map);

            const pickupIcon = L.divIcon({
                className: "custom-marker",
                html: '<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:#f97316;border-radius:8px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/></svg></div>',
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            });
            L.marker(pickupLatLng, { icon: pickupIcon }).addTo(map);

            const dropoffIcon = L.divIcon({
                className: "custom-marker",
                html: '<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:#22c55e;border-radius:8px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>',
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            });
            L.marker(dropoffLatLng, { icon: dropoffIcon }).addTo(map);

            const polyline = L.polyline([pickupLatLng, dropoffLatLng], {
                color: "#f97316",
                weight: 4,
                opacity: 0.8,
            }).addTo(map);

            const bounds = L.latLngBounds([pickupLatLng, dropoffLatLng]);
            map.fitBounds(bounds.pad(0.15));

            mapRef.current = { map, polyline };
        };

        init();
        return () => {
            if (mapRef.current) {
                if (mapRef.current.polyline) mapRef.current.polyline.remove();
                mapRef.current.map.remove();
                mapRef.current = null;
            }
        };
    }, [mounted, pickupCoords.join(","), dropoffCoords.join(",")]);

    if (!mounted) {
        return (
            <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ height }}>
                <span className="text-sm text-gray-500">Cargando mapa...</span>
            </div>
        );
    }

    return (
        <div className={className}>
            <div ref={containerRef} className="rounded-lg overflow-hidden border border-orange-200" style={{ height }} />
            <div className="flex gap-4 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-orange-500 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/></svg></span> Recogida</span>
                <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-green-500 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></span> Entrega</span>
            </div>
        </div>
    );
}
