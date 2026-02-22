import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import PushDeliveryLog from "@/models/PushDeliveryLog";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));
        const deliveryId = searchParams.get("deliveryId");

        await dbConnect();

        let query: Record<string, unknown> = {};
        if (userId) query.userId = userId;
        if (deliveryId) query.deliveryId = deliveryId;

        const logs = await PushDeliveryLog.find(query)
            .sort({ sentAt: -1 })
            .limit(limit)
            .lean();

        const userIds = [...new Set(logs.map((l) => (l as any).userId))].filter(Boolean);
        const validIds = userIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id));
        const users = validIds.length > 0 ? await User.find({ _id: { $in: validIds } })
            .select("name email role")
            .lean() : [];
        const userMap = Object.fromEntries(users.map((u: any) => [String(u._id), u]));

        const enriched = logs.map((log) => ({
            ...log,
            user: userMap[(log as any).userId]
                ? {
                    name: (userMap[(log as any).userId] as any).name,
                    email: (userMap[(log as any).userId] as any).email,
                    role: (userMap[(log as any).userId] as any).role,
                }
                : null,
        }));

        return NextResponse.json({ logs: enriched });
    } catch (error) {
        console.error("[PushLogs] Error:", error);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}
