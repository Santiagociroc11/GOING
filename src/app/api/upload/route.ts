import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth";
import { uploadFile, isMinioConfigured } from "@/lib/minio";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { randomBytes } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
    try {
        const { ok } = rateLimit(`upload:${getClientIdentifier(req)}`);
        if (!ok) {
            return NextResponse.json({ message: "Demasiadas subidas. Intenta en un minuto." }, { status: 429 });
        }

        const session = await getEffectiveSession();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        if (!isMinioConfigured()) {
            return NextResponse.json({ message: "Almacenamiento no configurado" }, { status: 503 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const prefix = (formData.get("prefix") as string) || "proofs";

        if (!file) {
            return NextResponse.json({ message: "No se envió archivo" }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ message: "Solo imágenes JPEG, PNG o WebP" }, { status: 400 });
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json({ message: "Archivo máximo 5MB" }, { status: 400 });
        }

        const ext = file.name.split(".").pop() || "jpg";
        const objectName = `${prefix}/${randomBytes(8).toString("hex")}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const url = await uploadFile(buffer, objectName, file.type);
        if (!url) {
            return NextResponse.json({ message: "Error al subir archivo" }, { status: 500 });
        }

        return NextResponse.json({ url });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ message: "Error al subir" }, { status: 500 });
    }
}
