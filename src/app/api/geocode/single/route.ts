import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { geocodeAddress } from "@/lib/geocode";

export async function POST(req: Request) {
    const session = await getEffectiveSession();
    if (!session?.user || (session.user as any).role !== "BUSINESS") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { address } = body;
    if (!address || typeof address !== "string" || address.length < 5) {
        return NextResponse.json({ message: "Dirección requerida (mín. 5 caracteres)" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById((session.user as any).id).select("city").lean();
    if (!user) return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });

    const city = (user as any).city?.toUpperCase() || "";
    const coords = await geocodeAddress(address, city);

    if (!coords) {
        return NextResponse.json({ message: "No se pudo ubicar la dirección" }, { status: 400 });
    }

    return NextResponse.json({
        coords: [coords[0], coords[1]] as [number, number],
    });
}
