import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Rating from "@/models/Rating";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getEffectiveSession();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();
        const ratings = await Rating.find({ toUserId: id })
            .populate("fromUserId", "name")
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const avg = ratings.length
            ? ratings.reduce((s, r) => s + (r as any).score, 0) / ratings.length
            : 0;

        return NextResponse.json({
            average: Math.round(avg * 10) / 10,
            count: ratings.length,
            ratings: ratings.map((r: any) => ({
                score: r.score,
                comment: r.comment,
                fromName: r.fromUserId?.name,
                createdAt: r.createdAt,
            })),
        });
    } catch (error) {
        console.error("Rating fetch error:", error);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}
