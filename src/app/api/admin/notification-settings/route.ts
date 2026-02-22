import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import NotificationSettings from "@/models/NotificationSettings";
import type { NotificationType } from "@/models/NotificationSettings";

const SETTINGS_KEYS: NotificationType[] = [
    "businessOrderAccepted",
    "businessOrderPickedUp",
    "businessOrderDelivered",
    "businessOrderCancelled",
    "driverNewOrder",
    "driverOrderCancelled",
    "businessRecharge",
];

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        let settings = await NotificationSettings.findOne().lean();
        if (!settings) {
            await NotificationSettings.create({});
            settings = await NotificationSettings.findOne().lean();
        }

        const result: Record<string, boolean> = {};
        for (const k of SETTINGS_KEYS) {
            result[k] = (settings as any)?.[k] ?? true;
        }
        return NextResponse.json(result);
    } catch (error) {
        console.error("Notification settings fetch error:", error);
        return NextResponse.json({ message: "Error al obtener configuración" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const updates: Partial<Record<NotificationType, boolean>> = {};

        for (const k of SETTINGS_KEYS) {
            if (typeof body[k] === "boolean") updates[k] = body[k];
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ message: "No hay cambios válidos" }, { status: 400 });
        }

        await dbConnect();
        const settings = await NotificationSettings.findOneAndUpdate(
            {},
            { $set: updates },
            { upsert: true, returnDocument: "after" }
        ).lean();

        const result: Record<string, boolean> = {};
        for (const k of SETTINGS_KEYS) {
            result[k] = (settings as any)?.[k] ?? true;
        }
        return NextResponse.json(result);
    } catch (error) {
        console.error("Notification settings update error:", error);
        return NextResponse.json({ message: "Error al actualizar configuración" }, { status: 500 });
    }
}
