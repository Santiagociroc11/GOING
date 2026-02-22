import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { sendPushToUser } from "@/lib/push";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getEffectiveSession();
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        const validStatuses = ["PENDING", "ACCEPTED", "PICKED_UP", "DELIVERED", "CANCELLED"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ message: "Invalid status" }, { status: 400 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const role = (session.user as any).role;

        const order = await Order.findById(id);
        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        // Role-specific authorization checks
        if (role === "DRIVER") {
            // Driver is accepting an open order - use atomic update to prevent race condition
            if (status === "ACCEPTED" && order.status === "PENDING" && !order.driverId) {
                const updated = await Order.findOneAndUpdate(
                    { _id: id, status: "PENDING", driverId: null },
                    { $set: { driverId: userId, status: "ACCEPTED" } },
                    { new: true }
                );
                if (!updated) {
                    return NextResponse.json({ message: "El pedido ya fue aceptado por otro conductor" }, { status: 409 });
                }
                sendPushToUser(updated.businessId.toString(), {
                    title: "Pedido aceptado",
                    body: `Un domiciliario tomó tu pedido #${updated._id.toString().slice(-6).toUpperCase()}`,
                    url: "/dashboard/business/orders",
                }).catch(() => {});
                return NextResponse.json({ message: "Status updated", order: updated });
            }
            // Driver is updating their accepted order
            if (order.driverId?.toString() === userId) {
                order.status = status;
            } else {
                return NextResponse.json({ message: "Unauthorized or order already taken" }, { status: 403 });
            }
        } else if (role === "BUSINESS") {
            // Businesses can only cancel their own orders if not picked up yet
            if (order.businessId.toString() !== userId) {
                return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
            }
            if (status === "CANCELLED" && ["PENDING", "ACCEPTED"].includes(order.status)) {
                order.status = "CANCELLED";
            } else {
                return NextResponse.json({ message: "Cannot change to this status" }, { status: 400 });
            }
        } else if (role === "ADMIN") {
            order.status = status;
            if (status === "PENDING") order.driverId = undefined; // Liberar conductor
        }

        await order.save();

        const shortId = order._id.toString().slice(-6).toUpperCase();
        if (status === "PICKED_UP" && order.businessId) {
            sendPushToUser(order.businessId.toString(), {
                title: "Pedido en camino",
                body: `Tu pedido #${shortId} está siendo entregado`,
                url: "/dashboard/business/orders",
            }).catch(() => {});
        }
        if (status === "DELIVERED" && order.businessId) {
            sendPushToUser(order.businessId.toString(), {
                title: "Pedido entregado",
                body: `Tu pedido #${shortId} fue entregado`,
                url: "/dashboard/business/orders",
            }).catch(() => {});
        }
        if (status === "CANCELLED") {
            if (order.businessId) {
                sendPushToUser(order.businessId.toString(), {
                    title: "Pedido cancelado",
                    body: `El pedido #${shortId} fue cancelado`,
                    url: "/dashboard/business/orders",
                }).catch(() => {});
            }
            if (order.driverId) {
                sendPushToUser(order.driverId.toString(), {
                    title: "Pedido cancelado",
                    body: `El pedido #${shortId} fue cancelado`,
                    url: "/dashboard/driver/orders",
                }).catch(() => {});
            }
        }

        return NextResponse.json({ message: "Status updated", order });
    } catch (error) {
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
