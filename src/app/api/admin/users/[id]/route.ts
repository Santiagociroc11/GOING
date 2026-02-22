import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

function normalizeCity(city: string) {
    return city
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();

        const user = await User.findById(id).select("-password").lean();
        if (!user) {
            return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ message: "Error al obtener usuario" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const {
            name,
            email,
            password,
            role,
            city,
            active,
            businessDetails,
            driverDetails,
            storePlainPassword,
        } = body;

        await dbConnect();

        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
        }

        const updateData: Record<string, unknown> = {};

        if (name != null && typeof name === "string" && name.trim()) {
            updateData.name = name.trim();
        }
        if (email != null && typeof email === "string" && email.trim()) {
            const emailTrim = email.trim().toLowerCase();
            const existing = await User.findOne({ email: { $regex: new RegExp(`^${emailTrim.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }, _id: { $ne: id } });
            if (existing) {
                return NextResponse.json({ message: "Ya existe otro usuario con ese email" }, { status: 409 });
            }
            updateData.email = emailTrim;
        }
        if (password != null && typeof password === "string" && password.length > 0) {
            updateData.password = storePlainPassword ? password : await bcrypt.hash(password, await bcrypt.genSalt(10));
        }
        if (role != null && ["BUSINESS", "DRIVER", "ADMIN"].includes(role)) {
            updateData.role = role;
        }
        if (city != null && typeof city === "string" && city.trim()) {
            updateData.city = normalizeCity(city);
        }
        if (typeof active === "boolean") {
            updateData.active = active;
        }
        const effectiveRole = role ?? user.role;
        if (effectiveRole === "BUSINESS" && businessDetails != null) {
            updateData.businessDetails = {
                companyName: businessDetails.companyName ?? user.businessDetails?.companyName,
                taxId: businessDetails.taxId ?? user.businessDetails?.taxId,
            };
        }
        if (effectiveRole === "DRIVER" && driverDetails != null) {
            updateData.driverDetails = {
                vehicleType: driverDetails.vehicleType ?? user.driverDetails?.vehicleType,
                licensePlate: driverDetails.licensePlate ?? user.driverDetails?.licensePlate,
            };
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: "No hay campos válidos para actualizar" }, { status: 400 });
        }

        const updated = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true })
            .select("-password")
            .lean();

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update user error:", error);
        return NextResponse.json({ message: "Error al actualizar usuario" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        if (id === (session.user as any).id) {
            return NextResponse.json({ message: "No puedes eliminar tu propia cuenta" }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
        }

        // Soft delete: desactivar en lugar de borrar (preserva historial de órdenes)
        await User.findByIdAndUpdate(id, { $set: { active: false } });

        return NextResponse.json({ message: "Usuario desactivado correctamente" });
    } catch (error) {
        console.error("Delete user error:", error);
        return NextResponse.json({ message: "Error al eliminar usuario" }, { status: 500 });
    }
}
