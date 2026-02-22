import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Rate from "@/models/Rate";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { basePrice, pricePerKm } = body;

        await dbConnect();

        const updateData: Record<string, number> = {};
        if (basePrice !== undefined && !isNaN(Number(basePrice))) updateData.basePrice = Number(basePrice);
        if (pricePerKm !== undefined && !isNaN(Number(pricePerKm))) updateData.pricePerKm = Number(pricePerKm);

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: "No valid fields to update" }, { status: 400 });
        }

        const updated = await Rate.findByIdAndUpdate(id, { $set: updateData }, { new: true });
        if (!updated) {
            return NextResponse.json({ message: "Rate not found" }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ message: "Error updating rate" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { id } = await params;
        await Rate.findByIdAndDelete(id);

        return NextResponse.json({ message: "Rate deleted successfully" });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting rate" }, { status: 500 });
    }
}
