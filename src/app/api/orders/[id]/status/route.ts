import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { sendPushIfEnabled } from "@/lib/push";
import {
    creditOrderPayment,
    refundBusinessBalance,
    wasDriverPaid,
    wasOrderRefunded,
} from "@/lib/wallet";
import { getDistanceMeters, PICKUP_DELIVERY_RADIUS_METERS } from "@/lib/geo";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getEffectiveSession();
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status, pickupProofUrl, deliveryProofUrl, codCollected, driverLat, driverLng } = body;

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
                const now = new Date();
                const updated = await Order.findOneAndUpdate(
                    { _id: id, status: "PENDING", driverId: null },
                    { $set: { driverId: userId, status: "ACCEPTED", acceptedAt: now } },
                    { returnDocument: "after" }
                );
                if (!updated) {
                    return NextResponse.json({ message: "El pedido ya fue aceptado por otro conductor" }, { status: 409 });
                }
                sendPushIfEnabled("businessOrderAccepted", updated.businessId.toString(), {
                    title: "Pedido aceptado",
                    body: `Un domiciliario tomó tu pedido #${updated._id.toString().slice(-6).toUpperCase()}`,
                    url: "/dashboard/business/orders",
                }).catch(() => {});
                return NextResponse.json({ message: "Status updated", order: updated });
            }
            // Driver is updating their accepted order - require proofs + geolocation
            if (order.driverId?.toString() === userId) {
                const lat = typeof driverLat === "number" ? driverLat : null;
                const lng = typeof driverLng === "number" ? driverLng : null;

                if (status === "PICKED_UP") {
                    if (!pickupProofUrl || typeof pickupProofUrl !== "string") {
                        return NextResponse.json(
                            { message: "Debes subir una foto de prueba de recogida" },
                            { status: 400 }
                        );
                    }
                    const pickupCoords = (order.pickupInfo as any)?.coordinates?.coordinates;
                    if (Array.isArray(pickupCoords) && pickupCoords.length >= 2) {
                        if (lat == null || lng == null) {
                            return NextResponse.json(
                                { message: "Activa la ubicación para marcar la recogida" },
                                { status: 400 }
                            );
                        }
                        const dist = getDistanceMeters(lat, lng, pickupCoords[1], pickupCoords[0]);
                        if (dist > PICKUP_DELIVERY_RADIUS_METERS) {
                            return NextResponse.json(
                                { message: `Debes estar a menos de ${PICKUP_DELIVERY_RADIUS_METERS}m del punto de recogida. Distancia: ~${Math.round(dist)}m` },
                                { status: 400 }
                            );
                        }
                    }
                    order.pickupProofUrl = pickupProofUrl;
                }
                if (status === "DELIVERED") {
                    if (!deliveryProofUrl || typeof deliveryProofUrl !== "string") {
                        return NextResponse.json(
                            { message: "Debes subir una foto de prueba de entrega" },
                            { status: 400 }
                        );
                    }
                    const dropoffCoords = (order.dropoffInfo as any)?.coordinates?.coordinates;
                    if (Array.isArray(dropoffCoords) && dropoffCoords.length >= 2) {
                        if (lat == null || lng == null) {
                            return NextResponse.json(
                                { message: "Activa la ubicación para marcar la entrega" },
                                { status: 400 }
                            );
                        }
                        const dist = getDistanceMeters(lat, lng, dropoffCoords[1], dropoffCoords[0]);
                        if (dist > PICKUP_DELIVERY_RADIUS_METERS) {
                            return NextResponse.json(
                                { message: `Debes estar a menos de ${PICKUP_DELIVERY_RADIUS_METERS}m del punto de entrega. Distancia: ~${Math.round(dist)}m` },
                                { status: 400 }
                            );
                        }
                    }
                    order.deliveryProofUrl = deliveryProofUrl;
                }
                const now = new Date();
                if (status === "PICKED_UP") order.pickedUpAt = now;
                if (status === "DELIVERED") order.deliveredAt = now;
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

        // Flujo de saldo: acreditar domiciliario al entregar, devolver al negocio al cancelar
        if (status === "DELIVERED" && order.driverId) {
            const alreadyPaid = await wasDriverPaid(order._id);
            if (!alreadyPaid) {
                await creditOrderPayment(order.driverId, order.price, order._id);
            }
        }
        if (status === "CANCELLED") {
            const alreadyRefunded = await wasOrderRefunded(order._id);
            if (!alreadyRefunded) {
                await refundBusinessBalance(order.businessId, order.price, order._id);
            }
        }

        const shortId = order._id.toString().slice(-6).toUpperCase();
        if (status === "PICKED_UP" && order.businessId) {
            sendPushIfEnabled("businessOrderPickedUp", order.businessId.toString(), {
                title: "Pedido en camino",
                body: `Tu pedido #${shortId} está siendo entregado`,
                url: "/dashboard/business/orders",
            }).catch(() => {});
        }
        if (status === "DELIVERED" && order.businessId) {
            sendPushIfEnabled("businessOrderDelivered", order.businessId.toString(), {
                title: "Pedido entregado",
                body: `Tu pedido #${shortId} fue entregado`,
                url: "/dashboard/business/orders",
            }).catch(() => {});
        }
        if (status === "CANCELLED") {
            if (order.businessId) {
                sendPushIfEnabled("businessOrderCancelled", order.businessId.toString(), {
                    title: "Pedido cancelado",
                    body: `El pedido #${shortId} fue cancelado`,
                    url: "/dashboard/business/orders",
                }).catch(() => {});
            }
            if (order.driverId) {
                sendPushIfEnabled("driverOrderCancelled", order.driverId.toString(), {
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
