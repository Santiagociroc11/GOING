import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Rate from "@/models/Rate";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const rates = await Rate.find({}).sort({ city: 1 });
        return NextResponse.json(rates);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching rates" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { city, basePrice, pricePerKm } = body;

        if (!city || basePrice === undefined) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        await dbConnect();

        // Check if city already exists
        const existing = await Rate.findOne({ city: city.toUpperCase() });
        if (existing) {
            return NextResponse.json({ message: "Rate for this city already exists" }, { status: 400 });
        }

        const newRate = new Rate({
            city: city.toUpperCase(),
            basePrice,
            pricePerKm: pricePerKm || 0,
        });

        await newRate.save();
        return NextResponse.json(newRate, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Error saving rate" }, { status: 500 });
    }
}
