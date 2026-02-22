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
    const { endpoint } = body as { endpoint?: string };

    if (!endpoint) {
        return NextResponse.json({ message: "Endpoint required" }, { status: 400 });
    }

    await dbConnect();
    await PushSubscription.deleteOne({ endpoint, userId });
    return NextResponse.json({ ok: true });
}
