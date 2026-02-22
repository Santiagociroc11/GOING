import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Rating from "@/models/Rating";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getEffectiveSession();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { score, comment } = body;

        if (typeof score !== "number" || score < 1 || score > 5) {
            return NextResponse.json({ message: "Puntuación debe ser entre 1 y 5" }, { status: 400 });
        }

        const userId = (session.user as any).id;
        const role = (session.user as any).role;

        await dbConnect();
        const order = await Order.findById(id);
        if (!order) {
            return NextResponse.json({ message: "Pedido no encontrado" }, { status: 404 });
        }

        if (order.status !== "DELIVERED") {
            return NextResponse.json({ message: "Solo puedes calificar pedidos entregados" }, { status: 400 });
        }

        let fromUserId: string;
        let toUserId: string;
        let rateRole: "BUSINESS" | "DRIVER";

        if (role === "BUSINESS" && order.businessId.toString() === userId) {
            fromUserId = userId;
            toUserId = order.driverId?.toString() || "";
            rateRole = "BUSINESS";
        } else if (role === "DRIVER" && order.driverId?.toString() === userId) {
            fromUserId = userId;
            toUserId = order.businessId.toString();
            rateRole = "DRIVER";
        } else {
            return NextResponse.json({ message: "No autorizado para calificar este pedido" }, { status: 403 });
        }

        if (!toUserId) {
            return NextResponse.json({ message: "No hay usuario para calificar" }, { status: 400 });
        }

        const existing = await Rating.findOne({ orderId: id, fromUserId });
        if (existing) {
            return NextResponse.json({ message: "Ya calificaste este pedido" }, { status: 400 });
        }

        await Rating.create({
            orderId: id,
            fromUserId,
            toUserId,
            role: rateRole,
            score,
            comment: typeof comment === "string" ? comment.slice(0, 500) : undefined,
        });

        return NextResponse.json({ message: "Calificación guardada" });
    } catch (error) {
        console.error("Rate error:", error);
        return NextResponse.json({ message: "Error al calificar" }, { status: 500 });
    }
}
