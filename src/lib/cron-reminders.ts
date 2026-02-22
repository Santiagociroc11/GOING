import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import { sendPushToUsersIfEnabled } from "@/lib/push";

const MAX_REMINDERS = 5;
const FIRST_REMINDER_AFTER_MS = 1 * 60 * 1000; // 1 min
const REMINDER_INTERVAL_MS = 2 * 60 * 1000; // 2 min entre recordatorios

export async function runRemindPendingOrders(): Promise<{ remindersSent: number; checked: number }> {
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

    return { remindersSent: sent, checked: pending.length };
}
