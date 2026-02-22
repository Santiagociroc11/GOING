import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, IMPERSONATE_COOKIE } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { logAdminAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId) {
        return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    await dbConnect();
    const target = await User.findById(userId).select("name email role");
    if (!target) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const value = encodeURIComponent(
        JSON.stringify({
            userId: target._id.toString(),
            userName: target.name,
            userEmail: target.email,
            userRole: target.role,
        })
    );

    await logAdminAction(
        (session.user as any).id,
        "IMPERSONATE_START",
        target._id,
        { targetName: target.name, targetRole: target.role }
    );

    const res = NextResponse.json({ ok: true, redirect: "/dashboard" });
    res.cookies.set(IMPERSONATE_COOKIE, value, {
        path: "/",
        maxAge: 60 * 60 * 2, // 2 horas
        httpOnly: true,
        sameSite: "lax",
        secure: (process.env.NEXTAUTH_URL || "").startsWith("https://"),
    });
    return res;
}
