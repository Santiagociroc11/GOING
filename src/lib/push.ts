import webPush from "web-push";
import dbConnect from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";

const vapidPublic = process.env.VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@going.app";

if (vapidPublic && vapidPrivate) {
    webPush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
}

export type PushPayload = {
    title: string;
    body?: string;
    url?: string;
};

export async function sendPushToUser(
    userId: string,
    payload: PushPayload
): Promise<{ sent: number; failed: number }> {
    if (!vapidPublic || !vapidPrivate) return { sent: 0, failed: 0 };

    await dbConnect();
    const subs = await PushSubscription.find({ userId }).lean();
    if (subs.length === 0) return { sent: 0, failed: 0 };

    const message = JSON.stringify({
        title: payload.title,
        body: payload.body || "",
        url: payload.url || "/",
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subs) {
        try {
            await webPush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.keys.p256dh,
                        auth: sub.keys.auth,
                    },
                },
                message,
                { TTL: 86400 }
            );
            sent++;
        } catch (err: unknown) {
            failed++;
            const status = (err as { statusCode?: number })?.statusCode;
            if (status === 410 || status === 404) {
                await PushSubscription.deleteOne({ _id: sub._id });
            }
        }
    }

    return { sent, failed };
}
