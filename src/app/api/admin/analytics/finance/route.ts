import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import PlatformSettings from "@/models/PlatformSettings";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    await dbConnect();
    const match: Record<string, unknown> = { status: "DELIVERED" };
    if (businessId) match.businessId = businessId;

    const movements = await Order.find(match)
        .populate("businessId", "name businessDetails")
        .populate("driverId", "name")
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();

    const summary = await Order.aggregate([
        { $match: { status: "DELIVERED" } },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$price" },
                totalOrders: { $sum: 1 },
            },
        },
    ]);

    const platform = await PlatformSettings.findOne().lean();

    return NextResponse.json({
        movements,
        summary: summary[0] || { totalRevenue: 0, totalOrders: 0 },
        platform: {
            balance: platform?.balance ?? 0,
            commissionRate: platform?.commissionRate ?? 0.3,
        },
    });
}
