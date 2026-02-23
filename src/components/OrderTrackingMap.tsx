"use client";

import { useEffect, useRef, useState } from "react";
import { PICKUP_ICON_HTML, DROPOFF_ICON_HTML, DRIVER_ICON_HTML } from "@/components/map-icons";

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
                html: PICKUP_ICON_HTML,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
            });
            markers.push(L.marker(pickupLatLng, { icon: pickupIcon }).addTo(map));

            const dropoffIcon = L.divIcon({
                className: "custom-marker",
                html: DROPOFF_ICON_HTML,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
            });
            markers.push(L.marker(dropoffLatLng, { icon: dropoffIcon }).addTo(map));

            let driverMarker: any = null;
            if (driverLocation) {
                const driverIcon = L.divIcon({
                    className: "custom-marker",
                    html: DRIVER_ICON_HTML,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20],
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
                <span className="flex items-center gap-1.5"><span className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs">🏪</span> Recogida</span>
                <span className="flex items-center gap-1.5"><span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">🏠</span> Entrega</span>
                {driverLocation && <span className="flex items-center gap-1.5"><span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">🛵</span> Domiciliario</span>}
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
