import { NextResponse } from "next/server";
import { runRemindPendingOrders } from "@/lib/cron-reminders";

function isAuthorized(req: Request): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return true;
    const auth = req.headers.get("authorization");
    return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await runRemindPendingOrders();
        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        console.error("[Cron] remind-pending-orders:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
