import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PushDeliveryLog from "@/models/PushDeliveryLog";

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { deliveryId, status, error } = body as { deliveryId?: string; status?: string; error?: string };

        if (!deliveryId || !status) {
            return NextResponse.json({ ok: false, message: "deliveryId and status required" }, { status: 400 });
        }

        const validStatuses = ["received", "displayed", "error"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ ok: false, message: "Invalid status" }, { status: 400 });
        }

        await dbConnect();
        const update: Record<string, unknown> = { status };
        if (status === "received") update.receivedAt = new Date();
        if (status === "displayed") update.displayedAt = new Date();
        if (status === "error") {
            update.errorAt = new Date();
            update.errorMessage = error || "Unknown error";
        }

        const log = await PushDeliveryLog.findOneAndUpdate(
            { deliveryId },
            { $set: update },
            { new: true }
        );

        if (!log) {
            return NextResponse.json({ ok: false, message: "Log not found" }, { status: 404 });
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("[Push] log-delivery error:", e);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
