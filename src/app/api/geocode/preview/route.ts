import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Rate from "@/models/Rate";
import { geocodeAddress } from "@/lib/geocode";

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export async function POST(req: Request) {
    const session = await getEffectiveSession();
    if (!session?.user || (session.user as any).role !== "BUSINESS") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { pickupAddress, dropoffAddress } = body;
    if (!pickupAddress || !dropoffAddress || typeof pickupAddress !== "string" || typeof dropoffAddress !== "string") {
        return NextResponse.json({ message: "pickupAddress y dropoffAddress requeridos" }, { status: 400 });
    }
    if (pickupAddress.length < 5 || dropoffAddress.length < 5) {
        return NextResponse.json({ message: "Direcciones muy cortas" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById((session.user as any).id).select("city").lean();
    if (!user) return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });

    const city = (user as any).city?.toUpperCase() || "";
    const pickupCoords = await geocodeAddress(pickupAddress, city);
    const dropoffCoords = await geocodeAddress(dropoffAddress, city);

    if (!pickupCoords) {
        return NextResponse.json({ message: "No se pudo ubicar la dirección de recogida" }, { status: 400 });
    }
    if (!dropoffCoords) {
        return NextResponse.json({ message: "No se pudo ubicar la dirección de entrega" }, { status: 400 });
    }

    const distanceKm = getDistanceFromLatLonInKm(
        pickupCoords[1], pickupCoords[0],
        dropoffCoords[1], dropoffCoords[0]
    );

    const rate = await Rate.findOne({ city }).lean();
    const price = rate
        ? Number((rate.basePrice + distanceKm * rate.pricePerKm).toFixed(2))
        : null;

    return NextResponse.json({
        distanceKm: Math.round(distanceKm * 10) / 10,
        price,
        city,
    });
}
