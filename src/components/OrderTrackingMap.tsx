"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
    pickupCoords: [number, number]; // [lng, lat] GeoJSON
    dropoffCoords: [number, number]; // [lng, lat] GeoJSON
    driverLocation?: { lat: number; lng: number } | null;
    className?: string;
    height?: number;
    showExpand?: boolean;
    onExpand?: () => void;
};

export function OrderTrackingMap({
    pickupCoords,
    dropoffCoords,
    driverLocation,
    className = "",
    height = 160,
    showExpand = true,
    onExpand,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<{ map: any; markers: any[] } | null>(null);
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

            const [pickupLng, pickupLat] = pickupCoords;
            const [dropoffLng, dropoffLat] = dropoffCoords;

            const pickupLatLng: [number, number] = [pickupLat, pickupLng];
            const dropoffLatLng: [number, number] = [dropoffLat, dropoffLng];

            const map = L.map(el, { zoomControl: false }).setView(pickupLatLng, 13);
            L.control.zoom({ position: "topright" }).addTo(map);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap",
            }).addTo(map);

            const markers: any[] = [];

            const pickupIcon = L.divIcon({
                className: "custom-marker",
                html: '<div style="background:#f97316;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
                iconSize: [14, 14],
                iconAnchor: [7, 7],
            });
            markers.push(L.marker(pickupLatLng, { icon: pickupIcon }).addTo(map));

            const dropoffIcon = L.divIcon({
                className: "custom-marker",
                html: '<div style="background:#22c55e;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
                iconSize: [14, 14],
                iconAnchor: [7, 7],
            });
            markers.push(L.marker(dropoffLatLng, { icon: dropoffIcon }).addTo(map));

            let driverMarker: any = null;
            if (driverLocation) {
                const driverIcon = L.divIcon({
                    className: "custom-marker",
                    html: '<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);animation:pulse 1.5s infinite"></div>',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8],
                });
                driverMarker = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon }).addTo(map);
                markers.push(driverMarker);
            }

            const allPoints: [number, number][] = [pickupLatLng, dropoffLatLng];
            if (driverLocation) allPoints.push([driverLocation.lat, driverLocation.lng]);
            const bounds = L.latLngBounds(allPoints);
            map.fitBounds(bounds.pad(0.2));

            mapRef.current = { map, markers };
        };

        init();
        return () => {
            if (mapRef.current) {
                mapRef.current.map.remove();
                mapRef.current = null;
            }
        };
    }, [mounted, pickupCoords.join(","), dropoffCoords.join(","), driverLocation?.lat, driverLocation?.lng]);

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
            <div className="flex gap-4 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Recogida</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Entrega</span>
                {driverLocation && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Domiciliario</span>}
            </div>
            {showExpand && onExpand && (
                <button
                    type="button"
                    onClick={onExpand}
                    className="mt-2 text-sm text-orange-600 hover:underline font-medium"
                >
                    Ver mapa en grande
                </button>
            )}
        </div>
    );
}
