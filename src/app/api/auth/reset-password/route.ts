import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

/**
 * Solo en desarrollo: resetea la contraseña del admin a texto plano.
 * POST { "email": "admin@going.com", "password": "admin123" }
 */
export async function POST(req: Request) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Solo en desarrollo" }, { status: 404 });
    }

    try {
        const { email, password } = await req.json();
        if (!email || !password) {
            return NextResponse.json({ error: "Faltan email o password" }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${String(email).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        user.password = password; // texto plano - el login lo acepta
        await user.save();

        return NextResponse.json({
            ok: true,
            message: `Contraseña de ${user.email} actualizada. Usa "${password}" para iniciar sesión.`,
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
