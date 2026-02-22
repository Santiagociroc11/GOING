import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import InAppNotification from "@/models/InAppNotification";

export async function POST() {
    try {
        const session = await getEffectiveSession();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        await dbConnect();
        await InAppNotification.updateMany({ userId }, { $set: { read: true } });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Mark all read error:", error);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}
