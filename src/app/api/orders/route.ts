import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Rate from "@/models/Rate";
import User from "@/models/User";
import { deductBusinessBalance } from "@/lib/wallet";

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

        let query = {};
        if (role === "BUSINESS") {
            query = { businessId: userId };
        } else if (role === "DRIVER") {
            // Driver fetching their own history
            query = { driverId: userId };
        } else if (role === "ADMIN") {
            // Admin sees everything
            query = {};
        }

        // Sort by recent first, populate driver for business/admin
        const orders = await Order.find(query)
            .populate("driverId", "name email driverDetails")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching orders" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
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

        // Calculate price
        let distanceKm = getDistanceFromLatLonInKm(
            pickupInfo.coordinates[1], pickupInfo.coordinates[0],
            dropoffInfo.coordinates[1], dropoffInfo.coordinates[0]
        );

        const price = Number((rate.basePrice + (distanceKm * rate.pricePerKm)).toFixed(2));

        const newOrder = new Order({
            businessId: userId,
            city,
            status: "PENDING",
            pickupInfo: {
                ...pickupInfo,
                coordinates: { type: "Point", coordinates: pickupInfo.coordinates }
            },
            dropoffInfo: {
                ...dropoffInfo,
                coordinates: { type: "Point", coordinates: dropoffInfo.coordinates }
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
        return NextResponse.json(newOrder, { status: 201 });
    } catch (error: any) {
        console.error("Order creation error:", error);
        return NextResponse.json({ message: "Error creating order" }, { status: 500 });
    }
}
