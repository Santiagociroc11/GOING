import { NextResponse } from "next/server";

export async function GET() {
    const key = process.env.VAPID_PUBLIC_KEY?.replace(/\s/g, "").trim();
    if (!key) {
        return NextResponse.json({ error: "Push not configured" }, { status: 503 });
    }
    return NextResponse.json({ publicKey: key });
}
