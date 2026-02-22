import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        const [
            totalOrders,
            ordersToday,
            ordersThisWeek,
            deliveredToday,
            totalRevenue,
            activeBusinesses,
            activeDrivers,
        ] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ createdAt: { $gte: startOfToday } }),
            Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
            Order.countDocuments({ status: "DELIVERED", updatedAt: { $gte: startOfToday } }),
            WalletTransaction.aggregate([
                { $match: { type: "DRIVER_PAY" } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]).then((r) => r[0]?.total ?? 0),
            User.countDocuments({ role: "BUSINESS", active: true }),
            User.countDocuments({ role: "DRIVER", active: true }),
        ]);

        return NextResponse.json({
            totalOrders,
            ordersToday,
            ordersThisWeek,
            deliveredToday,
            totalRevenue,
            activeBusinesses,
            activeDrivers,
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json({ message: "Error al obtener estadísticas" }, { status: 500 });
    }
}
