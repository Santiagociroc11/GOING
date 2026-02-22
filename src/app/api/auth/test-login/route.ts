import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

/**
 * Diagnóstico: verifica paso a paso por qué falla el login.
 * Activo con DEBUG_AUTH=1 o en desarrollo (NODE_ENV !== production)
 */
export async function POST(req: Request) {
    const debugEnabled = process.env.DEBUG_AUTH === "1" || process.env.NODE_ENV !== "production";
    if (!debugEnabled) {
        return NextResponse.json({ error: "Deshabilitado" }, { status: 404 });
    }

    try {
        const { email, password } = await req.json();
        if (!email || !password) {
            return NextResponse.json({ ok: false, step: "missing_input" });
        }

        const emailNorm = String(email).trim().toLowerCase();
        await dbConnect();

        const user = await User.findOne({
            email: { $regex: new RegExp(`^${emailNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        });

        if (!user) {
            return NextResponse.json({ ok: false, step: "user_not_found", email: emailNorm });
        }
        if (!user.password) {
            return NextResponse.json({ ok: false, step: "no_password_in_db" });
        }

        const isBcrypt = user.password.startsWith("$2");
        const match = isBcrypt
            ? await bcrypt.compare(password, user.password)
            : password === user.password;

        if (!match) {
            return NextResponse.json({
                ok: false,
                step: "password_mismatch",
                isBcrypt,
                hint: isBcrypt ? "La contraseña en DB está hasheada" : "Comparación texto plano",
            });
        }
        if (user.active === false) {
            return NextResponse.json({ ok: false, step: "user_inactive" });
        }

        return NextResponse.json({ ok: true, step: "authorize_ok", role: user.role });
    } catch (e) {
        return NextResponse.json({ ok: false, step: "error", error: String(e) }, { status: 500 });
    }
}
