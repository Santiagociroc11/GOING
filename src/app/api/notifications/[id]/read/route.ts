import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import InAppNotification from "@/models/InAppNotification";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getEffectiveSession();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const userId = (session.user as any).id;

        await dbConnect();
        const n = await InAppNotification.findOneAndUpdate(
            { _id: id, userId },
            { $set: { read: true } },
            { new: true }
        );

        if (!n) {
            return NextResponse.json({ message: "Notificación no encontrada" }, { status: 404 });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Mark read error:", error);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}
