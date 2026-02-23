/**
 * Distancia en metros entre dos puntos (Haversine).
 * @param lat1 Latitud punto 1
 * @param lon1 Longitud punto 1
 * @param lat2 Latitud punto 2
 * @param lon2 Longitud punto 2
 */
export function getDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export const PICKUP_DELIVERY_RADIUS_METERS = 50;
