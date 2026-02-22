import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const { name, email, password, role, city, businessDetails, driverDetails } = await req.json();

        if (!name || !email || !password || !role || !city) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        if (!["BUSINESS", "DRIVER"].includes(role)) {
            return NextResponse.json(
                { message: "Invalid role. Admin accounts cannot be created via registration." },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: "User with this email already exists" },
                { status: 409 }
            );
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Normalize city for consistency with rates (uppercase, no accents)
        const normalizedCity = (city as string)
            .trim()
            .toUpperCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "");

        // Create user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role,
            city: normalizedCity,
            businessDetails: role === "BUSINESS" ? businessDetails : undefined,
            driverDetails: role === "DRIVER" ? driverDetails : undefined,
        });

        await newUser.save();

        return NextResponse.json(
            { message: "User registered successfully" },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { message: "Server error during registration" },
            { status: 500 }
        );
    }
}
