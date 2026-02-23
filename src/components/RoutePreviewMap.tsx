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

            const map = L.map(el, { zoomControl: false }).setView(pickupLatLng, 13);
            L.control.zoom({ position: "topright" }).addTo(map);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap",
            }).addTo(map);

            const pickupIcon = L.divIcon({
                className: "custom-marker",
                html: '<div style="background:#f97316;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
                iconSize: [14, 14],
                iconAnchor: [7, 7],
            });
            L.marker(pickupLatLng, { icon: pickupIcon }).addTo(map);

            const dropoffIcon = L.divIcon({
                className: "custom-marker",
                html: '<div style="background:#22c55e;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
                iconSize: [14, 14],
                iconAnchor: [7, 7],
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
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Recogida</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Entrega</span>
            </div>
        </div>
    );
}
