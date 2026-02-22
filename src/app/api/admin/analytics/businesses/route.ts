import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const businesses = await User.find({ role: "BUSINESS" })
        .select("name email city businessDetails createdAt")
        .lean();

    const stats = await Order.aggregate([
        { $match: { status: "DELIVERED" } },
        {
            $group: {
                _id: "$businessId",
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: "$price" },
                lastOrder: { $max: "$createdAt" },
            },
        },
    ]);

    const statsMap = Object.fromEntries(
        stats.map((s) => [s._id.toString(), s])
    );

    const result = businesses.map((b: any) => {
        const s = statsMap[b._id.toString()] || {
            totalOrders: 0,
            totalSpent: 0,
            lastOrder: null,
        };
        return {
            _id: b._id,
            name: b.name,
            email: b.email,
            city: b.city,
            companyName: b.businessDetails?.companyName || "—",
            totalOrders: s.totalOrders,
            totalSpent: s.totalSpent,
            lastOrder: s.lastOrder,
            createdAt: b.createdAt,
        };
    });

    return NextResponse.json(result);
}
