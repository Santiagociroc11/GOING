import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Rate from "@/models/Rate";
import User from "@/models/User";
import { deductBusinessBalance } from "@/lib/wallet";
import { sendPushToUsersIfEnabled } from "@/lib/push";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { geocodeAddress } from "@/lib/geocode";

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

export async function GET(req: Request) {
    try {
        const session = await getEffectiveSession();
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const role = (session.user as any).role;

        let query: Record<string, unknown> = {};
        if (role === "BUSINESS") {
            query = { businessId: userId };
        } else if (role === "DRIVER") {
            query = { driverId: userId };
        } else if (role === "ADMIN") {
            query = {};
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(50, Math.max(10, parseInt(searchParams.get("limit") || "20", 10)));
        const skip = (page - 1) * limit;

        const populateDriver = { path: "driverId", select: "name email driverDetails" };
        const populateBusiness = { path: "businessId", select: "name email businessDetails" };
        const [ordersRaw, total] = await Promise.all([
            Order.find(query)
                .populate(populateDriver)
                .populate(populateBusiness)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(query),
        ]);

        const Rating = (await import("@/models/Rating")).default;
        const orderIds = ordersRaw.map((o: any) => o._id);
        const myRatings = await Rating.find({ orderId: { $in: orderIds }, fromUserId: userId }).select("orderId").lean();
        const ratedSet = new Set(myRatings.map((r: any) => r.orderId.toString()));

        const orders = ordersRaw.map((o: any) => ({
            ...o,
            hasRated: ratedSet.has(o._id.toString()),
        }));

        return NextResponse.json({
            orders,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total },
        });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching orders" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const id = getClientIdentifier(req);
        const { ok } = rateLimit(`orders:${id}`);
        if (!ok) {
            return NextResponse.json({ message: "Demasiadas solicitudes. Intenta en un minuto." }, { status: 429 });
        }

        const session = await getEffectiveSession();
        if (!session || (session.user as any).role !== "BUSINESS") {
            return NextResponse.json({ message: "Unauthorized. Only businesses can create orders." }, { status: 401 });
        }

        const body = await req.json();
        const { pickupInfo, dropoffInfo, details, paymentMethod = "PREPAID", productValue } = body;

        if (!pickupInfo || !dropoffInfo || !details) {
            return NextResponse.json({ message: "Missing order details" }, { status: 400 });
        }

        if (paymentMethod === "COD" && (productValue == null || productValue < 0)) {
            return NextResponse.json(
                { message: "Para recaudo contraentrega debes indicar el valor del producto" },
                { status: 400 }
            );
        }

        await dbConnect();
        const userId = (session.user as any).id;

        // Get the business's city from their user profile
        const businessUser = await User.findById(userId);
        if (!businessUser) {
            return NextResponse.json({ message: "Business user not found" }, { status: 404 });
        }

        const city = businessUser.city.toUpperCase();

        // Find the rate for this city
        const rate = await Rate.findOne({ city });
        if (!rate) {
            return NextResponse.json({ message: `No rate configured for city: ${city}. Please contact Admin.` }, { status: 400 });
        }

        // Geocode addresses (Mapbox). Añade ciudad para mejorar precisión en pueblos.
        const pickupCoords = pickupInfo.coordinates ?? await geocodeAddress(pickupInfo.address, city);
        const dropoffCoords = dropoffInfo.coordinates ?? await geocodeAddress(dropoffInfo.address, city);

        if (!pickupCoords) {
            return NextResponse.json(
                { message: `No se pudo ubicar la dirección de recogida. Intenta incluir el nombre del pueblo/ciudad (ej: "${pickupInfo.address}, ${city}").` },
                { status: 400 }
            );
        }
        if (!dropoffCoords) {
            return NextResponse.json(
                { message: `No se pudo ubicar la dirección de entrega. Intenta incluir el nombre del pueblo/ciudad (ej: "${dropoffInfo.address}, ${city}").` },
                { status: 400 }
            );
        }

        const distanceKm = getDistanceFromLatLonInKm(
            pickupCoords[1], pickupCoords[0],
            dropoffCoords[1], dropoffCoords[0]
        );

        const price = Number((rate.basePrice + (distanceKm * rate.pricePerKm)).toFixed(2));

        const newOrder = new Order({
            businessId: userId,
            city,
            status: "PENDING",
            pickupInfo: {
                ...pickupInfo,
                coordinates: { type: "Point", coordinates: pickupCoords }
            },
            dropoffInfo: {
                ...dropoffInfo,
                coordinates: { type: "Point", coordinates: dropoffCoords }
            },
            price,
            details,
            paymentMethod: paymentMethod === "COD" ? "COD" : "PREPAID",
            productValue: paymentMethod === "COD" ? Number(productValue) : undefined,
        });

        // Validar y deducir saldo (prepago) antes de guardar
        const deductResult = await deductBusinessBalance(userId, price, newOrder._id);
        if (!deductResult.ok) {
            return NextResponse.json({ message: deductResult.message }, { status: 400 });
        }

        await newOrder.save();

        // Notificar a domiciliarios en la misma ciudad
        const driversInCity = await User.find({ role: "DRIVER", city: { $regex: new RegExp(`^${city}$`, "i") }, active: true })
            .select("_id")
            .lean();
        const driverIds = driversInCity.map((d) => d._id.toString());
        const shortId = newOrder._id.toString().slice(-6).toUpperCase();
        sendPushToUsersIfEnabled("driverNewOrder", driverIds, {
            title: "Nuevo pedido disponible",
            body: `Pedido #${shortId} en ${city}. Revisa el feed de pedidos.`,
            url: "/dashboard/driver/feed",
        }).catch(() => {});

        return NextResponse.json(newOrder, { status: 201 });
    } catch (error: any) {
        console.error("Order creation error:", error);
        return NextResponse.json({ message: "Error creating order" }, { status: 500 });
    }
}
