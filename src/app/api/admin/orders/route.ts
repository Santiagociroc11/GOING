import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();
    const limit = Math.min(
        parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
        MAX_LIMIT
    );
    const skip = Math.max(0, parseInt(searchParams.get("skip") || "0", 10) || 0);

    await dbConnect();
    const query: Record<string, unknown> = {};
    if (city) query.city = new RegExp(city, "i");
    if (status) query.status = status;
    if (search && search.length >= 3) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        (query as Record<string, unknown>).$expr = {
            $regexMatch: { input: { $toString: "$_id" }, regex: escaped, options: "i" },
        };
    }

    const [orders, total, cities] = await Promise.all([
        Order.find(query)
            .populate("businessId", "name email businessDetails")
            .populate("driverId", "name email driverDetails")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Order.countDocuments(query),
        Order.distinct("city", query).then((c) => c.sort()),
    ]);

    return NextResponse.json({ orders, total, limit, skip, cities });
}
