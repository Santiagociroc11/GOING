import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";

export async function GET() {
    try {
        const session = await getEffectiveSession();
        const userId = (session?.user as { id?: string })?.id;
        if (!userId) {
            return NextResponse.json({ subscribed: false, reason: "no_session" });
        }

        await dbConnect();
        const subs = await PushSubscription.find({ userId })
            .select("endpoint userAgent createdAt")
            .lean();

        return NextResponse.json({
            subscribed: subs.length > 0,
            count: subs.length,
            subscriptions: subs.map((s) => ({
                endpoint: (s as any).endpoint?.slice(0, 60) + "...",
                userAgent: (s as any).userAgent?.slice(0, 80),
                createdAt: (s as any).createdAt,
            })),
        });
    } catch (error) {
        console.error("[Push] check error:", error);
        return NextResponse.json({ subscribed: false, reason: "error" }, { status: 500 });
    }
}
