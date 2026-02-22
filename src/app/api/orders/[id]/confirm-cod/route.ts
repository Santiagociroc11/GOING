import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getEffectiveSession();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const userId = (session.user as any).id;
        const role = (session.user as any).role;

        await dbConnect();
        const order = await Order.findById(id);
        if (!order) {
            return NextResponse.json({ message: "Pedido no encontrado" }, { status: 404 });
        }

        if (order.businessId.toString() !== userId && role !== "ADMIN") {
            return NextResponse.json({ message: "No autorizado" }, { status: 403 });
        }

        if (order.paymentMethod !== "COD") {
            return NextResponse.json({ message: "Este pedido no es contraentrega" }, { status: 400 });
        }

        if (order.status !== "DELIVERED") {
            return NextResponse.json({ message: "Solo se puede confirmar recaudo en pedidos entregados" }, { status: 400 });
        }

        if (order.codCollectedAt) {
            return NextResponse.json({ message: "Recaudo ya confirmado" }, { status: 400 });
        }

        order.codCollectedAt = new Date();
        await order.save();

        return NextResponse.json({ message: "Recaudo confirmado", order });
    } catch (error) {
        console.error("Confirm COD error:", error);
        return NextResponse.json({ message: "Error al confirmar" }, { status: 500 });
    }
}
