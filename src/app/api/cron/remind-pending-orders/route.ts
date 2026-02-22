import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import { sendPushToUsersIfEnabled } from "@/lib/push";

const MAX_REMINDERS = 3;
const FIRST_REMINDER_AFTER_MS = 5 * 60 * 1000; // 5 min
const REMINDER_INTERVAL_MS = 10 * 60 * 1000; // 10 min entre recordatorios

function isAuthorized(req: Request): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return process.env.NODE_ENV !== "production";
    const auth = req.headers.get("authorization");
    return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const now = new Date();

        const pending = await Order.find({
            status: "PENDING",
            driverId: null,
        })
            .select("_id city reminderCount lastReminderAt createdAt")
            .lean();

        let sent = 0;

        for (const order of pending) {
            const createdAt = new Date((order as any).createdAt).getTime();
            const ageMs = now.getTime() - createdAt;
            const reminderCount = (order as any).reminderCount ?? 0;
            const lastReminderAt = (order as any).lastReminderAt
                ? new Date((order as any).lastReminderAt).getTime()
                : 0;

            let shouldSend = false;

            if (reminderCount === 0) {
                shouldSend = ageMs >= FIRST_REMINDER_AFTER_MS;
            } else if (reminderCount < MAX_REMINDERS) {
                const timeSinceLastReminder = now.getTime() - lastReminderAt;
                shouldSend = timeSinceLastReminder >= REMINDER_INTERVAL_MS;
            }

            if (!shouldSend) continue;

            const city = (order as any).city;
            const driversInCity = await User.find({
                role: "DRIVER",
                city: { $regex: new RegExp(`^${city}$`, "i") },
                active: true,
            })
                .select("_id")
                .lean();

            const driverIds = driversInCity.map((d) => (d as any)._id.toString());
            const shortId = (order as any)._id.toString().slice(-6).toUpperCase();

            await sendPushToUsersIfEnabled("driverNewOrder", driverIds, {
                title: "Pedido aún disponible",
                body: `Pedido #${shortId} en ${city} sigue esperando. ¡Tómalo ahora!`,
                url: "/dashboard/driver/feed",
            });

            await Order.updateOne(
                { _id: (order as any)._id },
                {
                    $set: { lastReminderAt: now },
                    $inc: { reminderCount: 1 },
                }
            );
            sent++;
        }

        return NextResponse.json({ ok: true, remindersSent: sent, checked: pending.length });
    } catch (error) {
        console.error("[Cron] remind-pending-orders:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
