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

            const map = L.map(el, { zoomControl: false, attributionControl: false }).setView(pickupLatLng, 13);
            L.control.zoom({ position: "topright" }).addTo(map);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap",
            }).addTo(map);

            const markers: any[] = [];

            const pickupIcon = L.divIcon({
                className: "custom-marker",
                html: '<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:#f97316;border-radius:8px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/></svg></div>',
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            });
            markers.push(L.marker(pickupLatLng, { icon: pickupIcon }).addTo(map));

            const dropoffIcon = L.divIcon({
                className: "custom-marker",
                html: '<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:#22c55e;border-radius:8px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>',
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            });
            markers.push(L.marker(dropoffLatLng, { icon: dropoffIcon }).addTo(map));

            let driverMarker: any = null;
            if (driverLocation) {
                const driverIcon = L.divIcon({
                    className: "custom-marker",
                    html: '<div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:#3b82f6;border-radius:8px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z"/><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.9 3.4c-.2.5 0 1.1.5 1.3l1.3.6"/><path d="M5 17h-2"/><path d="M19 9a2 2 0 0 0 2-2 2 2 0 0 0-2-2"/></svg></div>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
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
                <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-orange-500 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/></svg></span> Recogida</span>
                <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-green-500 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></span> Entrega</span>
                {driverLocation && <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M15 18a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z"/><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.9 3.4c-.2.5 0 1.1.5 1.3l1.3.6"/><path d="M5 17h-2"/><path d="M19 9a2 2 0 0 0 2-2 2 2 0 0 0-2-2"/></svg></span> Domiciliario</span>}
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
