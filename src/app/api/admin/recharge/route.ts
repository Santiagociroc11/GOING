import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { rechargeBusinessBalance } from "@/lib/wallet";
import { sendPushIfEnabled } from "@/lib/push";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { businessId, amount, note } = body;

        if (!businessId || amount == null) {
            return NextResponse.json(
                { message: "Se requieren businessId y amount" },
                { status: 400 }
            );
        }

        await dbConnect();
        const result = await rechargeBusinessBalance(
            businessId,
            Number(amount),
            (session.user as any).id,
            note
        );

        if (!result.ok) {
            return NextResponse.json({ message: result.message }, { status: 400 });
        }

        sendPushIfEnabled("businessRecharge", businessId, {
            title: "Recarga de saldo",
            body: `Se recargó tu saldo con $${Number(amount).toLocaleString()}`,
            url: "/dashboard",
        }).catch(() => {});

        return NextResponse.json({ message: "Recarga exitosa" });
    } catch (error) {
        console.error("Recharge error:", error);
        return NextResponse.json({ message: "Error al recargar" }, { status: 500 });
    }
}
