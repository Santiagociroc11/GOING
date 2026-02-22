import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import InAppNotification from "@/models/InAppNotification";

export async function GET(req: Request) {
    try {
        const session = await getEffectiveSession();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { searchParams } = new URL(req.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
        const unreadOnly = searchParams.get("unread") === "true";

        await dbConnect();
        const query: Record<string, unknown> = { userId };
        if (unreadOnly) query.read = false;

        const notifications = await InAppNotification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        const unreadCount = await InAppNotification.countDocuments({ userId, read: false });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error("Notifications fetch error:", error);
        return NextResponse.json({ message: "Error al obtener notificaciones" }, { status: 500 });
    }
}
