import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

/**
 * Crea el primer usuario ADMIN con contraseña hasheada.
 * Solo funciona si SEED_ADMIN_SECRET está definido y coincide con el request.
 * Ejemplo: POST /api/auth/seed-admin
 * Body: { secret: "tu-secret", email: "admin@example.com", password: "tu-password", name: "Admin" }
 */
export async function POST(req: Request) {
    try {
        const secret = process.env.SEED_ADMIN_SECRET;
        if (!secret) {
            return NextResponse.json(
                { message: "SEED_ADMIN_SECRET no configurado. Añade esta variable en .env.local para habilitar el seed." },
                { status: 503 }
            );
        }

        const body = await req.json();
        const { secret: reqSecret, email, password, name } = body;

        if (reqSecret !== secret) {
            return NextResponse.json({ message: "Secret inválido" }, { status: 401 });
        }

        if (!email || !password || !name) {
            return NextResponse.json(
                { message: "Faltan email, password o name" },
                { status: 400 }
            );
        }

        await dbConnect();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // Actualizar password si el usuario existe (p. ej. fue creado con password en texto plano)
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            existingUser.password = hashedPassword;
            existingUser.role = "ADMIN";
            existingUser.active = true;
            await existingUser.save();
            return NextResponse.json({
                message: "Usuario actualizado con contraseña hasheada. Ya puedes iniciar sesión.",
                email: existingUser.email,
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = new User({
            name,
            email,
            password: hashedPassword,
            role: "ADMIN",
            city: "BOGOTA", // Valor por defecto, el admin puede cambiar tarifas de cualquier ciudad
            active: true,
        });

        await newAdmin.save();

        return NextResponse.json({
            message: "Admin creado. Ya puedes iniciar sesión.",
            email: newAdmin.email,
        });
    } catch (error: unknown) {
        console.error("Seed admin error:", error);
        return NextResponse.json({ message: "Error al crear admin" }, { status: 500 });
    }
}
