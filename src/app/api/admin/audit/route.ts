import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import WalletTransaction from "@/models/WalletTransaction";
import AdminAuditLog from "@/models/AdminAuditLog";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type"); // "recharges" | "actions" | "all"
        const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 200);

        await dbConnect();

        if (type === "recharges") {
            const recharges = await WalletTransaction.find({ type: "RECHARGE" })
                .populate("userId", "name email businessDetails")
                .populate("createdBy", "name email")
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();

            return NextResponse.json(recharges);
        }

        if (type === "actions") {
            const actions = await AdminAuditLog.find({})
                .populate("adminId", "name email")
                .populate("targetUserId", "name email role")
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();

            return NextResponse.json(actions);
        }

        // "all" - combined, sorted by date
        const [recharges, actions] = await Promise.all([
            WalletTransaction.find({ type: "RECHARGE" })
                .populate("userId", "name email businessDetails")
                .populate("createdBy", "name email")
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean(),
            AdminAuditLog.find({})
                .populate("adminId", "name email")
                .populate("targetUserId", "name email role")
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean(),
        ]);

        const combined = [
            ...recharges.map((r: any) => ({
                _id: r._id,
                type: "RECHARGE",
                createdAt: r.createdAt,
                admin: r.createdBy,
                targetUser: r.userId,
                amount: r.amount,
                note: r.note,
            })),
            ...actions.map((a: any) => ({
                _id: a._id,
                type: a.action,
                createdAt: a.createdAt,
                admin: a.adminId,
                targetUser: a.targetUserId,
                details: a.details,
            })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);

        return NextResponse.json(combined);
    } catch (error) {
        console.error("Audit fetch error:", error);
        return NextResponse.json({ message: "Error al obtener historial" }, { status: 500 });
    }
}
