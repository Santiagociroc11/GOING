import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "BUSINESS") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById((session.user as any).id)
        .select("businessDetails")
        .lean();

    const bd = (user as any)?.businessDetails;
    return NextResponse.json({
        pickupAddress: bd?.pickupAddress ?? "",
        pickupContactName: bd?.pickupContactName ?? "",
        pickupContactPhone: bd?.pickupContactPhone ?? "",
    });
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "BUSINESS") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { pickupAddress, pickupContactName, pickupContactPhone } = body;

    await dbConnect();
    const user = await User.findById((session.user as any).id);
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    user.businessDetails = user.businessDetails ?? {};
    if (pickupAddress != null) user.businessDetails.pickupAddress = String(pickupAddress);
    if (pickupContactName != null) user.businessDetails.pickupContactName = String(pickupContactName);
    if (pickupContactPhone != null) user.businessDetails.pickupContactPhone = String(pickupContactPhone);
    await user.save();

    return NextResponse.json({
        pickupAddress: user.businessDetails.pickupAddress ?? "",
        pickupContactName: user.businessDetails.pickupContactName ?? "",
        pickupContactPhone: user.businessDetails.pickupContactPhone ?? "",
    });
}
