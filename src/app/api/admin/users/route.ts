import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const users = await User.find({})
            .select("-password")
            .sort({ createdAt: -1 });

        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching users" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            name,
            email,
            password,
            role,
            city,
            active = true,
            businessDetails,
            driverDetails,
            storePlainPassword,
        } = body;

        if (!name || !email || !password || !role || !city) {
            return NextResponse.json(
                { message: "Faltan campos: name, email, password, role, city" },
                { status: 400 }
            );
        }

        if (!["BUSINESS", "DRIVER", "ADMIN"].includes(role)) {
            return NextResponse.json({ message: "Rol inválido" }, { status: 400 });
        }

        await dbConnect();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: "Ya existe un usuario con ese email" },
                { status: 409 }
            );
        }

        const normalizedCity = (city as string)
            .trim()
            .toUpperCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "");

        const newUser = new User({
            name,
            email,
            password: storePlainPassword ? password : await bcrypt.hash(password, await bcrypt.genSalt(10)),
            role,
            city: normalizedCity,
            active: !!active,
            businessDetails: role === "BUSINESS" ? businessDetails : undefined,
            driverDetails: role === "DRIVER" ? driverDetails : undefined,
        });

        await newUser.save();

        const { password: _, ...userWithoutPassword } = newUser.toObject();
        return NextResponse.json(userWithoutPassword, { status: 201 });
    } catch (error: unknown) {
        console.error("Create user error:", error);
        return NextResponse.json({ message: "Error al crear usuario" }, { status: 500 });
    }
}
