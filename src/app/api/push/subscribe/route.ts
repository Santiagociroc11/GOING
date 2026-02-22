import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, keys } = body as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return NextResponse.json({ message: "Invalid subscription" }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || undefined;

    await dbConnect();
    await PushSubscription.findOneAndUpdate(
        { endpoint },
        {
            userId,
            endpoint,
            keys: { p256dh: keys.p256dh, auth: keys.auth },
            userAgent,
        },
        { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true });
}
