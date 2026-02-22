import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getEffectiveSession } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";
import User from "@/models/User";
import webPush from "web-push";

const vapidPublic = process.env.VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@going.app";

function toBase64UrlSafe(value: string): string {
    if (!value) return value;
    return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        let targetUserId = body.userId || body.targetUserId;
        if (body.useCurrentUser) {
            const effective = await getEffectiveSession();
            targetUserId = (effective?.user as any)?.id;
        } else if (body.useMyself) {
            targetUserId = (session.user as any).id;
        }
        if (!targetUserId) {
            return NextResponse.json({ message: "Selecciona un usuario o usa 'Probar a mí mismo'" }, { status: 400 });
        }

        const logs: string[] = [];
        const pushLog = (msg: string) => {
            logs.push(msg);
            console.log("[TestPush]", msg);
        };

        pushLog("1. Verificando VAPID...");
        if (!vapidPublic || !vapidPrivate) {
            return NextResponse.json({
                ok: false,
                logs,
                error: "VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY no configurados en .env",
            });
        }
        webPush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
        pushLog(`   VAPID OK. Subject: ${vapidSubject}`);

        pushLog("2. Buscando usuario...");
        await dbConnect();
        const user = await User.findById(targetUserId).select("name email role").lean();
        if (!user) {
            return NextResponse.json({ ok: false, logs, error: "Usuario no encontrado" });
        }
        pushLog(`   Usuario: ${(user as any).name} (${(user as any).email})`);

        pushLog("3. Buscando suscripciones push...");
        const subs = await PushSubscription.find({ userId: targetUserId }).lean();
        pushLog(`   Encontradas: ${subs.length} suscripción(es)`);

        if (subs.length === 0) {
            return NextResponse.json({
                ok: false,
                logs,
                error: "El usuario no tiene suscripciones push. Debe activar notificaciones desde la app (como ese usuario).",
                hint: "El usuario debe: 1) Abrir la app, 2) Hacer clic en 'Activar notificaciones', 3) Aceptar el permiso del navegador.",
            });
        }

        const message = JSON.stringify({
            title: "Prueba de notificación",
            body: `Enviado por admin a las ${new Date().toLocaleTimeString()}`,
            url: "/dashboard",
        });

        const results: { endpoint: string; ok: boolean; error?: string; statusCode?: number }[] = [];
        pushLog("4. Enviando push a cada suscripción...");

        for (const sub of subs) {
            const endpointShort = sub.endpoint.slice(0, 60) + "...";
            try {
                const keys = {
                    p256dh: toBase64UrlSafe(sub.keys.p256dh),
                    auth: toBase64UrlSafe(sub.keys.auth),
                };
                await webPush.sendNotification(
                    { endpoint: sub.endpoint, keys },
                    message,
                    { TTL: 86400 }
                );
                pushLog(`   ✓ Enviado a ${endpointShort}`);
                results.push({ endpoint: endpointShort, ok: true });
            } catch (err: unknown) {
                const status = (err as { statusCode?: number })?.statusCode;
                const msg = (err as Error)?.message;
                pushLog(`   ✗ Falló: ${msg} (status: ${status})`);
                results.push({ endpoint: endpointShort, ok: false, error: msg, statusCode: status });
            }
        }

        const allOk = results.every((r) => r.ok);
        return NextResponse.json({
            ok: allOk,
            logs,
            results,
            summary: {
                total: subs.length,
                sent: results.filter((r) => r.ok).length,
                failed: results.filter((r) => !r.ok).length,
            },
        });
    } catch (error) {
        console.error("[TestPush] Error:", error);
        return NextResponse.json(
            { ok: false, error: (error as Error)?.message || "Error interno" },
            { status: 500 }
        );
    }
}
