import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const status = searchParams.get("status");

    await dbConnect();
    let query: Record<string, unknown> = {};
    if (city) query.city = new RegExp(city, "i");
    if (status) query.status = status;

    const orders = await Order.find(query)
        .populate("businessId", "name email businessDetails")
        .populate("driverId", "name email driverDetails")
        .sort({ createdAt: -1 })
        .lean();

    return NextResponse.json(orders);
}
