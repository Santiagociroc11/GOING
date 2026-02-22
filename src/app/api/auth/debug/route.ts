import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

/**
 * Endpoint de diagnóstico para verificar la configuración de auth en producción.
 * Eliminar o proteger en producción cuando ya no sea necesario.
 */
export async function GET() {
    try {
        const checks: Record<string, unknown> = {
            NEXTAUTH_URL: process.env.NEXTAUTH_URL || "(no definido - DEBE ser la URL pública de la app)",
            NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "definido" : "NO DEFINIDO",
            MONGODB_URI: process.env.MONGODB_URI ? "definido" : "NO DEFINIDO",
        };

        let mongoStatus = "no intentado";
        let adminExists = false;

        if (process.env.MONGODB_URI) {
            try {
                await dbConnect();
                mongoStatus = "conectado";
                const admin = await User.findOne({ email: "admin@going.com" });
                adminExists = !!admin;
                if (admin) {
                    (checks as any).adminUser = {
                        exists: true,
                        hasPassword: !!admin.password,
                        active: admin.active,
                        role: admin.role,
                    };
                } else {
                    (checks as any).adminUser = { exists: false, hint: "Crea el admin con /api/auth/seed-admin o desde Gestión de Usuarios" };
                }
            } catch (err: unknown) {
                mongoStatus = err instanceof Error ? err.message : "error";
            }
        }

        (checks as any).mongoStatus = mongoStatus;

        const issues: string[] = [];
        if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes("localhost")) {
            issues.push("NEXTAUTH_URL debe ser la URL pública (ej: https://typebot-going-app.wc2hpx.easypanel.host)");
        }
        if (!process.env.NEXTAUTH_SECRET) issues.push("NEXTAUTH_SECRET no está definido");
        if (mongoStatus !== "conectado") issues.push("MongoDB no conecta: " + mongoStatus);
        if (!adminExists) issues.push("No existe usuario admin@going.com en esta base de datos");

        return NextResponse.json({
            checks,
            issues,
            ok: issues.length === 0,
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
