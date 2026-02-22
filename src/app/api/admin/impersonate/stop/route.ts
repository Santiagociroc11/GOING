import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, IMPERSONATE_COOKIE } from "@/lib/auth";

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, redirect: "/dashboard" });
    res.cookies.delete(IMPERSONATE_COOKIE);
    return res;
}
