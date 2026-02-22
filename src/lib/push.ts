import webPush from "web-push";
import dbConnect from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";
import NotificationSettings from "@/models/NotificationSettings";
import InAppNotification from "@/models/InAppNotification";
import type { NotificationType } from "@/models/NotificationSettings";

function toBase64UrlSafe(value: string): string {
    if (!value) return value;
    return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sanitizeVapidKey(key: string): string {
    return key.replace(/\s/g, "").trim();
}

const vapidPublic = process.env.VAPID_PUBLIC_KEY ? sanitizeVapidKey(process.env.VAPID_PUBLIC_KEY) : undefined;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY ? sanitizeVapidKey(process.env.VAPID_PRIVATE_KEY) : undefined;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@going.app";

if (vapidPublic && vapidPrivate) {
    webPush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
}

export type PushPayload = {
    title: string;
    body?: string;
    url?: string;
};

async function getNotificationSettings(): Promise<Record<NotificationType, boolean>> {
    await dbConnect();
    const doc = await NotificationSettings.findOne().lean();
    return {
        businessOrderAccepted: doc?.businessOrderAccepted ?? true,
        businessOrderPickedUp: doc?.businessOrderPickedUp ?? true,
        businessOrderDelivered: doc?.businessOrderDelivered ?? true,
        businessOrderCancelled: doc?.businessOrderCancelled ?? true,
        driverNewOrder: doc?.driverNewOrder ?? true,
        driverOrderCancelled: doc?.driverOrderCancelled ?? true,
        businessRecharge: doc?.businessRecharge ?? true,
    };
}

async function createInAppNotification(userId: string, payload: PushPayload): Promise<void> {
    try {
        await dbConnect();
        await InAppNotification.create({
            userId,
            title: payload.title,
            body: payload.body,
            url: payload.url,
        });
    } catch (e) {
        console.error("[Push] In-app notification create error:", e);
    }
}

/** Envía push a un usuario solo si el tipo está habilitado en admin. */
export async function sendPushIfEnabled(
    type: NotificationType,
    userId: string,
    payload: PushPayload
): Promise<{ sent: number; failed: number }> {
    const settings = await getNotificationSettings();
    if (!settings[type]) return { sent: 0, failed: 0 };
    createInAppNotification(userId, payload).catch(() => {});
    return sendPushToUser(userId, payload);
}

/** Envía push a varios usuarios solo si el tipo está habilitado. */
export async function sendPushToUsersIfEnabled(
    type: NotificationType,
    userIds: string[],
    payload: PushPayload
): Promise<{ sent: number; failed: number }> {
    const settings = await getNotificationSettings();
    if (!settings[type] || userIds.length === 0) return { sent: 0, failed: 0 };
    for (const uid of userIds) createInAppNotification(uid, payload).catch(() => {});
    let totalSent = 0;
    let totalFailed = 0;
    for (const uid of userIds) {
        const r = await sendPushToUser(uid, payload);
        totalSent += r.sent;
        totalFailed += r.failed;
    }
    return { sent: totalSent, failed: totalFailed };
}

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
            const keys = {
                p256dh: toBase64UrlSafe(sub.keys.p256dh),
                auth: toBase64UrlSafe(sub.keys.auth),
            };
            await webPush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys,
                },
                message,
                { TTL: 86400 }
            );
            sent++;
        } catch (err: unknown) {
            failed++;
            const status = (err as { statusCode?: number })?.statusCode;
            console.error("[Push] Send failed:", (err as Error)?.message, "status:", status, "userId:", userId, "endpoint:", sub.endpoint?.slice(0, 80));
            if (status === 410 || status === 404) {
                await PushSubscription.deleteOne({ _id: sub._id });
            }
        }
    }

    return { sent, failed };
}
