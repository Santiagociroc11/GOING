import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
    try {
        const session = await getEffectiveSession();
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (role !== "BUSINESS" && role !== "DRIVER") {
            return NextResponse.json({ message: "Solo negocios y domiciliarios tienen saldo" }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findById((session.user as any).id).select("balance");
        if (!user) {
            return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ balance: user.balance ?? 0 });
    } catch (error) {
        return NextResponse.json({ message: "Error al obtener saldo" }, { status: 500 });
    }
}
