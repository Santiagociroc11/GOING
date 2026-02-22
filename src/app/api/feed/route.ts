import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "DRIVER") {
            return NextResponse.json({ message: "Unauthorized. Only drivers can access the feed." }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;

        // Get the driver's configured city
        const driverUser = await User.findById(userId);
        if (!driverUser) {
            return NextResponse.json({ message: "Driver not found" }, { status: 404 });
        }

        // Find all PENDING orders in the driver's city where driverId is null
        const pendingOrders = await Order.find({
            city: driverUser.city.toUpperCase(),
            status: "PENDING",
            driverId: null
        }).sort({ createdAt: -1 });

        return NextResponse.json(pendingOrders);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching feed" }, { status: 500 });
    }
}
