const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

export async function geocodeAddress(
    address: string,
    city?: string,
    country = "co"
): Promise<[number, number] | null> {
    if (!MAPBOX_TOKEN) return null;

    const query = city ? `${address}, ${city}, Colombia` : `${address}, Colombia`;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=${country}&limit=1`;

    try {
        const res = await fetch(url);
        const data = (await res.json()) as { features?: { center: [number, number] }[] };
        const center = data.features?.[0]?.center;
        if (center && Array.isArray(center) && center.length >= 2) {
            return [center[0], center[1]]; // [lng, lat] GeoJSON
        }
    } catch {
        // ignore
    }
    return null;
}
