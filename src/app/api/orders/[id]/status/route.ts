import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        const validStatuses = ["ACCEPTED", "PICKED_UP", "DELIVERED", "CANCELLED"];
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
            order.status = status; // Admin can do anything
        }

        await order.save();
        return NextResponse.json({ message: "Status updated", order });
    } catch (error) {
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
