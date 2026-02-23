import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import PlatformSettings from "@/models/PlatformSettings";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const settings = await PlatformSettings.findOne().lean();
    return NextResponse.json({
        commissionRate: settings?.commissionRate ?? 0.3,
        balance: settings?.balance ?? 0,
    });
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const commissionRate = body.commissionRate;

    if (commissionRate == null || typeof commissionRate !== "number") {
        return NextResponse.json({ message: "commissionRate debe ser un número" }, { status: 400 });
    }
    if (commissionRate < 0 || commissionRate > 1) {
        return NextResponse.json({ message: "La tasa debe estar entre 0 y 1 (ej: 0.3 = 30%)" }, { status: 400 });
    }

    await dbConnect();
    const settings = await PlatformSettings.findOneAndUpdate(
        {},
        { $set: { commissionRate } },
        { upsert: true, returnDocument: "after" }
    ).lean();

    return NextResponse.json({
        commissionRate: settings?.commissionRate ?? 0.3,
        balance: settings?.balance ?? 0,
    });
}
