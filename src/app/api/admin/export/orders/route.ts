import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

function escapeCsv(val: unknown): string {
    if (val == null) return "";
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "1000", 10), 5000);

        await dbConnect();
        const orders = await Order.find({})
            .populate("businessId", "name email businessDetails")
            .populate("driverId", "name email")
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        const headers = ["ID", "Fecha", "Ciudad", "Estado", "Precio", "Negocio", "Domiciliario", "Recogida", "Entrega"];
        const rows = orders.map((o: any) => [
            o._id,
            new Date(o.createdAt).toISOString(),
            o.city,
            o.status,
            o.price,
            o.businessId?.businessDetails?.companyName || o.businessId?.name || "",
            o.driverId?.name || "",
            o.pickupInfo?.address || "",
            o.dropoffInfo?.address || "",
        ]);

        const csv = [headers.join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");
        const bom = "\uFEFF";

        return new NextResponse(bom + csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"`,
            },
        });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ message: "Error al exportar" }, { status: 500 });
    }
}
