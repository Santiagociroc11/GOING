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
    const drivers = await User.find({ role: "DRIVER" })
        .select("name email city driverDetails createdAt")
        .lean();

    const stats = await Order.aggregate([
        { $match: { status: "DELIVERED", driverId: { $ne: null } } },
        {
            $group: {
                _id: "$driverId",
                totalDeliveries: { $sum: 1 },
                totalEarned: { $sum: "$price" },
                lastDelivery: { $max: "$createdAt" },
            },
        },
    ]);

    const statsMap = Object.fromEntries(
        stats.map((s) => [s._id.toString(), s])
    );

    const result = drivers.map((d: any) => {
        const s = statsMap[d._id.toString()] || {
            totalDeliveries: 0,
            totalEarned: 0,
            lastDelivery: null,
        };
        return {
            _id: d._id,
            name: d.name,
            email: d.email,
            city: d.city,
            vehicleType: d.driverDetails?.vehicleType || "—",
            licensePlate: d.driverDetails?.licensePlate || "—",
            totalDeliveries: s.totalDeliveries,
            totalEarned: s.totalEarned,
            lastDelivery: s.lastDelivery,
            createdAt: d.createdAt,
        };
    });

    return NextResponse.json(result);
}
