import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getEffectiveSession();
    if (!session?.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const lat = typeof body.lat === "number" ? body.lat : parseFloat(body.lat);
    const lng = typeof body.lng === "number" ? body.lng : parseFloat(body.lng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return NextResponse.json({ message: "Coordenadas inválidas" }, { status: 400 });
    }

    await dbConnect();
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ message: "Pedido no encontrado" }, { status: 404 });
    if (order.driverId?.toString() !== (session.user as any).id) {
        return NextResponse.json({ message: "No eres el domiciliario de este pedido" }, { status: 403 });
    }
    if (!["ACCEPTED", "PICKED_UP"].includes(order.status)) {
        return NextResponse.json({ message: "El pedido no está en curso" }, { status: 400 });
    }

    const now = new Date();
    order.lastDriverLocation = { lat, lng, updatedAt: now };
    await order.save();

    return NextResponse.json({ ok: true });
}
